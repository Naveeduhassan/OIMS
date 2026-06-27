# Smart Online Inventory Management System (SOIMS)

SOIMS is a modern, web-based inventory management platform designed for small to medium-sized online businesses. It automates stock tracking, order processing, and generates real-time insights for better decision-making.

## 🚀 Features

- **Real-Time Stock Tracking**: Automatically deducts stock upon order placement.
- **Role-Based Access Control (RBAC)**: Supports Admin, Staff, and User roles.
  - *Admin*: Full CRUD control over products, orders, users, and reports.
  - *Staff*: Management of orders and inventory.
  - *User*: Browse products, place orders, and view order history.
- **Order Management**: End-to-end processing with automated history tracking.
- **Reporting & Analytics**: Comprehensive dashboards for business insights.
- **Security-First**: Built with OWASP guidelines (bcrypt password hashing, JWT authentication, rate-limiting, and parameterized SQL).

## 🛠️ Tech Stack

- **Frontend**: React.js with Vite, Tailwind CSS
- **Backend**: Python (Flask)
- **Database**: PostgreSQL
- **Security**: JWT, bcrypt, Flask-Limiter, Flask-CORS

## ⚙️ Setup Instructions

### 1. Database Setup
1. Ensure PostgreSQL is installed and running.
2. Create a database (e.g., `inventory_db`).
3. Run the schema creation script to set up the normalized database schema:
   ```bash
   psql -U postgres -d inventory_db -f backend/schema.sql
   ```
4. Run the database migration script to ensure all columns (like `created_at` in `order_items`) and roles are fully seeded:
   ```bash
   cd backend
   python fix_db.py
   ```
*This will create the default admin user: `admin@example.com` / `admin123`.*

### 2. Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure the environment by creating a `.env` file in the `backend` directory (optional if defaults are sufficient).
4. Start the backend server:
   ```bash
   # Windows
   start.bat
   # Unix/Linux
   ./start.sh
   ```
   *The backend will run on port `5001`.*

### 3. Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 4. Running the Entire App (Quick Start)
You can start both the frontend and backend simultaneously using the root package.json:
```bash
npm install # if not already installed
npm run dev
```

## 🔒 Security Measures
- **Rate Limiting**: Protects authentication routes from brute-force attacks.
- **SQL Injection Prevention**: Uses parameterized queries and stored procedures.
- **CORS Restricted**: Allowed origins explicitly specified for the frontend application.
- **Stateless Auth**: JWT based sessions.

## 👥 Contributors
- **Naveed Ul Hassan**
- **Sajid Khan**

*Abdul Wali Khan University Mardan, Timergara Campus*
