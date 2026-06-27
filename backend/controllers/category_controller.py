"""Category controller for CRUD operations"""

from db import execute_query, execute_insert, execute_update, execute_delete
from utils import validate_required_fields, sanitize_input

def create_category(data):
    """Create a new category"""
    valid, error = validate_required_fields(data, ['category_name'])
    if not valid:
        return None, error
    
    # Check if category already exists
    existing = execute_query(
        "SELECT id FROM categories WHERE category_name = %s",
        (data['category_name'],),
        fetch_one=True,
        fetch_all=False
    )
    
    if existing:
        return None, "Category already exists"
    
    try:
        category_id = execute_insert(
            "INSERT INTO categories (category_name) VALUES (%s)",
            (sanitize_input(data['category_name']),)
        )
        
        return {'id': category_id, 'category_name': data['category_name']}, None
    except Exception as e:
        return None, str(e)

def get_category_by_id(category_id):
    """Get category by ID"""
    try:
        category = execute_query(
            "SELECT id, category_name FROM categories WHERE id = %s",
            (category_id,),
            fetch_one=True,
            fetch_all=False
        )
        return category, None
    except Exception as e:
        return None, str(e)

def get_all_categories():
    """Get all categories"""
    try:
        categories = execute_query(
            "SELECT id, category_name FROM categories ORDER BY category_name ASC",
            fetch_all=True
        )
        return categories, None
    except Exception as e:
        return None, str(e)

def update_category(category_id, data):
    """Update category"""
    valid, error = validate_required_fields(data, ['category_name'])
    if not valid:
        return None, error
    
    # Check if category exists
    category = execute_query(
        "SELECT id FROM categories WHERE id = %s",
        (category_id,),
        fetch_one=True,
        fetch_all=False
    )
    
    if not category:
        return None, "Category not found"
    
    # Check if new name already exists
    existing = execute_query(
        "SELECT id FROM categories WHERE category_name = %s AND id != %s",
        (data['category_name'], category_id),
        fetch_one=True,
        fetch_all=False
    )
    
    if existing:
        return None, "Category name already exists"
    
    try:
        execute_update(
            "UPDATE categories SET category_name = %s WHERE id = %s",
            (sanitize_input(data['category_name']), category_id)
        )
        return True, None
    except Exception as e:
        return None, str(e)

def delete_category(category_id):
    """Delete category"""
    try:
        category = execute_query(
            "SELECT id FROM categories WHERE id = %s",
            (category_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        if not category:
            return None, "Category not found"
        
        execute_delete(
            "DELETE FROM categories WHERE id = %s",
            (category_id,)
        )
        
        return True, None
    except Exception as e:
        return None, str(e)

def get_category_product_count(category_id):
    """Get number of products in a category"""
    try:
        result = execute_query(
            "SELECT COUNT(*) as count FROM products WHERE category_id = %s",
            (category_id,),
            fetch_one=True,
            fetch_all=False
        )
        return result['count'] if result else 0, None
    except Exception as e:
        return None, str(e)
