"""Supplier controller for CRUD operations"""

from db import execute_query, execute_insert, execute_update, execute_delete
from utils import validate_required_fields, sanitize_input

def create_supplier(data):
    """Create a new supplier"""
    valid, error = validate_required_fields(data, ['supplier_name'])
    if not valid:
        return None, error
    
    try:
        supplier_id = execute_insert(
            "INSERT INTO suppliers (supplier_name, phone, address) VALUES (%s, %s, %s)",
            (
                sanitize_input(data['supplier_name']),
                sanitize_input(data.get('phone', '')),
                sanitize_input(data.get('address', ''))
            )
        )
        
        return {
            'id': supplier_id,
            'supplier_name': data['supplier_name'],
            'phone': data.get('phone', ''),
            'address': data.get('address', '')
        }, None
    
    except Exception as e:
        return None, str(e)

def get_supplier_by_id(supplier_id):
    """Get supplier by ID"""
    try:
        supplier = execute_query(
            "SELECT id, supplier_name, phone, address FROM suppliers WHERE id = %s",
            (supplier_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        if not supplier:
            return None, "Supplier not found"
        
        return supplier, None
    except Exception as e:
        return None, str(e)

def get_all_suppliers():
    """Get all suppliers"""
    try:
        suppliers = execute_query(
            "SELECT id, supplier_name, phone, address FROM suppliers ORDER BY supplier_name ASC",
            fetch_all=True
        )
        
        return suppliers, None
    except Exception as e:
        return None, str(e)

def update_supplier(supplier_id, data):
    """Update supplier information"""
    try:
        # Verify supplier exists
        supplier = execute_query(
            "SELECT id FROM suppliers WHERE id = %s",
            (supplier_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        if not supplier:
            return None, "Supplier not found"
        
        update_fields = []
        update_values = []
        
        allowed_fields = ['supplier_name', 'phone', 'address']
        
        for field in allowed_fields:
            if field in data and data[field] is not None:
                update_fields.append(f"{field} = %s")
                update_values.append(sanitize_input(data[field]))
        
        if not update_fields:
            return None, "No valid fields to update"
        
        update_values.append(supplier_id)
        
        execute_update(
            f"UPDATE suppliers SET {', '.join(update_fields)} WHERE id = %s",
            update_values
        )
        
        return True, None
    except Exception as e:
        return None, str(e)

def delete_supplier(supplier_id):
    """Delete supplier"""
    try:
        supplier = execute_query(
            "SELECT id FROM suppliers WHERE id = %s",
            (supplier_id,),
            fetch_one=True,
            fetch_all=False
        )
        
        if not supplier:
            return None, "Supplier not found"
        
        execute_delete(
            "DELETE FROM suppliers WHERE id = %s",
            (supplier_id,)
        )
        
        return True, None
    except Exception as e:
        return None, str(e)

def search_suppliers(query_text):
    """Search suppliers by name"""
    try:
        suppliers = execute_query(
            "SELECT id, supplier_name, phone, address FROM suppliers WHERE supplier_name ILIKE %s ORDER BY supplier_name ASC",
            (f"%{query_text}%",),
            fetch_all=True
        )
        
        return suppliers, None
    except Exception as e:
        return None, str(e)
