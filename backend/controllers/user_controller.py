"""User authentication controller"""

import bcrypt
import jwt
import datetime
from db import execute_query, execute_insert, execute_update
from config import Config
from utils import validate_email, validate_password, validate_required_fields, sanitize_input

def hash_password(password):
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password, hashed):
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_token(user_id, role):
    """Generate JWT token"""
    payload = {
        'id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS),
        'iat': datetime.datetime.utcnow()
    }
    token = jwt.encode(payload, Config.SECRET_KEY, algorithm=Config.JWT_ALGORITHM)
    return token

def register_user(data):
    """Register a new user"""
    # Validate required fields
    valid, error = validate_required_fields(data, ['full_name', 'email', 'password'])
    if not valid:
        return None, error
    
    # Validate email format
    if not validate_email(data['email']):
        return None, "Invalid email format"
    
    # Validate password strength
    if not validate_password(data['password']):
        return None, "Password must be at least 8 characters with letters and numbers"
    
    # Check if email already exists
    existing_user = execute_query(
        "SELECT id FROM users WHERE email = %s",
        (data['email'],),
        fetch_one=True,
        fetch_all=False
    )
    
    if existing_user:
        return None, "Email already registered"
    
    # Hash password
    hashed_password = hash_password(data['password'])

    # Optional fields
    phone   = sanitize_input(data.get('phone', '')) or None
    address = sanitize_input(data.get('address', '')) or None
    
    # Insert user — first user ever becomes admin, all others are regular users
    try:
        existing_count = execute_query(
            "SELECT COUNT(*) as cnt FROM users",
            fetch_one=True,
            fetch_all=False
        )
        role = 'admin' if (existing_count and existing_count['cnt'] == 0) else 'user'

        user_id = execute_insert(
            "INSERT INTO users (full_name, email, password, role, phone, address) VALUES (%s, %s, %s, %s, %s, %s)",
            (sanitize_input(data['full_name']), data['email'], hashed_password, role, phone, address)
        )

        # Generate token
        token = generate_token(user_id, role)

        return {
            'id':        user_id,
            'full_name': data['full_name'],
            'email':     data['email'],
            'role':      role,
            'phone':     phone,
            'address':   address,
            'token':     token
        }, None
    
    except Exception as e:
        return None, str(e)

def login_user(data):
    """Authenticate user and return token"""
    # Validate required fields
    valid, error = validate_required_fields(data, ['email', 'password'])
    if not valid:
        return None, error
    
    # Find user by email
    user = execute_query(
        "SELECT id, full_name, email, password, role, is_active FROM users WHERE email = %s",
        (data['email'],),
        fetch_one=True,
        fetch_all=False
    )

    if user and not user['is_active']:
        return None, "Account is disabled. Contact an administrator."
    
    if not user:
        return None, "Invalid email or password"
    
    # Verify password
    if not verify_password(data['password'], user['password']):
        return None, "Invalid email or password"
    
    # Generate token
    token = generate_token(user['id'], user['role'])
    
    return {
        'id': user['id'],
        'full_name': user['full_name'],
        'email': user['email'],
        'role': user['role'],
        'token': token
    }, None

def get_user_by_id(user_id):
    """Get user by ID"""
    try:
        user = execute_query(
            "SELECT id, full_name, email, role, is_active, phone, address, created_at FROM users WHERE id = %s",
            (user_id,),
            fetch_one=True,
            fetch_all=False
        )
        return user, None
    except Exception as e:
        return None, str(e)

def update_user(user_id, data):
    """Update user information"""
    allowed_fields = ['full_name', 'email', 'password', 'phone', 'address']
    update_fields  = []
    update_values  = []
    
    for field in allowed_fields:
        if field in data and data[field] is not None:
            if field == 'email' and not validate_email(data[field]):
                return None, "Invalid email format"
            if field == 'password' and not validate_password(data[field]):
                return None, "Password must be at least 8 characters with letters and numbers"
            
            if field == 'password':
                update_fields.append(f"{field} = %s")
                update_values.append(hash_password(data[field]))
            else:
                update_fields.append(f"{field} = %s")
                update_values.append(sanitize_input(str(data[field])))
    
    if not update_fields:
        return None, "No valid fields to update"
    
    update_values.append(user_id)
    
    try:
        execute_update(
            f"UPDATE users SET {', '.join(update_fields)}, updated_at = NOW() WHERE id = %s",
            update_values
        )
        return True, None
    except Exception as e:
        return None, str(e)

def get_all_users():
    """Get all users (admin only)"""
    try:
        users = execute_query(
            "SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC",
            fetch_all=True
        )
        return users, None
    except Exception as e:
        return None, str(e)

