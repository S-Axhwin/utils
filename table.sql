-- 1. Vendor Group
CREATE TABLE vendor_group (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 2. Platform
CREATE TABLE platform (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- 3. Vendors
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES vendor_group(id) ON DELETE SET NULL,
    platform_id INT REFERENCES platform(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100),
    contact_info TEXT
);

-- 4. Landing Rate (Product Master with Rates)
CREATE TABLE landing_rate (
    id SERIAL PRIMARY KEY,
    platform_id INT NOT NULL REFERENCES platform(id) ON DELETE CASCADE,
    sku_id VARCHAR(50) NOT NULL UNIQUE,       -- SKU ID
    product_name VARCHAR(150) NOT NULL,
    mrp DECIMAL(10,2) NOT NULL,               -- MRP
    billing_value_per_qty DECIMAL(10,2) NOT NULL, -- Net billing price
    cases INT,                                -- Pack/case count
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 5. Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) NOT NULL UNIQUE,   -- PO Number
    vendor_id INT NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    platform_id INT NOT NULL REFERENCES platform(id) ON DELETE CASCADE,
    city VARCHAR(100) NOT NULL,
    po_created_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) DEFAULT 'Pending'
);

-- 6. Order Items
CREATE TABLE order_item (
    id SERIAL PRIMARY KEY,
    po_id INT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    sku_id VARCHAR(50) NOT NULL REFERENCES landing_rate(sku_id) ON DELETE RESTRICT, -- mapped to Landing Rate SKU
    ordered_quantity INT NOT NULL,
    received_quantity INT DEFAULT 0
);

