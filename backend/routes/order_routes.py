"""Order routes — RBAC: users see own orders, admins/staff see all"""

from flask import Blueprint, request, jsonify
from utils import server_error, log_action
from controllers.order_controller import (
    create_order, get_order_by_id, get_user_orders, get_all_orders,
    update_order_status, cancel_order, get_orders_by_status,
)
from auth_middleware import token_required, has_permission
from schemas import OrderSchema, validate_schema

order_routes = Blueprint('orders', __name__, url_prefix='/api/orders')


@order_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    """Place a new order — calls process_order stored procedure."""
    try:
        raw = request.get_json(silent=True) or {}
        data, err = validate_schema(OrderSchema, raw)
        if err:
            return jsonify({"error": err}), 400

        order, error = create_order(current_user_id, data)
        if error:
            return jsonify({"error": error}), 400
            
        log_action(current_user_id, "create_order", "orders", order.get("id"), "Order placed")
        return jsonify({"message": "Order placed successfully", "data": order}), 201
    except Exception as e:
        return server_error(e)


@order_routes.route('', methods=['GET'])
@token_required
def list_orders(current_user_id):
    """Admin/staff: all orders. Customer: own orders only."""
    try:
        limit  = request.args.get('limit',  type=int)
        offset = request.args.get('offset', type=int)

        if has_permission(current_user_id, 'orders.manage'):
            orders, error = get_all_orders(limit, offset)
        else:
            orders, error = get_user_orders(current_user_id, limit, offset)

        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": orders, "count": len(orders) if orders else 0}), 200
    except Exception as e:
        return server_error(e)


@order_routes.route('/<int:order_id>', methods=['GET'])
@token_required
def get(current_user_id, order_id):
    """Get a single order — customers can only see their own."""
    try:
        order, error = get_order_by_id(order_id)
        if error or not order:
            return jsonify({"error": error or "Order not found"}), 404

        if not has_permission(current_user_id, 'orders.manage') and order['user_id'] != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403

        return jsonify({"data": order}), 200
    except Exception as e:
        return server_error(e)


@order_routes.route('/<int:order_id>/status', methods=['PUT'])
@token_required
def update_status(current_user_id, order_id):
    """Update order status — admin/staff only."""
    try:
        if not has_permission(current_user_id, 'orders.manage'):
            return jsonify({"error": "Access denied."}), 403

        data = request.get_json(silent=True) or {}
        success, error = update_order_status(order_id, data.get('status'))
        if error:
            return jsonify({"error": error}), 400

        order, _ = get_order_by_id(order_id)
        
        log_action(current_user_id, "update_status", "orders", order_id, f"Status updated to {data.get('status')}")
        return jsonify({"message": "Order status updated", "data": order}), 200
    except Exception as e:
        return server_error(e)


@order_routes.route('/<int:order_id>/cancel', methods=['POST'])
@token_required
def cancel(current_user_id, order_id):
    """Cancel an order — customer can cancel own pending orders."""
    try:
        order, error = get_order_by_id(order_id)
        if error or not order:
            return jsonify({"error": "Order not found"}), 404

        if not has_permission(current_user_id, 'orders.manage') and order['user_id'] != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403

        success, error = cancel_order(order_id)
        if error:
            return jsonify({"error": error}), 400

        updated, _ = get_order_by_id(order_id)
        
        log_action(current_user_id, "cancel_order", "orders", order_id, "Order cancelled")
        return jsonify({"message": "Order cancelled successfully", "data": updated}), 200
    except Exception as e:
        return server_error(e)


@order_routes.route('/status/<status>', methods=['GET'])
@token_required
def get_by_status(current_user_id, status):
    """Get orders by status — admin/staff only."""
    try:
        if not has_permission(current_user_id, 'orders.manage'):
            return jsonify({"error": "Access denied."}), 403

        orders, error = get_orders_by_status(status)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"data": orders, "count": len(orders) if orders else 0, "status": status}), 200
    except Exception as e:
        return server_error(e)


