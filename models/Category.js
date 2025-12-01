const { pool } = require("../db");

const tableName = "categories";

// Бүх ангиллуудыг авах (pagination-тай)
async function getAllCategories({ limit = 10, page = 0 } = {}) {
  const offset = page * limit;
  const result = await pool.query(
    `SELECT * FROM ${tableName} 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

// ID-аар ангилал авах
async function getCategoryById(id) {
  const result = await pool.query(
    `SELECT * FROM ${tableName} WHERE id = $1`,
    [id]
  );
  return result.rows?.[0];
}

// Нэрээр ангилал хайх (давхардал шалгах)
async function getCategoryByName(name) {
  const result = await pool.query(
    `SELECT * FROM ${tableName} WHERE LOWER(name) = LOWER($1)`,
    [name]
  );
  return result.rows?.[0];
}

// Шинэ ангилал үүсгэх
async function createCategory(dto) {
  const { name, description, photo } = dto;

  if (!name || name.trim().length === 0) {
    throw new Error("Ангиллын нэр хоосон байж болохгүй");
  }

  // Давхардсан нэр шалгах
  const existing = await getCategoryByName(name);
  if (existing) {
    throw new Error("Ийм нэртэй ангилал аль хэдийн бүртгэлтэй байна");
  }

  const result = await pool.query(
    `INSERT INTO ${tableName} (name, description, photo, created_at, updated_at) 
     VALUES ($1, $2, $3, NOW(), NOW()) 
     RETURNING *`,
    [name.trim(), description || null, photo || null]
  );

  return result.rows[0];
}

// Ангилал шинэчлэх
async function updateCategory(id, dto) {
  const { name, description, photo } = dto;

  // Ангилал байгаа эсэхийг шалгах
  const existing = await getCategoryById(id);
  if (!existing) {
    return null;
  }

  // Хэрэв нэр өөрчлөгдсөн бол давхардал шалгах
  if (name && name !== existing.name) {
    const duplicate = await getCategoryByName(name);
    if (duplicate && duplicate.id !== parseInt(id)) {
      throw new Error("Ийм нэртэй ангилал аль хэдийн бүртгэлтэй байна");
    }
  }

  const result = await pool.query(
    `UPDATE ${tableName} 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         photo = COALESCE($3, photo),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [
      name?.trim() || null,
      description !== undefined ? description : null,
      photo !== undefined ? photo : null,
      id
    ]
  );

  return result.rows[0];
}

// Ангилал устгах
async function deleteCategory(id) {
  // Эхлээд ангилал байгаа эсэхийг шалгах
  const existing = await getCategoryById(id);
  if (!existing) {
    return null;
  }

  // Энэ ангиллд бүтээгдэхүүн байгаа эсэхийг шалгах
  const productsCheck = await pool.query(
    `SELECT COUNT(*) as count FROM products WHERE category_id = $1`,
    [id]
  );

  if (parseInt(productsCheck.rows[0].count) > 0) {
    throw new Error("Энэ ангиллд бүтээгдэхүүн байгаа тул устгах боломжгүй");
  }

  const result = await pool.query(
    `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
}

module.exports = {
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  createCategory,
  updateCategory,
  deleteCategory,
};