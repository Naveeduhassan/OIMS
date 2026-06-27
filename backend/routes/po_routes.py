from flask import Blueprint, request, jsonify
from auth_middleware import token_required, has_permission
from controllers.po_controller import get_pos, create_po, receive_po
from utils import server_error

po_routes = Blueprint('pos', __name__, url_prefix='/api/pos')

@po_routes.route('', methods=['GET'])
@token_required
def list_pos(current_user_id):
    if not has_permission(current_user_id, 'inventory.manage'):
        return jsonify({"error": "Access denied"}), 403
    try:
        data, err = get_pos()
        if err: return jsonify({"error": err}), 400
        return jsonify({"data": data})
    except Exception as e:
        return server_error(e)

@po_routes.route('', methods=['POST'])
@token_required
def create(current_user_id):
    if not has_permission(current_user_id, 'inventory.manage'):
        return jsonify({"error": "Access denied"}), 403
    try:
        data = request.get_json()
        result, err = create_po(current_user_id, data)
        if err: return jsonify({"error": err}), 400
        return jsonify({"message": "PO created successfully", "data": result})
    except Exception as e:
        return server_error(e)

@po_routes.route('/<int:po_id>/receive', methods=['POST'])
@token_required
def receive(current_user_id, po_id):
    if not has_permission(current_user_id, 'inventory.manage'):
        return jsonify({"error": "Access denied"}), 403
    try:
        success, err = receive_po(current_user_id, po_id)
        if err: return jsonify({"error": err}), 400
        return jsonify({"message": "PO received successfully"})
    except Exception as e:
        return server_error(e)
