from db import execute_query, execute_insert, execute_update
from utils import log_action

def get_pos():
    query = """
        SELECT po.id, po.quantity, po.status, po.created_at, 
               p.name as product_name, p.reorder_threshold, p.reorder_quantity,
               s.supplier_name
        FROM purchase_orders po
        JOIN products p ON po.product_id = p.id
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        ORDER BY po.created_at DESC
    """
    return execute_query(query) or [], None

def create_po(user_id, data):
    product_id = data.get('product_id')
    supplier_id = data.get('supplier_id')
    quantity = data.get('quantity')

    if not product_id or not quantity or int(quantity) <= 0:
        return None, "Invalid product or quantity"

    po_id = execute_insert(
        "INSERT INTO purchase_orders (product_id, supplier_id, quantity) VALUES (%s, %s, %s)",
        (product_id, supplier_id, quantity)
    )
    
    log_action(user_id, "create_po", "purchase_orders", po_id, f"Created PO for {quantity} units")
    return {"id": po_id, "status": "pending"}, None

def receive_po(user_id, po_id):
    po = execute_query("SELECT id, product_id, quantity, status FROM purchase_orders WHERE id = %s", (po_id,), fetch_one=True, fetch_all=False)
    if not po:
        return None, "PO not found"
    if po['status'] != 'pending':
        return None, f"PO is already {po['status']}"

    # Update PO status
    execute_update("UPDATE purchase_orders SET status = 'received' WHERE id = %s", (po_id,))
    
    # Update stock (this fires fn_log_stock_change trigger automatically)
    execute_update("UPDATE products SET stock = stock + %s WHERE id = %s", (po['quantity'], po['product_id']))
    
    # Fix the automatically generated stock_history entry to reflect it was a PO
    execute_update(
        """UPDATE stock_history 
           SET change_type = 'purchase_order', reference_id = %s, notes = 'Received via PO', created_by = %s 
           WHERE product_id = %s AND created_at = (SELECT MAX(created_at) FROM stock_history WHERE product_id = %s)""",
        (po_id, user_id, po['product_id'], po['product_id'])
    )

    log_action(user_id, "receive_po", "purchase_orders", po_id, "Received PO and updated stock")
    return True, None
