-- ============================================================
-- SOIMS — Smart Online Inventory Management System
-- PostgreSQL Schema  |  3NF Normalized
-- Includes: Tables, Indexes, Triggers, Stored Procedures
-- Authors: Naveed Ul Hassan & Sajid Khan
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('admin', 'user');
  CREATE TYPE order_status     AS ENUM ('pending','confirmed','shipped','delivered','cancelled');
  CREATE TYPE payment_status   AS ENUM ('unpaid','paid','failed','refunded');
  CREATE TYPE stock_change_type AS ENUM (
    'sale','restock','manual_adjustment','order_cancellation','initial_stock'
  );
  CREATE TYPE audit_action     AS ENUM (
    'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','ROLE_CHANGE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(150)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,   -- bcrypt hash
  role        user_role           NOT NULL DEFAULT 'user',
  is_active   BOOLEAN             NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- ── Permissions & RBAC ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(user_id, permission_id)
);

-- Seed basic permissions
INSERT INTO permissions (slug, description) VALUES
  ('products.view', 'View products'),
  ('products.create', 'Create products'),
  ('products.edit', 'Edit products'),
  ('products.delete', 'Delete products'),
  ('orders.manage', 'Manage all orders (view/update)'),
  ('inventory.manage', 'Manage inventory/stock'),
  ('suppliers.manage', 'Manage suppliers'),
  ('reports.view', 'View financial reports'),
  ('users.manage', 'Manage system users')
ON CONFLICT (slug) DO NOTHING;


-- ── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id            SERIAL PRIMARY KEY,
  category_name VARCHAR(100) UNIQUE NOT NULL,
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Suppliers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id            SERIAL PRIMARY KEY,
  supplier_name VARCHAR(150) NOT NULL,
  phone         VARCHAR(30),
  address       TEXT,
  email         VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200)   NOT NULL,
  description TEXT,
  price       NUMERIC(12,2)  NOT NULL CHECK (price >= 0),
  stock       INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id INTEGER        REFERENCES categories(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Purchase Orders ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id          SERIAL PRIMARY KEY,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  status      VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  status       order_status  NOT NULL DEFAULT 'pending',
  notes        TEXT,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Order Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER       NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
  product_id INTEGER       NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity   INTEGER       NOT NULL CHECK (quantity > 0),
  price      NUMERIC(12,2) NOT NULL CHECK (price >= 0),   -- snapshot at time of order
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  payment_method VARCHAR(50)    NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  amount         NUMERIC(14,2),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ── Stock History ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_history (
  id           SERIAL PRIMARY KEY,
  product_id   INTEGER           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type  stock_change_type NOT NULL DEFAULT 'manual_adjustment',
  quantity     INTEGER           NOT NULL,   -- positive = added, negative = removed
  stock_before INTEGER           NOT NULL,
  stock_after  INTEGER           NOT NULL,
  reference_id INTEGER,                      -- order_id or NULL for manual
  notes        TEXT,
  created_by   INTEGER           REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ── Audit Logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INTEGER,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES  (performance optimization)
-- ============================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id   ON suppliers(id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id         ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id  ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_product  ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id     ON audit_logs(user_id);

-- Frequently queried columns
CREATE INDEX IF NOT EXISTS idx_orders_status          ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at      ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name          ON products USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_stock_history_created  ON stock_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created     ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email            ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_status    ON transactions(payment_status);

-- ============================================================
-- TRIGGER FUNCTIONS
-- ============================================================

-- ── 1. Auto-update updated_at timestamp ──────────────────────
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

CREATE OR REPLACE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ── 2. Auto-log stock changes into stock_history ─────────────
-- Fires whenever products.stock changes
CREATE OR REPLACE FUNCTION fn_log_stock_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_change_type stock_change_type;
  v_delta       INTEGER;
BEGIN
  IF NEW.stock = OLD.stock THEN
    RETURN NEW;
  END IF;

  v_delta := NEW.stock - OLD.stock;

  -- Infer change type from delta
  IF v_delta > 0 THEN
    v_change_type := 'restock';
  ELSE
    v_change_type := 'manual_adjustment';
  END IF;

  INSERT INTO stock_history (
    product_id, change_type, quantity,
    stock_before, stock_after, created_at
  ) VALUES (
    NEW.id, v_change_type, v_delta,
    OLD.stock, NEW.stock, NOW()
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_stock_history
  AFTER UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION fn_log_stock_change();

-- ── 3. Audit log for critical admin actions ───────────────────
-- Logs DELETE on products and role changes on users
CREATE OR REPLACE FUNCTION fn_audit_product_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO audit_logs (action, table_name, record_id, old_values, created_at)
  VALUES (
    'DELETE', 'products', OLD.id,
    jsonb_build_object(
      'name', OLD.name,
      'price', OLD.price,
      'stock', OLD.stock,
      'category_id', OLD.category_id
    ),
    NOW()
  );
  RETURN OLD;
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_product_delete
  BEFORE DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_audit_product_delete();

CREATE OR REPLACE FUNCTION fn_audit_role_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role <> OLD.role THEN
    INSERT INTO audit_logs (action, table_name, record_id, old_values, new_values, created_at)
    VALUES (
      'ROLE_CHANGE', 'users', NEW.id,
      jsonb_build_object('role', OLD.role),
      jsonb_build_object('role', NEW.role),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_audit_role_change
  AFTER UPDATE OF role ON users
  FOR EACH ROW EXECUTE FUNCTION fn_audit_role_change();

-- ── 4. Prevent stock going negative ──────────────────────────
CREATE OR REPLACE FUNCTION fn_check_stock_non_negative()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative for product id=%', NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_stock_non_negative
  BEFORE UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION fn_check_stock_non_negative();

-- ============================================================
-- STORED PROCEDURE — process_order
-- Atomically validates stock, creates order + items,
-- deducts stock, logs history, creates transaction.
-- Uses SELECT FOR UPDATE to prevent race conditions.
-- ============================================================

CREATE OR REPLACE FUNCTION process_order(
  p_user_id         INTEGER,
  p_items           JSONB,        -- [{"product_id": 1, "quantity": 2}, ...]
  p_payment_method  VARCHAR DEFAULT 'cash',
  p_shipping_address TEXT   DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_order_id       INTEGER;
  v_total          NUMERIC(14,2) := 0;
  v_item           JSONB;
  v_product_id     INTEGER;
  v_quantity       INTEGER;
  v_price          NUMERIC(12,2);
  v_stock          INTEGER;
  v_transaction_id INTEGER;
BEGIN
  -- ── Validate each item and lock rows (concurrency control) ──
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    IF v_quantity <= 0 THEN
      RAISE EXCEPTION 'Quantity must be positive for product_id=%', v_product_id;
    END IF;

    -- Lock the product row to prevent concurrent overselling
    SELECT price, stock INTO v_price, v_stock
    FROM products
    WHERE id = v_product_id AND is_active = TRUE
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product id=% not found or inactive', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product_id=%. Available: %, Requested: %',
        v_product_id, v_stock, v_quantity;
    END IF;

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  -- ── Create the order ─────────────────────────────────────────
  INSERT INTO orders (user_id, total_amount, status, shipping_address, created_at, updated_at)
  VALUES (p_user_id, v_total, 'pending', p_shipping_address, NOW(), NOW())
  RETURNING id INTO v_order_id;

  -- ── Insert order items + deduct stock ────────────────────────
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::INTEGER;
    v_quantity   := (v_item->>'quantity')::INTEGER;

    SELECT price INTO v_price FROM products WHERE id = v_product_id;

    INSERT INTO order_items (order_id, product_id, quantity, price, created_at)
    VALUES (v_order_id, v_product_id, v_quantity, v_price, NOW());

    -- Deduct stock (triggers fn_log_stock_change automatically)
    UPDATE products
    SET stock = stock - v_quantity
    WHERE id = v_product_id;

    -- Explicit stock_history entry with sale type and reference
    UPDATE stock_history
    SET change_type  = 'sale',
        reference_id = v_order_id,
        notes        = 'Order #' || v_order_id
    WHERE product_id = v_product_id
      AND created_at = (
        SELECT MAX(created_at) FROM stock_history WHERE product_id = v_product_id
      );
  END LOOP;

  -- ── Create transaction record ─────────────────────────────────
  INSERT INTO transactions (order_id, payment_method, payment_status, amount, created_at, updated_at)
  VALUES (v_order_id, p_payment_method, 'unpaid', v_total, NOW(), NOW())
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'order_id',       v_order_id,
    'transaction_id', v_transaction_id,
    'total_amount',   v_total,
    'status',         'pending'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction rolls back automatically on exception
    RAISE;
END;
$$;

-- ============================================================
-- STORED PROCEDURE — restock_product
-- Admin restocks a product with full audit trail
-- ============================================================

CREATE OR REPLACE FUNCTION restock_product(
  p_product_id INTEGER,
  p_quantity   INTEGER,
  p_admin_id   INTEGER,
  p_notes      TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Restock quantity must be positive';
  END IF;

  SELECT stock INTO v_old_stock
  FROM products
  WHERE id = p_product_id AND is_active = TRUE
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product id=% not found', p_product_id;
  END IF;

  v_new_stock := v_old_stock + p_quantity;

  UPDATE products SET stock = v_new_stock WHERE id = p_product_id;

  -- Override the auto-logged entry with richer data
  UPDATE stock_history
  SET change_type  = 'restock',
      created_by   = p_admin_id,
      notes        = COALESCE(p_notes, 'Manual restock by admin')
  WHERE product_id = p_product_id
    AND created_at = (
      SELECT MAX(created_at) FROM stock_history WHERE product_id = p_product_id
    );

  RETURN jsonb_build_object(
    'product_id',   p_product_id,
    'stock_before', v_old_stock,
    'stock_after',  v_new_stock,
    'added',        p_quantity
  );
END;
$$;

-- ============================================================
-- STORED PROCEDURE — get_business_summary
-- Returns aggregated KPIs in one round-trip
-- ============================================================

CREATE OR REPLACE FUNCTION get_business_summary()
RETURNS JSONB
LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_customers',          (SELECT COUNT(*) FROM users WHERE role = 'user'),
    'total_products',           (SELECT COUNT(*) FROM products WHERE is_active = TRUE),
    'total_categories',         (SELECT COUNT(*) FROM categories),
    'total_suppliers',          (SELECT COUNT(*) FROM suppliers),
    'total_orders',             (SELECT COUNT(*) FROM orders),
    'pending_orders',           (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'total_revenue',            COALESCE((
                                  SELECT SUM(total_amount) FROM orders
                                  WHERE status IN ('delivered','confirmed')
                                ), 0),
    'inventory_value',          COALESCE((SELECT SUM(price * stock) FROM products WHERE is_active = TRUE), 0),
    'low_stock_items',          (SELECT COUNT(*) FROM products WHERE stock <= 10 AND is_active = TRUE),
    'out_of_stock_items',       (SELECT COUNT(*) FROM products WHERE stock = 0 AND is_active = TRUE),
    'successful_transactions',  (SELECT COUNT(*) FROM transactions WHERE payment_status = 'paid')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================
-- VIEWS  (convenience for reporting)
-- ============================================================

CREATE OR REPLACE VIEW v_product_details AS
SELECT
  p.id,
  p.name,
  p.description,
  p.price,
  p.stock,
  p.is_active,
  p.created_at,
  p.updated_at,
  c.id          AS category_id,
  c.category_name,
  s.id          AS supplier_id,
  s.supplier_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN suppliers  s ON p.supplier_id  = s.id;

CREATE OR REPLACE VIEW v_order_details AS
SELECT
  o.id,
  o.total_amount,
  o.status,
  o.notes,
  o.created_at,
  o.updated_at,
  u.id        AS user_id,
  u.full_name,
  u.email,
  t.id        AS transaction_id,
  t.payment_method,
  t.payment_status
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN transactions t ON t.order_id = o.id;

-- ============================================================
-- SAMPLE DATA  (run after schema creation)
-- ============================================================

-- Default admin (password: Admin@1234)
INSERT INTO users (full_name, email, password, role)
VALUES (
  'System Admin',
  'admin@soims.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMqJqhN3uXyZ8K5mN1pQ7vR2Oe',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- GRANT PERMISSIONS  (adjust for your DB user)
-- ============================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO inventory_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
-- GRANT EXECUTE ON ALL FUNCTIONS        IN SCHEMA public TO inventory_user;
