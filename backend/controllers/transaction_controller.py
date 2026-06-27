"""Transaction controller for payment handling"""

from db import execute_query, execute_insert, execute_update
from utils import validate_required_fields

def create_transaction(data):
    """Create a new transaction"""
    valid, error = validate_required_fields(data, ['order_id', 'payment_method'])
    if not valid:
        return None, error
    
    # Verify order exists
    order = execute_query(
        "SELECT id FROM orders WHERE id = %s",
        (data['order_id'],),
        fetch_one=True,
        fetch_all=False
    )
    
    if not order:
        return None, "Order not found"
    
    # Check if transaction already exists for this order
    existing = execute_query(
        "SELECT id FROM transactions WHERE order_id = %s",
        (data['order_id'],),
        fetch_one=True,
        fetch_all=False
    )
    
    if existing:
        return None, "Transaction already exists for this order"
    
    try:
        transaction_id = execute_insert(
            "INSERT INTO transactions (order_id, payment_method, payment_status) VALUES (%s, %s, %s)",
            (data['order_id'], data['payment_method'], 'unpaid')
        )
        
        return {
            'id': transaction_id,
            'order_id': data['order_id'],
            'payment_method': data['payment_method'],
            'payment_status': 'unpaid'
        }, None
    
    except Exception as e:
        return None, str(e)

def get_transaction_by_id(transaction_id):
    """Get transaction by ID"""
    try:
        transaction = execute_query(
            """SELECT t.id, t.order_id, t.payment_method, t.payment_status,
                      o.total_amount, o.user_id, u.full_name, u.email
               FROM transactions t
               LEFT JOIN orders o ON t.order_id = o.id
               LEFT JOIN users u ON o.user_id = u.id
               WHERE t.id = %s""",
            (transaction_id,),
            fetch_one=True,
            fetch_all=False
        )

        if not transaction:
            return None, "Transaction not found"

        return transaction, None
    except Exception as e:
        return None, str(e)

def get_transaction_by_order(order_id):
    """Get transaction for an order"""
    try:
        transaction = execute_query(
            "SELECT id, order_id, payment_method, payment_status FROM transactions WHERE order_id = %s",
            (order_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        return transaction, None
    except Exception as e:
        return None, str(e)

def get_all_transactions(limit=None, offset=None):
    """Get all transactions"""
    try:
        if limit and offset:
            transactions = execute_query(
                """SELECT t.id, t.order_id, t.payment_method, t.payment_status, o.total_amount, u.full_name, t.created_at
                   FROM transactions t 
                   LEFT JOIN orders o ON t.order_id = o.id 
                   LEFT JOIN users u ON o.user_id = u.id 
                   ORDER BY t.id DESC LIMIT %s OFFSET %s""",
                (limit, offset),
                fetch_all=True
            )
        else:
            transactions = execute_query(
                """SELECT t.id, t.order_id, t.payment_method, t.payment_status, o.total_amount, u.full_name, t.created_at
                   FROM transactions t 
                   LEFT JOIN orders o ON t.order_id = o.id 
                   LEFT JOIN users u ON o.user_id = u.id 
                   ORDER BY t.id DESC""",
                fetch_all=True
            )
        
        return transactions, None
    except Exception as e:
        return None, str(e)

def update_payment_status(transaction_id, payment_status):
    """Update payment status"""
    valid_statuses = ['unpaid', 'paid', 'failed', 'refunded']
    
    if payment_status not in valid_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    
    try:
        transaction = execute_query(
            "SELECT id, order_id FROM transactions WHERE id = %s",
            (transaction_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        if not transaction:
            return None, "Transaction not found"
        
        # Update transaction status
        execute_update(
            "UPDATE transactions SET payment_status = %s WHERE id = %s",
            (payment_status, transaction_id)
        )
        
        # If payment is successful, update order status to confirmed (only if pending)
        if payment_status == 'paid':
            execute_update(
                "UPDATE orders SET status = %s WHERE id = %s AND status = 'pending'",
                ('confirmed', transaction['order_id'])
            )
        elif payment_status in ('failed', 'refunded'):
            # Automatically cancel the order to restore stock
            from controllers.order_controller import cancel_order
            cancel_order(transaction['order_id'])
        
        return True, None
    except Exception as e:
        return None, str(e)

def get_payment_statistics():
    """Get payment statistics"""
    try:
        stats = execute_query(
            """SELECT
                COUNT(*) as total_transactions,
                SUM(CASE WHEN t.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN t.payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
                SUM(CASE WHEN t.payment_status = 'failed' THEN 1 ELSE 0 END) as failed_count,
                SUM(CASE WHEN t.payment_status = 'refunded' THEN 1 ELSE 0 END) as refunded_count,
                SUM(CASE WHEN t.payment_status = 'paid' THEN o.total_amount ELSE 0 END) as total_revenue
               FROM transactions t
               LEFT JOIN orders o ON t.order_id = o.id""",
            fetch_one=True,
            fetch_all=False
        )

        return stats, None
    except Exception as e:
        return None, str(e)

def get_transactions_by_status(payment_status):
    """Get transactions by payment status"""
    valid_statuses = ['unpaid', 'paid', 'failed', 'refunded']
    
    if payment_status not in valid_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    
    try:
        transactions = execute_query(
            """SELECT t.id, t.order_id, t.payment_method, t.payment_status, o.total_amount, u.full_name 
               FROM transactions t 
               LEFT JOIN orders o ON t.order_id = o.id 
               LEFT JOIN users u ON o.user_id = u.id 
               WHERE t.payment_status = %s 
               ORDER BY t.id DESC""",
            (payment_status,),
            fetch_all=True
        )
        
        return transactions, None
    except Exception as e:
        return None, str(e)
