import os

class Config:
    """Database and Flask configuration"""
    
    # Database Configuration
    DB_CONFIG = {
        'dbname': os.getenv('DB_NAME', 'inventory_db'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgrepass'),
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432')
    }
    
    # JWT Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'supersecretkey_change_in_production')
    JWT_ALGORITHM = 'HS256'
    JWT_EXPIRATION_HOURS = 24
    
    # Flask Configuration
    DEBUG = os.getenv('FLASK_DEBUG', True)
    JSON_SORT_KEYS = False
