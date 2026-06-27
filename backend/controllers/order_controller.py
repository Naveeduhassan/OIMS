"""Order controller — uses process_order stored procedure for atomic processing."""

import json
import psycopg2
from db import execute_query, execute_insert, execute_update, execute_delete, get_db_connection
from utils import validate_required_fields


def create_order(user_id, data):
    """
    Create a new order using the process_order stored procedure.
    This ensures atomic stock deduction with SELECT FOR UPDATE concurrency control.
    """
    valid, error = validate_required_fields(data, ['items'])
    if not valid:
        return None, error

    items = data['items']
    if not isinstance(items, list) or len(items) == 0:
        return None, "Order must contain at least one item"

    for item in items:
        if 'product_id' not in item or 'quantity' not in item:
            return None, "Each item must have product_id and quantity"
        if int(item['quantity']) <= 0:
            return None, "Quantity must be positive"

    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Call the stored procedure — handles stock validation, deduction,
        # history logging, and transaction creation atomically
        items_json = json.dumps(items)
        payment_method = data.get('payment_method', 'cash')
        shipping_address = data.get('shipping_address')

        cur.execute(
            "SELECT process_order(%s, %s::jsonb, %s::varchar, %s::text)",
            (user_id, items_json, payment_method, shipping_address)
        )
        result = cur.fetchone()
        conn.commit()
        cur.close()

        if result and result[0]:
            return dict(result[0]), None
        return None, "Order processing failed"

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        # Extract the clean error message from PostgreSQL exception
        msg = str(e).split('\n')[0].replace('ERROR:  ', '')
        return None, msg
    except Exception as e:
        if conn:
            conn.rollback()
        return None, str(e)
    finally:
        if conn:
            conn.close()


def get_order_by_id(order_id):
    """Get order by ID with items."""
    try:
        order = execute_query(
            """SELECT o.id, o.user_id, o.total_amount, o.status::text AS status,
                      o.notes, o.created_at, o.updated_at, u.full_name, u.email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               WHERE o.id = %s""",
            (order_id,), fetch_one=True, fetch_all=False
        )
        if not order:
            return None, "Order not found"

        items = execute_query(
            """SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name AS product_name
               FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = %s""",
            (order_id,), fetch_all=True
        )
        order['items'] = items if items else []
        return order, None
    except Exception as e:
        return None, str(e)


def get_all_orders(limit=None, offset=None):
    """Get all orders (admin)."""
    try:
        base = """SELECT o.id, o.user_id, o.total_amount, o.status::text AS status,
                         o.created_at, o.updated_at, u.full_name, u.email
                  FROM orders o
                  LEFT JOIN users u ON o.user_id = u.id
                  ORDER BY o.created_at DESC"""
        if limit and offset is not None:
            orders = execute_query(base + " LIMIT %s OFFSET %s", (limit, offset), fetch_all=True)
        else:
            orders = execute_query(base, fetch_all=True)
        return orders or [], None
    except Exception as e:
        return None, str(e)


def get_user_orders(user_id, limit=None, offset=None):
    """Get all orders for a specific user."""
    try:
        base = """SELECT o.id, o.user_id, o.total_amount, o.status::text AS status,
                         o.created_at, o.updated_at, u.full_name, u.email
                  FROM orders o
                  LEFT JOIN users u ON o.user_id = u.id
                  WHERE o.user_id = %s
                  ORDER BY o.created_at DESC"""
        if limit and offset is not None:
            orders = execute_query(base + " LIMIT %s OFFSET %s", (user_id, limit, offset), fetch_all=True)
        else:
            orders = execute_query(base, (user_id,), fetch_all=True)
        return orders or [], None
    except Exception as e:
        return None, str(e)


def update_order_status(order_id, new_status):
    """Update order status (admin only)."""
    valid_statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if new_status not in valid_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    try:
        order = execute_query(
            "SELECT id FROM orders WHERE id = %s",
            (order_id,), fetch_one=True, fetch_all=False
        )
        if not order:
            return None, "Order not found"
        execute_update("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
        
        # Automation: If order is marked delivered, automatically mark the associated transaction as paid (for CoD)
        if new_status == 'delivered':
            execute_update(
                "UPDATE transactions SET payment_status = 'paid' WHERE order_id = %s AND payment_status = 'unpaid'",
                (order_id,)
            )
            
        return True, None
    except Exception as e:
        return None, str(e)


def cancel_order(order_id):
    """Cancel an order and restore stock."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Lock the order row
        cur.execute("SELECT id, status FROM orders WHERE id = %s FOR UPDATE", (order_id,))
        order = cur.fetchone()
        if not order:
            conn.rollback()
            return None, "Order not found"

        order_id_val, status = order
        if status in ('delivered', 'cancelled'):
            conn.rollback()
            return None, f"Cannot cancel order with status: {status}"

        # Get items to restore stock
        cur.execute("SELECT product_id, quantity FROM order_items WHERE order_id = %s", (order_id,))
        items = cur.fetchall()

        for product_id, quantity in items:
            cur.execute(
                "UPDATE products SET stock = stock + %s WHERE id = %s",
                (quantity, product_id)
            )
            # Log the cancellation in stock_history
            cur.execute(
                """INSERT INTO stock_history
                   (product_id, change_type, quantity, stock_before, stock_after, reference_id, notes)
                   SELECT %s, 'order_cancellation', %s,
                          stock - %s, stock,
                          %s, 'Order #' || %s || ' cancelled'
                   FROM products WHERE id = %s""",
                (product_id, quantity, quantity, order_id, order_id, product_id)
            )

        cur.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s", (order_id,))
        # Auto-update transaction status
        cur.execute(
            """UPDATE transactions 
               SET payment_status = CASE 
                   WHEN payment_status = 'paid' THEN 'refunded'::payment_status
                   WHEN payment_status = 'refunded' THEN 'refunded'::payment_status
                   WHEN payment_status = 'failed' THEN 'failed'::payment_status
                   ELSE 'failed'::payment_status
               END
               WHERE order_id = %s""",
            (order_id,)
        )
        
        conn.commit()
        cur.close()
        return True, None

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        return None, str(e)
    finally:
        if conn:
            conn.close()


def get_orders_by_status(status):
    """Get all orders with a specific status (admin)."""
    valid_statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if status not in valid_statuses:
        return None, f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
    try:
        orders = execute_query(
            """SELECT o.id, o.user_id, o.total_amount, o.status,
                      o.created_at, u.full_name, u.email
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               WHERE o.status = %s
               ORDER BY o.created_at DESC""",
            (status,), fetch_all=True
        )
        return orders, None
    except Exception as e:
        return None, str(e)
