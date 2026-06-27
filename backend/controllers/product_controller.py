"""
Product controller — full CRUD with input validation.
All queries use parameterized inputs (OWASP SQL Injection prevention).
"""

from db import execute_query, execute_insert, execute_update, execute_delete
from utils import validate_required_fields, validate_positive_number, validate_non_negative_int, sanitize_input


def _product_select():
    """Standard SELECT for products — includes category and supplier names."""
    return """
        SELECT p.id, p.name, p.description, p.price, p.stock,
               p.is_active, p.created_at, p.updated_at, p.image_url,
               p.reorder_threshold, p.reorder_quantity,
               p.category_id, c.category_name,
               p.supplier_id, s.supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers  s ON p.supplier_id  = s.id
    """


def create_product(data):
    """Create a new product. Admin only."""
    valid, error = validate_required_fields(data, ['name', 'price', 'category_id'])
    if not valid:
        return None, error

    ok, err = validate_positive_number(data['price'], 'Price')
    if not ok:
        return None, err

    if 'stock' in data:
        ok, err = validate_non_negative_int(data['stock'], 'Stock')
        if not ok:
            return None, err

    # Verify category exists
    cat = execute_query("SELECT id FROM categories WHERE id = %s",
                        (data['category_id'],), fetch_one=True, fetch_all=False)
    if not cat:
        return None, "Category does not exist"

    # Verify supplier if provided
    if data.get('supplier_id'):
        sup = execute_query("SELECT id FROM suppliers WHERE id = %s",
                            (data['supplier_id'],), fetch_one=True, fetch_all=False)
        if not sup:
            return None, "Supplier does not exist"

    try:
        product_id = execute_insert(
            """INSERT INTO products (name, description, price, stock, category_id, supplier_id, image_url, reorder_threshold, reorder_quantity)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                sanitize_input(data['name']),
                sanitize_input(data.get('description', '')),
                float(data['price']),
                int(data.get('stock', 0)),
                int(data['category_id']),
                int(data['supplier_id']) if data.get('supplier_id') else None,
                sanitize_input(data.get('image_url', '')) or None,
                int(data.get('reorder_threshold', 10)),
                int(data.get('reorder_quantity', 50)),
            )
        )
        return get_product_by_id(product_id)[0], None
    except Exception as e:
        return None, str(e)


def get_product_by_id(product_id):
    """Get a single product by ID."""
    try:
        product = execute_query(
            _product_select() + " WHERE p.id = %s",
            (product_id,), fetch_one=True, fetch_all=False
        )
        return product, None
    except Exception as e:
        return None, str(e)


def get_all_products(limit=None, offset=None):
    """Get all active products with optional pagination."""
    try:
        base = _product_select() + " WHERE p.is_active = TRUE ORDER BY p.created_at DESC"
        if limit and offset is not None:
            products = execute_query(base + " LIMIT %s OFFSET %s", (limit, offset), fetch_all=True)
        else:
            products = execute_query(base, fetch_all=True)
        return products or [], None
    except Exception as e:
        return None, str(e)


def search_products(query_text):
    """Full-text search on name and description."""
    try:
        products = execute_query(
            _product_select() + """
            WHERE p.is_active = TRUE
              AND (p.name ILIKE %s OR p.description ILIKE %s)
            ORDER BY p.created_at DESC""",
            (f"%{query_text}%", f"%{query_text}%"),
            fetch_all=True
        )
        return products or [], None
    except Exception as e:
        return None, str(e)


def get_products_by_category(category_id):
    """Get all active products in a category."""
    try:
        products = execute_query(
            _product_select() + " WHERE p.category_id = %s AND p.is_active = TRUE ORDER BY p.created_at DESC",
            (category_id,), fetch_all=True
        )
        return products or [], None
    except Exception as e:
        return None, str(e)


def update_product(product_id, data):
    """Update product fields. Only provided fields are changed."""
    product = execute_query("SELECT id FROM products WHERE id = %s",
                            (product_id,), fetch_one=True, fetch_all=False)
    if not product:
        return None, "Product not found"

    fields, values = [], []

    if 'name' in data and data['name']:
        fields.append("name = %s")
        values.append(sanitize_input(data['name']))

    if 'description' in data:
        fields.append("description = %s")
        values.append(sanitize_input(data['description']))

    if 'image_url' in data:
        fields.append("image_url = %s")
        values.append(sanitize_input(data['image_url']) or None)

    if 'price' in data and data['price'] is not None:
        ok, err = validate_positive_number(data['price'], 'Price')
        if not ok:
            return None, err
        fields.append("price = %s")
        values.append(float(data['price']))

    if 'stock' in data and data['stock'] is not None:
        ok, err = validate_non_negative_int(data['stock'], 'Stock')
        if not ok:
            return None, err
        fields.append("stock = %s")
        values.append(int(data['stock']))
        
    if 'reorder_threshold' in data and data['reorder_threshold'] is not None:
        fields.append("reorder_threshold = %s")
        values.append(int(data['reorder_threshold']))

    if 'reorder_quantity' in data and data['reorder_quantity'] is not None:
        fields.append("reorder_quantity = %s")
        values.append(int(data['reorder_quantity']))

    if 'category_id' in data and data['category_id'] is not None:
        cat = execute_query("SELECT id FROM categories WHERE id = %s",
                            (data['category_id'],), fetch_one=True, fetch_all=False)
        if not cat:
            return None, "Category does not exist"
        fields.append("category_id = %s")
        values.append(int(data['category_id']))

    if 'supplier_id' in data:
        if data['supplier_id']:
            sup = execute_query("SELECT id FROM suppliers WHERE id = %s",
                                (data['supplier_id'],), fetch_one=True, fetch_all=False)
            if not sup:
                return None, "Supplier does not exist"
            fields.append("supplier_id = %s")
            values.append(int(data['supplier_id']))
        else:
            fields.append("supplier_id = %s")
            values.append(None)

    if 'is_active' in data:
        fields.append("is_active = %s")
        values.append(bool(data['is_active']))

    if not fields:
        return None, "No valid fields to update"

    values.append(product_id)
    try:
        execute_update(
            "UPDATE products SET " + ", ".join(fields) + " WHERE id = %s",
            values
        )
        return get_product_by_id(product_id)[0], None
    except Exception as e:
        return None, str(e)


def delete_product(product_id):
    """Hard-delete a product. Triggers audit log automatically."""
    try:
        product = execute_query("SELECT id FROM products WHERE id = %s",
                                (product_id,), fetch_one=True, fetch_all=False)
        if not product:
            return None, "Product not found"
        execute_delete("DELETE FROM products WHERE id = %s", (product_id,))
        return True, None
    except Exception as e:
        return None, str(e)


def get_low_stock_products(threshold=10):
    """Get active products with stock at or below threshold."""
    try:
        products = execute_query(
            _product_select() + " WHERE p.stock <= %s AND p.is_active = TRUE ORDER BY p.stock ASC",
            (threshold,), fetch_all=True
        )
        return products or [], None
    except Exception as e:
        return None, str(e)
