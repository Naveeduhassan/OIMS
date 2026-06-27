"""
Report controller — analytics and business insights.
Uses the get_business_summary() stored procedure for the summary endpoint.
All status columns cast to ::text to avoid psycopg2 enum serialization issues.
"""

from db import execute_query


def get_sales_report(start_date=None, end_date=None):
    """Daily sales report, optionally filtered by date range."""
    try:
        if start_date and end_date:
            report = execute_query(
                """SELECT DATE(o.created_at)        AS sale_date,
                          COUNT(DISTINCT o.id)      AS total_orders,
                          COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                          COALESCE(SUM(c.order_cogs), 0)   AS total_cogs,
                          COALESCE(SUM(o.total_amount) - SUM(c.order_cogs), 0) AS net_profit
                   FROM orders o
                   LEFT JOIN (
                       SELECT order_id, SUM(oi.quantity * p.cost_price) as order_cogs
                       FROM order_items oi JOIN products p ON oi.product_id = p.id
                       GROUP BY order_id
                   ) c ON o.id = c.order_id
                   WHERE o.status::text IN ('delivered', 'confirmed')
                     AND o.created_at BETWEEN %s AND %s
                   GROUP BY DATE(o.created_at)
                   ORDER BY sale_date DESC""",
                (start_date, end_date), fetch_all=True
            )
        else:
            report = execute_query(
                """SELECT DATE(o.created_at)        AS sale_date,
                          COUNT(DISTINCT o.id)      AS total_orders,
                          COALESCE(SUM(o.total_amount), 0) AS total_revenue,
                          COALESCE(SUM(c.order_cogs), 0)   AS total_cogs,
                          COALESCE(SUM(o.total_amount) - SUM(c.order_cogs), 0) AS net_profit
                   FROM orders o
                   LEFT JOIN (
                       SELECT order_id, SUM(oi.quantity * p.cost_price) as order_cogs
                       FROM order_items oi JOIN products p ON oi.product_id = p.id
                       GROUP BY order_id
                   ) c ON o.id = c.order_id
                   WHERE o.status::text IN ('delivered', 'confirmed')
                   GROUP BY DATE(o.created_at)
                   ORDER BY sale_date DESC""",
                fetch_all=True
            )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_top_products(limit=10):
    """Top-selling products ranked by total revenue."""
    try:
        products = execute_query(
            """SELECT p.id, p.name,
                      COUNT(oi.id)                        AS times_sold,
                      COALESCE(SUM(oi.quantity), 0)       AS total_quantity,
                      COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue,
                      COALESCE(AVG(oi.price), 0)          AS avg_price
               FROM products p
               LEFT JOIN order_items oi ON p.id = oi.product_id
               GROUP BY p.id, p.name
               ORDER BY total_revenue DESC
               LIMIT %s""",
            (limit,), fetch_all=True
        )
        return products or [], None
    except Exception as e:
        return None, str(e)


def get_customer_report():
    """Customer statistics."""
    try:
        report = execute_query(
            """SELECT COUNT(DISTINCT u.id)              AS total_customers,
                      COUNT(DISTINCT o.user_id)         AS customers_with_orders,
                      COALESCE(SUM(o.total_amount), 0)  AS total_customer_spending,
                      COALESCE(AVG(o.total_amount), 0)  AS avg_spending_per_order,
                      COALESCE(MAX(o.total_amount), 0)  AS highest_order_value
               FROM users u
               LEFT JOIN orders o ON u.id = o.user_id
               WHERE u.role::text = 'user'""",
            fetch_one=True, fetch_all=False
        )
        return report, None
    except Exception as e:
        return None, str(e)


def get_category_report():
    """Category performance — products, stock, inventory value, revenue."""
    try:
        report = execute_query(
            """SELECT c.id, c.category_name,
                      COUNT(p.id)                              AS total_products,
                      COALESCE(SUM(p.stock), 0)               AS total_stock,
                      COALESCE(SUM(p.price * p.stock), 0)     AS inventory_value,
                      COALESCE(SUM(oi.quantity), 0)           AS total_items_sold,
                      COALESCE(SUM(oi.quantity * oi.price), 0) AS revenue
               FROM categories c
               LEFT JOIN products p    ON c.id = p.category_id
               LEFT JOIN order_items oi ON p.id = oi.product_id
               GROUP BY c.id, c.category_name
               ORDER BY revenue DESC NULLS LAST""",
            fetch_all=True
        )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_payment_report():
    """Payment statistics grouped by payment method."""
    try:
        report = execute_query(
            """SELECT t.payment_method,
                      COUNT(t.id)                                                    AS transaction_count,
                      COALESCE(SUM(o.total_amount), 0)                              AS total_amount,
                      COALESCE(AVG(o.total_amount), 0)                              AS avg_amount,
                      SUM(CASE WHEN t.payment_status::text = 'paid'   THEN 1 ELSE 0 END) AS successful_payments,
                      SUM(CASE WHEN t.payment_status::text = 'failed' THEN 1 ELSE 0 END) AS failed_payments,
                      SUM(CASE WHEN t.payment_status::text = 'unpaid' THEN 1 ELSE 0 END) AS pending_payments
               FROM transactions t
               LEFT JOIN orders o ON t.order_id = o.id
               GROUP BY t.payment_method
               ORDER BY total_amount DESC NULLS LAST""",
            fetch_all=True
        )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_inventory_valuation():
    """Full inventory valuation per product."""
    try:
        report = execute_query(
            """SELECT p.id, p.name, p.price, p.stock,
                      p.price * p.stock AS total_value,
                      c.category_name
               FROM products p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.is_active = TRUE
               ORDER BY total_value DESC""",
            fetch_all=True
        )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_order_status_report():
    """Order count and revenue grouped by status."""
    try:
        report = execute_query(
            """SELECT status::text                       AS status,
                      COUNT(*)                          AS order_count,
                      COALESCE(SUM(total_amount), 0)   AS total_amount,
                      COALESCE(AVG(total_amount), 0)   AS avg_amount
               FROM orders
               GROUP BY status
               ORDER BY order_count DESC""",
            fetch_all=True
        )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_daily_analytics():
    """Daily analytics — orders, unique customers, sales, paid amount."""
    try:
        report = execute_query(
            """SELECT DATE(o.created_at)                                                    AS analytics_date,
                      COUNT(o.id)                                                           AS total_orders,
                      COUNT(DISTINCT o.user_id)                                            AS unique_customers,
                      COALESCE(SUM(o.total_amount), 0)                                     AS total_sales,
                      COALESCE(SUM(CASE WHEN t.payment_status::text = 'paid'
                                        THEN o.total_amount ELSE 0 END), 0)                AS paid_amount
               FROM orders o
               LEFT JOIN transactions t ON o.id = t.order_id
               GROUP BY DATE(o.created_at)
               ORDER BY analytics_date DESC""",
            fetch_all=True
        )
        return report or [], None
    except Exception as e:
        return None, str(e)


def get_business_summary():
    """
    Overall business KPIs.
    Calls the get_business_summary() PostgreSQL stored function for a single round-trip.
    """
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
        # Fallback to plain SQL if stored function not yet installed
        try:
            summary = execute_query(
                """SELECT
                    (SELECT COUNT(*) FROM users WHERE role::text = 'user')                          AS total_customers,
                    (SELECT COUNT(*) FROM products WHERE is_active = TRUE)                          AS total_products,
                    (SELECT COUNT(*) FROM orders)                                                   AS total_orders,
                    (SELECT COALESCE(SUM(total_amount),0) FROM orders
                     WHERE status::text IN ('delivered','confirmed'))                               AS total_revenue,
                    (SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) 
                     FROM order_items oi JOIN orders o ON oi.order_id = o.id JOIN products p ON oi.product_id = p.id 
                     WHERE o.status::text IN ('delivered','confirmed'))                             AS total_cogs,
                    (SELECT COALESCE(SUM(stock * price),0) FROM products WHERE is_active = TRUE)   AS inventory_value,
                    (SELECT COUNT(*) FROM categories)                                               AS total_categories,
                    (SELECT COUNT(*) FROM suppliers)                                                AS total_suppliers,
                    (SELECT COALESCE(SUM(CASE WHEN payment_status::text='paid' THEN 1 ELSE 0 END),0)
                     FROM transactions)                                                             AS successful_transactions,
                    (SELECT COALESCE(SUM(CASE WHEN stock<=10 THEN 1 ELSE 0 END),0)
                     FROM products WHERE is_active = TRUE)                                         AS low_stock_items""",
                fetch_one=True, fetch_all=False
            )
            return summary, None
        except Exception as e2:
            return None, str(e2)
