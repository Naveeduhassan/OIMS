"""Transaction routes — RBAC"""

from flask import Blueprint, request, jsonify
from utils import server_error
from controllers.transaction_controller import (
    create_transaction, get_transaction_by_id, get_transaction_by_order,
    get_all_transactions, update_payment_status, get_payment_statistics,
    get_transactions_by_status,
)
from auth_middleware import token_required
from controllers.user_controller import get_user_by_id

transaction_routes = Blueprint('transactions', __name__, url_prefix='/api/transactions')


def _is_admin(user_id):
    user, _ = get_user_by_id(user_id)
    return user and user['role'] == 'admin'


@transaction_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    try:
        data = request.get_json()
        transaction, error = create_transaction(data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Transaction created successfully", "data": transaction}), 201
    except Exception as e:
        return server_error(e)


@transaction_routes.route('', methods=['GET'])
@token_required
def list_transactions(current_user_id):
    try:
        if not _is_admin(current_user_id):
            return jsonify({"error": "Access denied. Admin only."}), 403
        limit  = request.args.get('limit',  type=int)
        offset = request.args.get('offset', type=int)
        transactions, error = get_all_transactions(limit, offset)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": transactions, "count": len(transactions) if transactions else 0}), 200
    except Exception as e:
        return server_error(e)


@transaction_routes.route('/<int:transaction_id>', methods=['GET'])
@token_required
def get(current_user_id, transaction_id):
    try:
        transaction, error = get_transaction_by_id(transaction_id)
        if error or not transaction:
            return jsonify({"error": error or "Transaction not found"}), 404
        user, _ = get_user_by_id(current_user_id)
        if user['role'] != 'admin' and transaction.get('user_id') != current_user_id:
            return jsonify({"error": "Unauthorized"}), 403
        return jsonify({"data": transaction}), 200
    except Exception as e:
        return server_error(e)


@transaction_routes.route('/order/<int:order_id>', methods=['GET'])
@token_required
def get_by_order(current_user_id, order_id):
    try:
        transaction, error = get_transaction_by_order(order_id)
        if not transaction:
            return jsonify({"error": "Transaction not found"}), 404
        return jsonify({"data": transaction}), 200
    except Exception as e:
        return server_error(e)


@transaction_routes.route('/<int:transaction_id>/payment-status', methods=['PUT'])
@token_required
def update_status(current_user_id, transaction_id):
    try:
        if not _is_admin(current_user_id):
            return jsonify({"error": "Access denied. Admin only."}), 403
        data = request.get_json()
        success, error = update_payment_status(transaction_id, data.get('payment_status'))
        if error:
            return jsonify({"error": error}), 400
        transaction, _ = get_transaction_by_id(transaction_id)
        return jsonify({"message": "Payment status updated", "data": transaction}), 200
    except Exception as e:
        return server_error(e)


@transaction_routes.route('/status/<payment_status>', methods=['GET'])
@token_required
def get_by_status(current_user_id, payment_status):
    try:
        if not _is_admin(current_user_id):
            return jsonify({"error": "Access denied. Admin only."}), 403
        transactions, error = get_transactions_by_status(payment_status)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"data": transactions,
                        "count": len(transactions) if transactions else 0,
                        "payment_status": payment_status}), 200
    except Exception as e:
        return server_error(e)


@transaction_routes.route('/statistics', methods=['GET'])
@token_required
def statistics(current_user_id):
    try:
        if not _is_admin(current_user_id):
            return jsonify({"error": "Access denied. Admin only."}), 403
        stats, error = get_payment_statistics()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": stats}), 200
    except Exception as e:
        return server_error(e)


