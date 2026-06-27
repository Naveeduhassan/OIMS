# Smart Online Inventory Management System (SOIMS) - Backend

A comprehensive Flask-based backend API for inventory management system with PostgreSQL database.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip

### Installation

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables (optional):**
Create a `.env` file in the backend directory:
```
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=postgrepass
DB_HOST=localhost
DB_PORT=5432
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here
```

3. **Initialize database:**
Run the SQL script provided in the database folder to create tables and triggers.

4. **Run the server:**
```bash
python app.py
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /profile` - Get current user profile (requires token)
- `PUT /profile` - Update user profile (requires token)
- `GET /users` - Get all users (admin only)

### Products (`/api/products`)
- `GET /` - Get all products (with pagination)
- `GET /search?q=query` - Search products
- `GET /category/<id>` - Get products by category
- `GET /low-stock?threshold=10` - Get low stock products (admin)
- `GET /<id>` - Get single product
- `POST /` - Create product (admin only)
- `PUT /<id>` - Update product (admin only)
- `DELETE /<id>` - Delete product (admin only)

### Categories (`/api/categories`)
- `GET /` - Get all categories
- `GET /<id>` - Get single category
- `POST /` - Create category (admin only)
- `PUT /<id>` - Update category (admin only)
- `DELETE /<id>` - Delete category (admin only)

### Orders (`/api/orders`)
- `POST /` - Create order (authenticated users)
- `GET /` - Get orders (admin: all, user: own orders)
- `GET /<id>` - Get single order
- `PUT /<id>/status` - Update order status (admin only)
- `POST /<id>/cancel` - Cancel order
- `GET /status/<status>` - Get orders by status (admin only)

### Transactions (`/api/transactions`)
- `POST /` - Create transaction
- `GET /` - Get all transactions (admin only)
- `GET /<id>` - Get single transaction
- `GET /order/<order_id>` - Get transaction by order
- `PUT /<id>/payment-status` - Update payment status (admin only)
- `GET /status/<status>` - Get transactions by status (admin only)
- `GET /statistics` - Get payment statistics (admin only)

### Suppliers (`/api/suppliers`)
- `GET /` - Get all suppliers
- `GET /search?q=query` - Search suppliers
- `GET /<id>` - Get single supplier
- `POST /` - Create supplier (admin only)
- `PUT /<id>` - Update supplier (admin only)
- `DELETE /<id>` - Delete supplier (admin only)

### Stock (`/api/stock`)
- `GET /product/<id>/history` - Get stock history
- `POST /adjust` - Adjust stock (admin only)
- `GET /value` - Get total inventory value (admin only)
- `GET /summary` - Get inventory summary (admin only)
- `GET /low-stock?threshold=10` - Get low stock alert (admin only)
- `GET /product/<id>/movement?days=30` - Get product movement (admin only)
- `GET /by-category` - Get stock by category (admin only)

### Reports (`/api/reports`)
- `GET /sales?start_date=...&end_date=...` - Get sales report (admin only)
- `GET /top-products?limit=10` - Get top products (admin only)
- `GET /customers` - Get customer statistics (admin only)
- `GET /categories` - Get category performance (admin only)
- `GET /payments` - Get payment statistics (admin only)
- `GET /inventory-valuation` - Get inventory valuation (admin only)
- `GET /order-status` - Get order status breakdown (admin only)
- `GET /daily-analytics` - Get daily analytics (admin only)
- `GET /summary` - Get business summary (admin only)

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are obtained from the `/api/auth/login` endpoint.

## 📋 Request/Response Format

### Successful Response:
```json
{
  "data": {...},
  "message": "Success message (optional)"
}
```

### Error Response:
```json
{
  "error": "Error message"
}
```

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (Admin/User)
- SQL injection prevention with parameterized queries
- Input validation and sanitization
- CORS protection
- Secure error handling

## 📊 Database

### Tables
- `users` - User accounts
- `categories` - Product categories
- `products` - Product inventory
- `suppliers` - Supplier information
- `orders` - Customer orders
- `order_items` - Order line items
- `transactions` - Payment transactions
- `stock_history` - Stock change tracking

### Triggers & Functions
- Automatic stock update on order creation
- Stock change history logging
- Payment status management

## 🧪 Testing

Test endpoints using:
- Postman
- cURL
- VS Code REST Client
- Insomnia

Example request:
```bash
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>"
```

## 🚨 Troubleshooting

**Database Connection Error:**
- Verify PostgreSQL is running
- Check DB credentials in config.py
- Ensure database `inventory_db` exists

**Import Errors:**
- Install all dependencies: `pip install -r requirements.txt`
- Check Python path and virtual environment

**CORS Issues:**
- Verify Flask-CORS is installed
- Check origin settings in app.py

## 📝 Environment Variables

- `DB_NAME` - Database name (default: inventory_db)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password (default: postgrepass)
- `DB_HOST` - Database host (default: localhost)
- `DB_PORT` - Database port (default: 5432)
- `SECRET_KEY` - JWT secret key
- `FLASK_DEBUG` - Debug mode (default: True)

## 🔄 Development Workflow

1. Create feature branch
2. Make changes in controllers and routes
3. Test endpoints with Postman/cURL
4. Commit with meaningful messages
5. Push and create pull request

## 📦 Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration settings
├── db.py                 # Database utilities
├── utils.py              # Helper functions
├── auth_middleware.py    # JWT middleware
├── requirements.txt      # Python dependencies
├── controllers/          # Business logic
│   ├── user_controller.py
│   ├── product_controller.py
│   ├── category_controller.py
│   ├── order_controller.py
│   ├── transaction_controller.py
│   ├── supplier_controller.py
│   ├── stock_controller.py
│   └── report_controller.py
└── routes/              # API endpoints
    ├── auth_routes.py
    ├── product_routes.py
    ├── category_routes.py
    ├── order_routes.py
    ├── transaction_routes.py
    ├── supplier_routes.py
    ├── stock_routes.py
    └── report_routes.py
```

## 📄 License

This project is part of the SOIMS coursework.

## 👥 Authors

- Naveed Ul Hassan
- Sajid Khan

---

**Status:** Production Ready ✅
**Last Updated:** 2026
