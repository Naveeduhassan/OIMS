"""Category routes — full CRUD with RBAC"""

from flask import Blueprint, request, jsonify
from utils import server_error
from controllers.category_controller import (
    create_category, get_category_by_id, get_all_categories,
    update_category, delete_category, get_category_product_count,
)
from auth_middleware import token_required, has_permission

category_routes = Blueprint('categories', __name__, url_prefix='/api/categories')


# ── Public ────────────────────────────────────────────────────────────────────

@category_routes.route('', methods=['GET'])
def list_categories():
    try:
        categories, error = get_all_categories()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": categories, "count": len(categories) if categories else 0}), 200
    except Exception as e:
        return server_error(e)


@category_routes.route('/<int:category_id>', methods=['GET'])
def get(category_id):
    try:
        category, error = get_category_by_id(category_id)
        if error or not category:
            return jsonify({"error": error or "Category not found"}), 404
        count, _ = get_category_product_count(category_id)
        category['product_count'] = count
        return jsonify({"data": category}), 200
    except Exception as e:
        return server_error(e)


from schemas import CategorySchema, validate_schema

# ── Admin-only ────────────────────────────────────────────────────────────────

@category_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    try:
        if not has_permission(current_user_id, 'inventory.manage'):
            return jsonify({"error": "Access denied."}), 403
        raw = request.get_json(silent=True) or {}
        data, error = validate_schema(CategorySchema, raw)
        if error:
            return jsonify({"error": error}), 400
        category, error = create_category(data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Category created successfully", "data": category}), 201
    except Exception as e:
        return server_error(e)


@category_routes.route('/<int:category_id>', methods=['PUT'])
@token_required
def update(current_user_id, category_id):
    try:
        if not has_permission(current_user_id, 'inventory.manage'):
            return jsonify({"error": "Access denied."}), 403
        raw = request.get_json(silent=True) or {}
        data, error = validate_schema(CategorySchema, raw)
        if error:
            return jsonify({"error": error}), 400
        success, error = update_category(category_id, data)
        if error:
            return jsonify({"error": error}), 400
        category, _ = get_category_by_id(category_id)
        return jsonify({"message": "Category updated successfully", "data": category}), 200
    except Exception as e:
        return server_error(e)


@category_routes.route('/<int:category_id>', methods=['DELETE'])
@token_required
def delete(current_user_id, category_id):
    try:
        if not has_permission(current_user_id, 'inventory.manage'):
            return jsonify({"error": "Access denied."}), 403
        success, error = delete_category(category_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Category deleted successfully"}), 200
    except Exception as e:
        return server_error(e)


