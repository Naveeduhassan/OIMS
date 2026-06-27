"""
JWT authentication middleware and RBAC decorators.
OWASP: tokens validated on every protected request.
"""

from flask import request, jsonify
from functools import wraps
import jwt

from config import Config
from db import execute_query


# ── Permission helpers ─────────────────────────────────────────────────────────

def has_permission(user_id, permission_slug):
    """Check if a user has a specific permission.
    Admin users have all permissions implicitly.
    """
    user = execute_query(
        "SELECT role FROM users WHERE id = %s",
        (user_id,), fetch_one=True, fetch_all=False
    )
    if not user:
        return False
    if user['role'] == 'admin':
        return True
    result = execute_query(
        """SELECT 1 FROM user_permissions up
           JOIN permissions p ON up.permission_id = p.id
           WHERE up.user_id = %s AND p.slug = %s""",
        (user_id, permission_slug), fetch_one=True, fetch_all=False
    )
    return result is not None


def get_user_permissions(user_id):
    """Get all permission slugs for a user."""
    if not user_id:
        return []
    user = execute_query(
        "SELECT role FROM users WHERE id = %s",
        (user_id,), fetch_one=True, fetch_all=False
    )
    if not user:
        return []
    if user['role'] == 'admin':
        rows = execute_query("SELECT slug FROM permissions", fetch_all=True)
        return [r['slug'] for r in rows] if rows else []
    rows = execute_query(
        """SELECT p.slug FROM user_permissions up
           JOIN permissions p ON up.permission_id = p.id
           WHERE up.user_id = %s""",
        (user_id,), fetch_all=True
    )
    return [r['slug'] for r in rows] if rows else []


# ── Token verification ────────────────────────────────────────────────────────

def _decode_token():
    """Extract and decode the Bearer token from the Authorization header.
    Returns (payload_dict, None) on success or (None, error_response) on failure.
    """
    auth_header = request.headers.get('Authorization', '')
    if not auth_header:
        return None, (jsonify({"error": "Token is missing"}), 401)

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None, (jsonify({"error": "Invalid token format. Use: Bearer <token>"}), 401)

    token = parts[1]
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=[Config.JWT_ALGORITHM])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, (jsonify({"error": "Token has expired. Please log in again."}), 401)
    except jwt.InvalidTokenError:
        return None, (jsonify({"error": "Invalid token"}), 401)


# ── @token_required ───────────────────────────────────────────────────────────

def token_required(f):
    """Decorator: validates JWT and injects current_user_id as the first positional arg."""
    @wraps(f)
    def decorated(*args, **kwargs):
        payload, err = _decode_token()
        if err:
            return err
        return f(payload['id'], *args, **kwargs)
    return decorated


# ── @role_required ────────────────────────────────────────────────────────────

def role_required(allowed_roles: list):
    """
    Decorator factory: validates JWT AND checks that the user's role is in allowed_roles.

    Usage:
        @role_required(['admin'])
        def admin_only_view(current_user_id): ...

        @role_required(['admin', 'staff'])
        def admin_or_staff_view(current_user_id): ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            payload, err = _decode_token()
            if err:
                return err

            role = payload.get('role', '')
            if role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Required role: {' or '.join(allowed_roles)}. Your role: {role}"
                }), 403

            return f(payload['id'], *args, **kwargs)
        return decorated
    return decorator


# ── @permission_required ──────────────────────────────────────────────────────

def permission_required(permission_slug: str):
    """
    Decorator factory: validates JWT AND checks that the user has a given permission.
    Admin users automatically pass all permission checks.

    Usage:
        @permission_required('products.edit')
        def edit_product(current_user_id, product_id): ...
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            payload, err = _decode_token()
            if err:
                return err
            if not has_permission(payload['id'], permission_slug):
                return jsonify({"error": f"Access denied. Missing permission: {permission_slug}"}), 403
            return f(payload['id'], *args, **kwargs)
        return decorated
    return decorator


# ── Convenience aliases ───────────────────────────────────────────────────────

def admin_required(f):
    """Shorthand for @role_required(['admin'])."""
    return role_required(['admin'])(f)
