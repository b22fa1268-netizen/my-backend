// models/Cart.js
const { pool } = require("../db");

class CartModel {
  async getOrCreateCart(userId) {
    const existing = await pool.query(
      `SELECT id FROM carts WHERE user_id = $1`,
      [userId]
    );
    if (existing.rows.length) return existing.rows[0];

    const inserted = await pool.query(
      `INSERT INTO carts (user_id, created_at) VALUES ($1, NOW()) RETURNING id`,
      [userId]
    );
    return inserted.rows[0];
  }

  // get all items in user's cart
  async getCartItems(userId) {
    const res = await pool.query(
      `
      SELECT
        ci.cart_id,
        ci.product_id,
        ci.quantity,
        p.name AS product_name,
        p.sku,
        p.price
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.user_id = $1
      ORDER BY ci.product_id DESC
      `,
      [userId]
    );
    return res.rows;
  }

  // add or increment
  async addItem(userId, productId, quantity = 1) {
    const cart = await this.getOrCreateCart(userId);

    // does this product already exist in cart?
    const existing = await pool.query(
      `SELECT quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
      [cart.id, productId]
    );

    if (existing.rows.length) {
      const newQty = existing.rows[0].quantity + quantity;
      await pool.query(
        `UPDATE cart_items
         SET quantity = $1
         WHERE cart_id = $2 AND product_id = $3`,
        [newQty, cart.id, productId]
      );
      return {
        cart_id: cart.id,
        product_id: productId,
        quantity: newQty,
      };
    }

    // insert new line
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)`,
      [cart.id, productId, quantity]
    );

    return {
      cart_id: cart.id,
      product_id: productId,
      quantity,
    };
  }

  // update quantity using product_id
  async updateItem(userId, productId, quantity) {
    const cart = await this.getOrCreateCart(userId);
    const res = await pool.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE cart_id = $2 AND product_id = $3
       RETURNING cart_id, product_id, quantity`,
      [quantity, cart.id, productId]
    );
    return res.rows[0];
  }

  // remove line using product_id
  async removeItem(userId, productId) {
    const cart = await this.getOrCreateCart(userId);
    const res = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id = $1 AND product_id = $2
       RETURNING cart_id, product_id`,
      [cart.id, productId]
    );
    return res.rows[0];
  }

  async clearCart(userId) {
    const cart = await this.getOrCreateCart(userId);
    await pool.query(`DELETE FROM cart_items WHERE cart_id = $1`, [cart.id]);
  }
}

module.exports = new CartModel();
