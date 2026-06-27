"""
Validation utilities — input sanitization, validation, and standardized responses.
All SQL queries in this project use parameterized inputs (psycopg2 placeholders).
No f-strings are used in SQL — OWASP SQL Injection prevention.
"""

import re
from flask import jsonify


# ── Email / Password ──────────────────────────────────────────────────────────

def validate_email(email: str) -> bool:
    """Validate email format using RFC-5322 simplified pattern."""
    pattern = r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, str(email).strip()))


def validate_password(password: str) -> bool:
    """Password must be at least 8 characters with at least one letter and one digit."""
    if not isinstance(password, str) or len(password) < 8:
        return False
    if not re.search(r'[A-Za-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    return True


# ── Field presence ────────────────────────────────────────────────────────────

def validate_required_fields(data: dict, required_fields: list):
    """Return (True, None) if all fields present and non-empty, else (False, message)."""
    if not isinstance(data, dict):
        return False, "Request body must be a JSON object"

    missing = [
        f for f in required_fields
        if f not in data or data[f] is None or str(data[f]).strip() == ''
    ]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None


# ── Numeric ───────────────────────────────────────────────────────────────────

def validate_numeric(value, field_name: str):
    try:
        float(value)
        return True, None
    except (ValueError, TypeError):
        return False, f"{field_name} must be a valid number"


def validate_positive_number(value, field_name: str):
    ok, err = validate_numeric(value, field_name)
    if not ok:
        return False, err
    if float(value) <= 0:
        return False, f"{field_name} must be greater than 0"
    return True, None


def validate_non_negative_int(value, field_name: str):
    try:
        v = int(value)
        if v < 0:
            return False, f"{field_name} must be 0 or greater"
        return True, None
    except (ValueError, TypeError):
        return False, f"{field_name} must be a valid integer"


# ── Sanitization ──────────────────────────────────────────────────────────────

def sanitize_input(value):
    """Strip leading/trailing whitespace from strings."""
    if isinstance(value, str):
        return value.strip()
    return value


# ── Standardized responses ────────────────────────────────────────────────────

def error_response(message: str, status_code: int = 400, code: str = None):
    """Return a standardized JSON error — never exposes stack traces."""
    body = {"error": message}
    if code:
        body["code"] = code
    return jsonify(body), status_code


def success_response(data, message: str = None, status_code: int = 200):
    """Return a standardized JSON success response."""
    body = {"data": data}
    if message:
        body["message"] = message
    return jsonify(body), status_code

import traceback
import sys

def server_error(e):
    """Log the exception server-side and return a generic 500 response."""
    traceback.print_exc()
    return jsonify({"error": "Internal server error"}), 500

from db import execute_update

def log_action(user_id, action, table_name, record_id=None, details=None):
    """Logs an action to the audit_logs table."""
    try:
        query = """
            INSERT INTO audit_logs (user_id, action, table_name, record_id, details)
            VALUES (%s, %s, %s, %s, %s)
        """
        execute_update(query, (user_id, action, table_name, record_id, details))
    except Exception as e:
        print(f"Failed to log action: {e}")
