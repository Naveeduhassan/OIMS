"""Product routes — full CRUD with RBAC"""

import os
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app
from utils import server_error
from controllers.product_controller import (
    create_product, get_product_by_id, get_all_products,
    search_products, get_products_by_category, update_product,
    delete_product, get_low_stock_products,
)
from auth_middleware import token_required, has_permission

product_routes = Blueprint('products', __name__, url_prefix='/api/products')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── Public endpoints ─────────────────────────────────────────────────────────

@product_routes.route('', methods=['GET'])
def list_products():
    try:
        limit  = request.args.get('limit',  type=int)
        offset = request.args.get('offset', type=int)
        products, error = get_all_products(limit, offset)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": products, "count": len(products)}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('/search', methods=['GET'])
def search():
    try:
        q = request.args.get('q', '')
        if not q:
            return jsonify({"error": "Search query required"}), 400
        products, error = search_products(q)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": products, "count": len(products)}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('/category/<int:category_id>', methods=['GET'])
def get_by_category(category_id):
    try:
        products, error = get_products_by_category(category_id)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": products, "count": len(products)}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('/<int:product_id>', methods=['GET'])
def get(product_id):
    try:
        product, error = get_product_by_id(product_id)
        if error or not product:
            return jsonify({"error": error or "Product not found"}), 404
        return jsonify({"data": product}), 200
    except Exception as e:
        return server_error(e)


# ── Admin-only endpoints ──────────────────────────────────────────────────────

@product_routes.route('/low-stock', methods=['GET'])
@token_required
def low_stock(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.view'):
            return jsonify({"error": "Access denied. Admin only."}), 403
        threshold = request.args.get('threshold', 10, type=int)
        products, error = get_low_stock_products(threshold)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": products, "count": len(products), "threshold": threshold}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.create'):
            return jsonify({"error": "Access denied."}), 403
        data = request.get_json()
        product, error = create_product(data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Product created successfully", "data": product}), 201
    except Exception as e:
        return server_error(e)


@product_routes.route('/<int:product_id>', methods=['PUT'])
@token_required
def update(current_user_id, product_id):
    """Update product — admin only.
    NOTE: token_required injects current_user_id as the FIRST positional arg;
    Flask passes product_id as a keyword arg from the URL rule.
    """
    try:
        if not has_permission(current_user_id, 'products.edit'):
            return jsonify({"error": "Access denied."}), 403
        data = request.get_json()
        success, error = update_product(product_id, data)
        if error:
            return jsonify({"error": error}), 400
        product, _ = get_product_by_id(product_id)
        return jsonify({"message": "Product updated successfully", "data": product}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('/<int:product_id>', methods=['DELETE'])
@token_required
def delete(current_user_id, product_id):
    try:
        if not has_permission(current_user_id, 'products.delete'):
            return jsonify({"error": "Access denied."}), 403
        success, error = delete_product(product_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        return server_error(e)


@product_routes.route('/upload-image', methods=['POST'])
@token_required
def upload_image(current_user_id):
    """Uploads a product image and returns the public URL."""
    try:
        if not has_permission(current_user_id, 'products.edit'):
            return jsonify({"error": "Access denied."}), 403
        if 'image' not in request.files:
            return jsonify({"error": "No image part in the request"}), 400
        file = request.files['image']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid collisions
            import time
            filename = f"{int(time.time())}_{filename}"
            
            upload_folder = os.path.join(current_app.root_path, 'static', 'uploads', 'products')
            os.makedirs(upload_folder, exist_ok=True)
            
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            
            # Create the public URL (Flask serves /static automatically)
            image_url = f"/static/uploads/products/{filename}"
            return jsonify({"message": "File uploaded successfully", "image_url": image_url}), 200
            
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"}), 400
    except Exception as e:
        return server_error(e)
