const { pool } = require("../db");
const tableName = "users";

async function getAllUsers() {
  const result = await pool.query(
    `SELECT id, username, email, phone, role, created_at FROM ${tableName}`
  );
  return result.rows;
}

async function getUserById(id) {
  const result = await pool.query(
    `SELECT id, username, email, phone, role, created_at FROM ${tableName} WHERE id = $1`,
    [id]
  );
  return result.rows?.[0];
}

async function getUserByIdWithPassword(id) {
  const result = await pool.query(
    `SELECT * FROM ${tableName} WHERE id = $1`,
    [id]
  );
  return result.rows?.[0];
}

async function getUserByPhone(phone) {
  const result = await pool.query(
    `SELECT * FROM ${tableName} WHERE phone = $1`,
    [phone]
  );
  return result.rows?.[0];
}

async function getUserByEmail(email) {
  const result = await pool.query(
    `SELECT * FROM ${tableName} WHERE email = $1`,
    [email]
  );
  return result.rows?.[0];
}

async function createUser(dto) {
  const { username, password_hash, email, role, phone } = dto;
  const result = await pool.query(
    `INSERT INTO ${tableName} (username, password_hash, phone, email, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, phone, role, created_at`,
    [username, password_hash, phone, email, role || 10]
  );
  return result.rows[0];
}

async function updatePassword(userId, newPasswordHash) {
  const result = await pool.query(
    `UPDATE ${tableName} SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2 RETURNING id, username, email, phone, role`,
    [newPasswordHash, userId]
  );
  return result.rows[0];
}

async function updateUser(userId, dto) {
  const { username, email, phone, role } = dto;
  const result = await pool.query(
    `UPDATE ${tableName} 
     SET username = COALESCE($1, username),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 
     RETURNING id, username, email, phone, role, created_at`,
    [username, email, phone, role, userId]
  );
  return result.rows[0];
}

async function deleteUser(userId) {
  const result = await pool.query(
    `DELETE FROM ${tableName} WHERE id = $1 RETURNING id`,
    [userId]
  );
  return result.rows[0];
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByIdWithPassword,
  getUserByPhone,
  getUserByEmail,
  createUser,
  updatePassword,
  updateUser,
  deleteUser,
};