"""Authentication routes"""

import json
from flask import Blueprint, request, jsonify
from controllers.user_controller import register_user, login_user, get_user_by_id, update_user, get_all_users
from auth_middleware import token_required
from utils import server_error
from schemas import RegisterSchema, LoginSchema, ProfileUpdateSchema, validate_schema

auth_routes = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_routes.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        raw = request.get_json(silent=True, force=True) or {}
        data, error = validate_schema(RegisterSchema, raw)
        if error:
            return jsonify({"error": error}), 400

        user, error = register_user(data)
        if error:
            return jsonify({"error": error}), 400
        
        return jsonify({
            "message": "User registered successfully",
            "data": user
        }), 201
    except Exception as e:
        return server_error(e)


from flask import current_app

@auth_routes.route('/login', methods=['POST'])
def login():
    limiter = current_app.extensions.get('limiter')
    if limiter:
        limiter.limit("5 per minute")(lambda: None)()
    """Login user and return token"""
    try:
        raw = request.get_json(silent=True, force=True) or {}
        data, error = validate_schema(LoginSchema, raw)
        if error:
            return jsonify({"error": error}), 400

        user, error = login_user(data)
        if error:
            return jsonify({"error": error}), 401
        
        return jsonify({
            "message": "Login successful",
            "data": user
        }), 200
    except Exception as e:
        return server_error(e)

@auth_routes.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get current user profile"""
    try:
        user, error = get_user_by_id(current_user_id)
        
        if error or not user:
            return jsonify({"error": error or "User not found"}), 404
        
        return jsonify({
            "data": user
        }), 200
    except Exception as e:
        return server_error(e)

@auth_routes.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user_id):
    """Update user profile"""
    try:
        raw = request.get_json(silent=True) or {}
        data, error = validate_schema(ProfileUpdateSchema, raw)
        if error:
            return jsonify({"error": error}), 400

        success, error = update_user(current_user_id, data)
        if error:
            return jsonify({"error": error}), 400
        
        # Return updated user
        user, _ = get_user_by_id(current_user_id)
        return jsonify({
            "message": "Profile updated successfully",
            "data": user
        }), 200
    except Exception as e:
        return server_error(e)

@auth_routes.route('/users', methods=['GET'])
@token_required
def list_users(current_user_id):
    """Get all users (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        users, error = get_all_users()
        if error:
            return jsonify({"error": error}), 500
        return jsonify({"data": users}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>', methods=['GET'])
@token_required
def get_user(current_user_id, target_user_id):
    """Get a single user by ID (admin only)"""
    try:
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        target, error = get_user_by_id(target_user_id)
        if error or not target:
            return jsonify({"error": error or "User not found"}), 404
        return jsonify({"data": target}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users', methods=['POST'])
@token_required
def create_user(current_user_id):
    """Create a new user (admin only) — admin can set any role"""
    try:
        from db import execute_query, execute_insert
        from utils import sanitize_input
        from controllers.user_controller import hash_password
        from schemas import UserCreateSchema

        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        raw = request.get_json(silent=True) or {}
        data, error = validate_schema(UserCreateSchema, raw)
        if error:
            return jsonify({"error": error}), 400

        existing = execute_query(
            "SELECT id FROM users WHERE email = %s",
            (data['email'],), fetch_one=True, fetch_all=False
        )
        if existing:
            return jsonify({"error": "Email already registered"}), 400

        user_id = execute_insert(
            "INSERT INTO users (full_name, email, password, role, is_active) VALUES (%s, %s, %s, %s, %s)",
            (sanitize_input(data['full_name']), data['email'], hash_password(data['password']), data['role'], data['is_active'])
        )

        new_user, _ = get_user_by_id(user_id)
        return jsonify({"message": "User created successfully", "data": new_user}), 201
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>', methods=['PUT'])
@token_required
def update_user_admin(current_user_id, target_user_id):
    """Update any user's info (admin only) — can change role, name, email, password"""
    try:
        from db import execute_update
        from utils import sanitize_input
        from controllers.user_controller import hash_password
        from schemas import UserUpdateSchema

        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        target, _ = get_user_by_id(target_user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404

        raw = request.get_json(silent=True) or {}
        data, error = validate_schema(UserUpdateSchema, raw)
        if error:
            return jsonify({"error": error}), 400

        fields, values = [], []

        if 'full_name' in data and data['full_name']:
            fields.append("full_name = %s")
            values.append(sanitize_input(data['full_name']))

        if 'email' in data and data['email']:
            fields.append("email = %s")
            values.append(data['email'])

        if 'password' in data and data['password']:
            fields.append("password = %s")
            values.append(hash_password(data['password']))

        if 'role' in data and data['role']:
            # Prevent admin from removing their own admin role
            if target_user_id == current_user_id and data['role'] != 'admin':
                return jsonify({"error": "You cannot remove your own admin role"}), 400
            fields.append("role = %s")
            values.append(data['role'])

        if 'is_active' in data:
            fields.append("is_active = %s")
            values.append(bool(data['is_active']))

        if not fields:
            return jsonify({"error": "No valid fields to update"}), 400

        values.append(target_user_id)
        execute_update(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)

        updated, _ = get_user_by_id(target_user_id)
        return jsonify({"message": "User updated successfully", "data": updated}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>', methods=['DELETE'])
@token_required
def delete_user(current_user_id, target_user_id):
    """Delete a user (admin only) — cannot delete yourself"""
    try:
        from db import execute_delete

        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        if target_user_id == current_user_id:
            return jsonify({"error": "You cannot delete your own account"}), 400

        target, _ = get_user_by_id(target_user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404

        execute_delete("DELETE FROM users WHERE id = %s", (target_user_id,))
        return jsonify({"message": "User deleted successfully"}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>/role', methods=['PUT'])
@token_required
def change_user_role(current_user_id, target_user_id):
    """Change a user's role (admin only)"""
    try:
        from db import execute_update
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        data = request.get_json()
        new_role = data.get('role')
        if new_role not in ('admin', 'user', 'staff'):
            return jsonify({"error": "Role must be 'admin', 'user', or 'staff'"}), 400

        if target_user_id == current_user_id and new_role != 'admin':
            return jsonify({"error": "You cannot remove your own admin role"}), 400

        target, _ = get_user_by_id(target_user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404

        execute_update("UPDATE users SET role = %s WHERE id = %s", (new_role, target_user_id))
        return jsonify({"message": f"User role updated to {new_role}"}), 200
    except Exception as e:
        return server_error(e)


# ── Permission management endpoints ─────────────────────────────────────────────

@auth_routes.route('/permissions', methods=['GET'])
@token_required
def list_permissions(current_user_id):
    """List all available permissions (admin only)."""
    try:
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        from db import execute_query
        perms = execute_query(
            "SELECT id, slug, description FROM permissions ORDER BY slug",
            fetch_all=True
        )
        return jsonify({"data": perms or []}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>/permissions', methods=['GET'])
@token_required
def get_user_permissions_route(current_user_id, target_user_id):
    """Get a user's granted permissions."""
    try:
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        from auth_middleware import get_user_permissions
        slugs = get_user_permissions(target_user_id)
        return jsonify({"data": slugs}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/users/<int:target_user_id>/permissions', methods=['PUT'])
@token_required
def set_user_permissions_route(current_user_id, target_user_id):
    """Set a user's permissions (admin only). Replaces all existing grants."""
    try:
        from db import execute_query, execute_delete
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        if target_user_id == current_user_id:
            return jsonify({"error": "Cannot modify your own permissions"}), 400
        target, _ = get_user_by_id(target_user_id)
        if not target:
            return jsonify({"error": "User not found"}), 404
        if target['role'] == 'admin':
            return jsonify({"error": "Admins have all permissions by default"}), 400

        data = request.get_json(silent=True) or {}
        slugs = data.get('permissions', [])
        if not isinstance(slugs, list):
            return jsonify({"error": "permissions must be a list of slugs"}), 400

        # Validate slugs exist
        valid = execute_query(
            "SELECT slug FROM permissions WHERE slug = ANY(%s)",
            (slugs,), fetch_all=True
        )
        valid_slugs = set(r['slug'] for r in (valid or []))

        # Replace all grants
        execute_delete("DELETE FROM user_permissions WHERE user_id = %s", (target_user_id,))
        for slug in slugs:
            if slug not in valid_slugs:
                continue
            perm = execute_query(
                "SELECT id FROM permissions WHERE slug = %s",
                (slug,), fetch_one=True, fetch_all=False
            )
            if perm:
                execute_query(
                    "INSERT INTO user_permissions (user_id, permission_id, granted_by) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
                    (target_user_id, perm['id'], current_user_id), fetch_all=False
                )

        # Audit log
        try:
            execute_query(
                "INSERT INTO audit_logs (user_id, action, table_name, record_id, details, created_at) VALUES (%s, 'UPDATE', 'user_permissions', %s, %s, NOW())",
                (current_user_id, target_user_id, json.dumps({"permissions": sorted(slugs)})), fetch_all=False
            )
        except Exception:
            pass

        return jsonify({"message": "Permissions updated", "data": sorted(slugs)}), 200
    except Exception as e:
        return server_error(e)


@auth_routes.route('/make-admin', methods=['POST'])
def make_admin():
    """Promote a user to admin by email — only works when NO admin exists yet (bootstrap endpoint)."""
    try:
        from db import execute_query, execute_update

        # Only allow if there is currently no admin in the system
        existing_admin = execute_query(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1",
            fetch_one=True,
            fetch_all=False
        )
        if existing_admin:
            return jsonify({"error": "An admin already exists. Use the admin panel to manage roles."}), 403

        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"error": "email is required"}), 400

        user = execute_query(
            "SELECT id FROM users WHERE email = %s",
            (email,),
            fetch_one=True,
            fetch_all=False
        )
        if not user:
            return jsonify({"error": "User not found"}), 404

        execute_update("UPDATE users SET role = 'admin' WHERE email = %s", (email,))
        return jsonify({"message": f"{email} is now an admin. Please log in again."}), 200

    except Exception as e:
        return server_error(e)

@auth_routes.route('/audit-logs', methods=['GET'])
@token_required
def get_audit_logs(current_user_id):
    """Get all audit logs (admin only)."""
    try:
        from db import execute_query
        admin, _ = get_user_by_id(current_user_id)
        if not admin or admin['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403

        logs = execute_query(
            """SELECT a.id, a.user_id, a.action, a.table_name, a.record_id, a.details, a.created_at,
                      u.full_name, u.email
               FROM audit_logs a
               LEFT JOIN users u ON a.user_id = u.id
               ORDER BY a.created_at DESC
               LIMIT 100""",
            fetch_all=True
        )
        return jsonify({"data": logs or []}), 200
    except Exception as e:
        return server_error(e)


