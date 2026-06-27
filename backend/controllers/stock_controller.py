"""Stock controller — uses stored procedures where applicable."""

import psycopg2
from db import execute_query, execute_insert, execute_update, get_db_connection


def get_stock_history(product_id, limit=None, offset=None):
    """Get stock change history for a product."""
    try:
        base = """SELECT sh.id, sh.product_id, sh.change_type::text AS change_type,
                         sh.quantity, sh.stock_before, sh.stock_after,
                         sh.reference_id, sh.notes, sh.created_at,
                         u.full_name AS created_by_name
                  FROM stock_history sh
                  LEFT JOIN users u ON sh.created_by = u.id
                  WHERE sh.product_id = %s
                  ORDER BY sh.created_at DESC"""
        if limit:
            history = execute_query(base + " LIMIT %s", (product_id, limit), fetch_all=True)
        else:
            history = execute_query(base, (product_id,), fetch_all=True)
        return history or [], None
    except Exception as e:
        return None, str(e)


def adjust_stock(product_id, quantity, change_type='manual_adjustment', admin_id=None, notes=None):
    """
    Manually adjust product stock.
    For restocks uses the restock_product stored procedure.
    For reductions uses a direct update with history logging.
    """
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if quantity > 0:
            # Use stored procedure for restocks
            cur.execute(
                "SELECT restock_product(%s, %s, %s, %s)",
                (product_id, quantity, admin_id, notes or 'Manual restock')
            )
            result = cur.fetchone()
            conn.commit()
            cur.close()
            return dict(result[0]) if result and result[0] else {'product_id': product_id}, None

        elif quantity < 0:
            # Manual reduction — lock row first
            cur.execute(
                "SELECT id, stock FROM products WHERE id = %s FOR UPDATE",
                (product_id,)
            )
            product = cur.fetchone()
            if not product:
                conn.rollback()
                return None, "Product not found"

            _, current_stock = product
            if current_stock < abs(quantity):
                conn.rollback()
                return None, f"Insufficient stock. Available: {current_stock}"

            new_stock = current_stock + quantity  # quantity is negative

            cur.execute(
                "UPDATE products SET stock = %s WHERE id = %s",
                (new_stock, product_id)
            )
            # The trigger fn_log_stock_change fires automatically,
            # but we override with richer data
            cur.execute(
                """UPDATE stock_history
                   SET change_type = %s, created_by = %s, notes = %s
                   WHERE product_id = %s
                     AND created_at = (
                       SELECT MAX(created_at) FROM stock_history WHERE product_id = %s
                     )""",
                (change_type, admin_id, notes or 'Manual adjustment', product_id, product_id)
            )
            conn.commit()
            cur.close()
            return {'product_id': product_id, 'new_stock': new_stock, 'quantity_changed': quantity}, None

        else:
            return None, "Quantity cannot be zero"

    except psycopg2.Error as e:
        if conn:
            conn.rollback()
        msg = str(e).split('\n')[0].replace('ERROR:  ', '')
        return None, msg
    except Exception as e:
        if conn:
            conn.rollback()
        return None, str(e)
    finally:
        if conn:
            conn.close()


def get_total_inventory_value():
    """Get total inventory value."""
    try:
        result = execute_query(
            "SELECT SUM(price * stock) AS total_value FROM products WHERE is_active = TRUE",
            fetch_one=True, fetch_all=False
        )
        return {'total_value': float(result['total_value']) if result['total_value'] else 0}, None
    except Exception as e:
        return None, str(e)


def get_inventory_summary():
    """Get complete inventory summary using the stored function."""
    try:
        result = execute_query(
            "SELECT get_business_summary()",
            fetch_one=True, fetch_all=False
        )
        if result:
            key = list(result.keys())[0]
            return dict(result[key]), None
        return {}, None
    except Exception as e:
        return None, str(e)


def get_low_stock_alert(threshold=10):
    """Get list of products below stock threshold."""
    try:
        products = execute_query(
            """SELECT p.id, p.name, p.stock, p.price,
                      c.category_name, s.supplier_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               LEFT JOIN suppliers  s ON p.supplier_id  = s.id
               WHERE p.stock <= %s AND p.is_active = TRUE
               ORDER BY p.stock ASC""",
            (threshold,), fetch_all=True
        )
        return products, None
    except Exception as e:
        return None, str(e)


def get_product_movement(product_id, days=30):
    """Get product movement/sales in last N days."""
    try:
        result = execute_query(
            """SELECT COALESCE(SUM(oi.quantity), 0) AS total_sold
               FROM order_items oi
               JOIN orders o ON oi.order_id = o.id
               WHERE oi.product_id = %s
                 AND o.created_at >= NOW() - INTERVAL '1 day' * %s
                 AND o.status NOT IN ('cancelled')""",
            (product_id, days), fetch_one=True, fetch_all=False
        )
        return {
            'product_id': product_id,
            'period_days': days,
            'total_sold': int(result['total_sold']) if result else 0
        }, None
    except Exception as e:
        return None, str(e)


def get_stock_by_category():
    """Get stock information grouped by category."""
    try:
        data = execute_query(
            """SELECT c.id, c.category_name,
                      COUNT(p.id)          AS product_count,
                      COALESCE(SUM(p.stock), 0)          AS total_stock,
                      COALESCE(SUM(p.price * p.stock), 0) AS total_value
               FROM categories c
               LEFT JOIN products p ON c.id = p.category_id AND p.is_active = TRUE
               GROUP BY c.id, c.category_name
               ORDER BY c.category_name""",
            fetch_all=True
        )
        return data, None
    except Exception as e:
        return None, str(e)
