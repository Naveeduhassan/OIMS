"""Report routes"""

from flask import Blueprint, request, jsonify
from utils import server_error
from controllers.report_controller import (
    get_sales_report, get_top_products, get_customer_report,
    get_category_report, get_payment_report, get_inventory_valuation,
    get_order_status_report, get_daily_analytics, get_business_summary
)
from auth_middleware import token_required
from controllers.user_controller import get_user_by_id

report_routes = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_routes.route('/sales', methods=['GET'])
@token_required
def sales_report(current_user_id):
    """Get sales report (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        report, error = get_sales_report(start_date, end_date)
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/top-products', methods=['GET'])
@token_required
def top_products(current_user_id):
    """Get top selling products (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        limit = request.args.get('limit', 10, type=int)
        
        products, error = get_top_products(limit)
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": products}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/customers', methods=['GET'])
@token_required
def customers_report(current_user_id):
    """Get customer statistics (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        report, error = get_customer_report()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/categories', methods=['GET'])
@token_required
def categories_report(current_user_id):
    """Get category performance report (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        report, error = get_category_report()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/payments', methods=['GET'])
@token_required
def payments_report(current_user_id):
    """Get payment statistics (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        report, error = get_payment_report()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/inventory-valuation', methods=['GET'])
@token_required
def inventory_valuation(current_user_id):
    """Get inventory valuation (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        report, error = get_inventory_valuation()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/order-status', methods=['GET'])
@token_required
def order_status_report(current_user_id):
    """Get order status breakdown (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        report, error = get_order_status_report()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": report}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/daily-analytics', methods=['GET'])
@token_required
def daily_analytics(current_user_id):
    """Get daily analytics (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        analytics, error = get_daily_analytics()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": analytics}), 200
    
    except Exception as e:
        return server_error(e)

@report_routes.route('/summary', methods=['GET'])
@token_required
def business_summary(current_user_id):
    """Get business summary (admin only)"""
    try:
        user, _ = get_user_by_id(current_user_id)
        if not user or user['role'] != 'admin':
            return jsonify({"error": "Access denied. Admin only."}), 403
        
        summary, error = get_business_summary()
        
        if error:
            return jsonify({"error": error}), 500
        
        return jsonify({"data": summary}), 200
    
    except Exception as e:
        return server_error(e)


