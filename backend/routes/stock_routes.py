"""Stock routes — history is public, mutations are admin-only"""

from flask import Blueprint, request, jsonify
from utils import server_error
from controllers.stock_controller import (
    get_stock_history, adjust_stock, get_total_inventory_value,
    get_inventory_summary, get_low_stock_alert, get_product_movement,
    get_stock_by_category,
)
from auth_middleware import token_required, has_permission

stock_routes = Blueprint('stock', __name__, url_prefix='/api/stock')


# ── Public ────────────────────────────────────────────────────────────────────

@stock_routes.route('/product/<int:product_id>/history', methods=['GET'])
def get_history(product_id):
    try:
        limit  = request.args.get('limit',  type=int)
        offset = request.args.get('offset', type=int)
        history, error = get_stock_history(product_id, limit, offset)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": history, "product_id": product_id,
                        "count": len(history) if history else 0}), 200
    except Exception as e:
        return server_error(e)


# ── Admin/Staff ────────────────────────────────────────────────────────────────

@stock_routes.route('/adjust', methods=['POST'])
@token_required
def adjust(current_user_id):
    try:
        if not has_permission(current_user_id, 'inventory.manage'):
            return jsonify({"error": "Access denied."}), 403
        data = request.get_json()
        result, error = adjust_stock(
            data.get('product_id'),
            int(data.get('quantity', 0)),
            data.get('change_type', 'manual_adjustment'),
            admin_id=current_user_id,
            notes=data.get('notes'),
        )
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Stock adjusted successfully", "data": result}), 200
    except Exception as e:
        return server_error(e)


@stock_routes.route('/value', methods=['GET'])
@token_required
def inventory_value(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.view'):
            return jsonify({"error": "Access denied."}), 403
        value, error = get_total_inventory_value()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": value}), 200
    except Exception as e:
        return server_error(e)


@stock_routes.route('/summary', methods=['GET'])
@token_required
def summary(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.view'):
            return jsonify({"error": "Access denied."}), 403
        summary_data, error = get_inventory_summary()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": summary_data}), 200
    except Exception as e:
        return server_error(e)


@stock_routes.route('/low-stock', methods=['GET'])
@token_required
def low_stock(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.view'):
            return jsonify({"error": "Access denied."}), 403
        threshold = request.args.get('threshold', 10, type=int)
        products, error = get_low_stock_alert(threshold)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": products, "threshold": threshold,
                        "count": len(products) if products else 0}), 200
    except Exception as e:
        return server_error(e)


@stock_routes.route('/product/<int:product_id>/movement', methods=['GET'])
@token_required
def product_movement(current_user_id, product_id):
    try:
        if not has_permission(current_user_id, 'inventory.manage'):
            return jsonify({"error": "Access denied."}), 403
        days = request.args.get('days', 30, type=int)
        movement, error = get_product_movement(product_id, days)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": movement}), 200
    except Exception as e:
        return server_error(e)


@stock_routes.route('/by-category', methods=['GET'])
@token_required
def by_category(current_user_id):
    try:
        if not has_permission(current_user_id, 'products.view'):
            return jsonify({"error": "Access denied."}), 403
        data, error = get_stock_by_category()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": data, "count": len(data) if data else 0}), 200
    except Exception as e:
        return server_error(e)


