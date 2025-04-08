#!/usr/bin/env node
const { Client } = require("pg");
require("dotenv").config();

const dropTables = `DROP TABLE IF EXISTS inventory, categories;`;

const createInventoryTable = `
  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name VARCHAR(50) NOT NULL,
    image TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    description VARCHAR(200),
    category_id INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT false,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET DEFAULT
  )
`;

const createCategoryTable = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    category VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_default BOOLEAN DEFAULT false,
    FOREIGN KEY (parent_category_id) REFERENCES categories(id) ON DELETE CASCADE
  )
`;

const addDefaultData = `
  INSERT INTO categories (category, description, parent_category_id, is_default)
  VALUES
    ('Miscellaneous', 'Products without a category', NULL, true),
    ('Electronics', 'Devices like phones, laptops, and accessories', NULL, true),
    ('Clothing', 'Men and women apparel', NULL, true),
    ('Smartphones', 'Mobile phones and accessories', 2, true),
    ('Laptops', 'Portable computers', 2, true),
    ('Men''s Clothing', 'Shirts, pants, and jackets', 3, true),
    ('Women''s Clothing', 'Dresses, skirts, and tops', 3, true);

  INSERT INTO inventory (name, image, price, quantity, description, category_id, is_default)
  VALUES
    ('iPhone 13', 'iphone_13.jpg', 999.99, 50, 'Latest model with A15 chip and 5G connectivity', 4, true),
    ('MacBook Pro 16"', 'macbook_pro_16.jpg', 2499.99, 30, 'High-performance laptop with M1 Pro chip', 5, true),
    ('Men''s T-Shirt', 'mens_tshirt.jpg', 19.99, 100, 'Comfortable cotton t-shirt in various colors', 6, true),
    ('Women''s Jacket', 'womens_jacket.jpg', 89.99, 75, 'Stylish jacket for women, available in multiple sizes', 7, true);
`;

const createUpdatedAtFunction = `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

const createTriggers = `
  CREATE TRIGGER set_updated_at_inventory
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

  CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
`;

async function main() {
  console.log("seeding...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("Database connected.");
    await client.query(dropTables);
    await client.query(createCategoryTable);
    await client.query(createInventoryTable);
    await client.query(createUpdatedAtFunction);
    await client.query(createTriggers);
    await client.query(addDefaultData);
    console.log("Database seeded.");
  } catch (err) {
    console.log("Error seeding database: ", err)
  } finally {
    await client.end();
  }
}

main();