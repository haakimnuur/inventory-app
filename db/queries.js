const pool = require("./pool");

async function getAllTopCategories() {
  const { rows } = await pool.query("SELECT * FROM categories WHERE parent_category_id IS NULL ORDER BY id;")
  return rows; 
}

async function getAllSubCategories() {
  const { rows } = await pool.query("SELECT * FROM categories WHERE parent_category_id IS NOT NULL ORDER BY id")
  return rows;
}

async function getallInventory() {
  const query = `
    SELECT inventory.*, categories.category AS category_name
    FROM inventory
    LEFT JOIN categories ON inventory.category_id = categories.id
    ORDER BY inventory.id ASC;
  `;

  const { rows } = await pool.query(query);
  return rows; 
}

async function getCategoryById(id) {
  const { rows } = await pool.query("SELECT * FROM categories WHERE id = ($1)", [id]);
  return rows[0]; 
}

async function getSubCategoriesById(id) {
  const { rows } = await pool.query("SELECT * FROM categories WHERE parent_category_id = ($1)", [id])
  return rows;
}

async function getProductsByCategoryId(id) {
  const { rows } = await pool.query("SELECT * FROM inventory WHERE category_id = ($1)", [id]);
  return rows;
}

async function insertCategory(category, description, parentId) {
  const result = await pool.query(
    "INSERT INTO categories (category, description, parent_category_id) VALUES ($1, $2, $3) RETURNING *",
    [category, description, parentId]
  );

  return result.rows[0];
}

async function updateCategory(id, category, description) {
  // Check if the category is default
  const { rows } = await pool.query('SELECT is_default FROM categories WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new Error('Category not found');
  }

  if (rows[0].is_default) {
    throw new Error('This category cannot be edited as it is a default item.');
  }

  // Proceed with update if not default
  const result = await pool.query(
    "UPDATE categories SET category = $1, description = $2 WHERE id = $3 RETURNING *",
    [category, description, id]
  );

  return result.rows[0];
}

async function getProductById(id) {
  const { rows } = await pool.query(
    `SELECT inventory.*, categories.category AS category_name 
     FROM inventory 
     JOIN categories ON inventory.category_id = categories.id 
     WHERE inventory.id = $1`,
    [id]
  );
  return rows[0]; 
}

async function insertProduct(name, description, quantity, price, category_id, image) {
  const result = await pool.query("INSERT INTO inventory (name, description, quantity, price, category_id, image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *", 
    [name, description, quantity, parseFloat(price), category_id, image]
  );

  return result.rows[0];
}

async function updateProduct(id, name, description, price, quantity, categoryId, image) {
  // Check if the product is default
  const { rows } = await pool.query('SELECT is_default FROM inventory WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new Error('Product not found');
  }

  if (rows[0].is_default) {
    throw new Error('This product cannot be edited as it is a default item.');
  }

  // Proceed with updating the product if it's not default
  const result = await pool.query(
    `UPDATE inventory 
     SET name = $1, description = $2, price = $3, quantity = $4, category_id = $5, image = $6, updated_at = CURRENT_TIMESTAMP
     WHERE id = $7 RETURNING *`,
    [name, description, price, quantity, categoryId, image, id]
  );
  return result.rows[0];
}

async function deleteProductById(id) {
  // First, check if the product is marked as 'is_default'
  const { rows } = await pool.query('SELECT is_default FROM inventory WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new Error('Product not found');
  }

  if (rows[0].is_default) {
    throw new Error('This product cannot be deleted as it is a default item.');
  }

  // Proceed with the deletion if the product is not default
  const deleteResult = await pool.query("DELETE FROM inventory WHERE id = $1 RETURNING *", [id]);
  return deleteResult.rows[0];
}

async function deleteCategoryById(id) {
  // Check if the category is default before deleting
  const { rows } = await pool.query('SELECT is_default FROM categories WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new Error('Category not found');
  }

  if (rows[0].is_default) {
    throw new Error('This category cannot be deleted as it is a default item.');
  }

  // Proceed with deletion if not default
  const result = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  return result;
}

module.exports = {
  getAllTopCategories,
  getAllSubCategories,
  getallInventory,
  getCategoryById,
  getSubCategoriesById,
  getProductsByCategoryId,
  insertCategory,
  updateCategory,
  getProductById,
  insertProduct,
  updateProduct,
  deleteProductById,
  deleteCategoryById
}