"""
SOIMS — Smart Online Inventory Management System  v2.0
Flask application entry point.

Security (OWASP):
  - CORS restricted to Vite dev origin
  - Rate limiting on auth endpoints (flask-limiter)
  - Global error handler — no stack traces in responses
  - All routes use parameterized queries (no f-string SQL)
  - Passwords hashed with bcrypt
  - JWT-based authentication with role claims
  - Input validation via marshmallow schemas
"""

import os
import sys
import traceback
from flask import Flask, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

sys.path.insert(0, os.path.dirname(__file__))

from config import Config

# ── Blueprints ────────────────────────────────────────────────────────────────
from routes.auth_routes        import auth_routes
from routes.product_routes     import product_routes
from routes.category_routes    import category_routes
from routes.order_routes       import order_routes
from routes.transaction_routes import transaction_routes
from routes.supplier_routes    import supplier_routes
from routes.stock_routes       import stock_routes
from routes.report_routes      import report_routes
from routes.po_routes        import po_routes

# ── App factory ───────────────────────────────────────────────────────────────
app = Flask(__name__)
app.config.from_object(Config)

# CORS — restricted to Vite frontend origins (OWASP: restrict origins)
CORS(
    app,
    resources={r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]
    }},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=False,
)

# Rate limiter — OWASP: prevent brute-force on auth endpoints
limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    default_limits=[],          # no global limit; set per-route
    storage_uri="memory://",
)
app.extensions['limiter'] = limiter   # make accessible in blueprints

# ── Register blueprints ───────────────────────────────────────────────────────
app.register_blueprint(auth_routes)
app.register_blueprint(product_routes)
app.register_blueprint(category_routes)
app.register_blueprint(order_routes)
app.register_blueprint(transaction_routes)
app.register_blueprint(supplier_routes)
app.register_blueprint(stock_routes)
app.register_blueprint(report_routes)
app.register_blueprint(po_routes)

# ── Health check ────────────────────────────────────────────────────────────────
@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

# ── Root ──────────────────────────────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "system":  "Smart Online Inventory Management System (SOIMS)",
        "version": "2.0.0",
        "status":  "running",
        "roles":   ["admin", "staff", "user"],
        "endpoints": {
            "auth":         "/api/auth",
            "products":     "/api/products",
            "categories":   "/api/categories",
            "orders":       "/api/orders",
            "transactions": "/api/transactions",
            "suppliers":    "/api/suppliers",
            "stock":        "/api/stock",
            "reports":      "/api/reports",
        }
    })

# ── Global error handlers (OWASP: never expose stack traces) ──────────────────
@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request"}), 400

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({"error": "Unauthorized"}), 401

@app.errorhandler(403)
def forbidden(e):
    return jsonify({"error": "Forbidden"}), 403

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(429)
def rate_limit_exceeded(e):
    return jsonify({"error": "Too many requests. Please wait and try again."}), 429

@app.errorhandler(500)
def server_error(e):
    traceback.print_exc()
    return jsonify({"error": "Internal server error"}), 500

@app.errorhandler(Exception)
def unhandled_exception(e):
    traceback.print_exc()
    return jsonify({"error": "An unexpected error occurred"}), 500

# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=Config.DEBUG, host='0.0.0.0', port=5000)
