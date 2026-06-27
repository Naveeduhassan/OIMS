"""Supplier routes — full CRUD with RBAC"""

from flask import Blueprint, request, jsonify
from utils import server_error
from controllers.supplier_controller import (
    create_supplier, get_supplier_by_id, get_all_suppliers,
    update_supplier, delete_supplier, search_suppliers,
)
from auth_middleware import token_required, has_permission

supplier_routes = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')


# ── Public ────────────────────────────────────────────────────────────────────

@supplier_routes.route('', methods=['GET'])
def list_suppliers():
    try:
        suppliers, error = get_all_suppliers()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": suppliers, "count": len(suppliers) if suppliers else 0}), 200
    except Exception as e:
        return server_error(e)


@supplier_routes.route('/search', methods=['GET'])
def search():
    try:
        q = request.args.get('q', '')
        if not q:
            return jsonify({"error": "Search query required"}), 400
        suppliers, error = search_suppliers(q)
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": suppliers, "count": len(suppliers) if suppliers else 0}), 200
    except Exception as e:
        return server_error(e)


@supplier_routes.route('/<int:supplier_id>', methods=['GET'])
def get(supplier_id):
    try:
        supplier, error = get_supplier_by_id(supplier_id)
        if error or not supplier:
            return jsonify({"error": error or "Supplier not found"}), 404
        return jsonify({"data": supplier}), 200
    except Exception as e:
        return server_error(e)


# ── Admin-only ────────────────────────────────────────────────────────────────

@supplier_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    try:
        if not has_permission(current_user_id, 'suppliers.manage'):
            return jsonify({"error": "Access denied."}), 403
        data = request.get_json()
        supplier, error = create_supplier(data)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Supplier created successfully", "data": supplier}), 201
    except Exception as e:
        return server_error(e)


@supplier_routes.route('/<int:supplier_id>', methods=['PUT'])
@token_required
def update(current_user_id, supplier_id):
    try:
        if not has_permission(current_user_id, 'suppliers.manage'):
            return jsonify({"error": "Access denied."}), 403
        data = request.get_json()
        success, error = update_supplier(supplier_id, data)
        if error:
            return jsonify({"error": error}), 400
        supplier, _ = get_supplier_by_id(supplier_id)
        return jsonify({"message": "Supplier updated successfully", "data": supplier}), 200
    except Exception as e:
        return server_error(e)


@supplier_routes.route('/<int:supplier_id>', methods=['DELETE'])
@token_required
def delete(current_user_id, supplier_id):
    try:
        if not has_permission(current_user_id, 'suppliers.manage'):
            return jsonify({"error": "Access denied."}), 403
        success, error = delete_supplier(supplier_id)
        if error:
            return jsonify({"error": error}), 400
        return jsonify({"message": "Supplier deleted successfully"}), 200
    except Exception as e:
        return server_error(e)


