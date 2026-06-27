"""
Auth controller — legacy file kept for reference.
All active auth logic lives in user_controller.py and is wired through auth_routes.py.
"""

from db import get_db_connection
from config import Config
import bcrypt
import jwt
import datetime


# REGISTER USER (legacy — use user_controller.register_user instead)
def register():
    from flask import request, jsonify
    try:
        data = request.get_json()

        full_name = data.get('full_name')
        email = data.get('email')
        password = data.get('password')

        if not full_name or not email or not password:
            return jsonify({"error": "Full name, email, and password are required"}), 400

        hashed_password = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        )

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO users (full_name, email, password) VALUES (%s, %s, %s)",
            (full_name, email, hashed_password.decode('utf-8'))
        )

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


# LOGIN USER (legacy — use user_controller.login_user instead)
def login():
    from flask import request, jsonify
    try:
        data = request.get_json()

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        stored_password = user[3]

        if not bcrypt.checkpw(password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({"error": "Invalid password"}), 401

        token = jwt.encode({
            "id": user[0],
            "email": user[2],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, Config.SECRET_KEY, algorithm="HS256")

        return jsonify({"message": "Login successful", "token": token}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

