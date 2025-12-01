// models/Payment.js
const { pool } = require("../db");
const OrderModel = require("../models/Order");

class PaymentModel {
  async create({ order_id, method_id = 1, amount, provider_ref = null, status = "paid" }) {
    const paid_at = new Date();

    const res = await pool.query(
      `
      INSERT INTO payments (
        order_id,
        method_id,
        amount,
        provider_ref,
        status,
        paid_at
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [order_id, method_id, amount, provider_ref, status, paid_at]
    );

    const payment = res.rows[0];

    // Auto-update order → no confirm needed
    await this._autoCheckOrderPayment(order_id);

    return payment;
  }

  async _autoCheckOrderPayment(order_id) {
    const orderRes = await pool.query(
      `SELECT total_amount FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderRes.rowCount === 0) return;

    const total_amount = Number(orderRes.rows[0].total_amount);

    const paidRes = await pool.query(
      `SELECT SUM(amount) AS paid FROM payments WHERE order_id = $1`,
      [order_id]
    );

    const paid = Number(paidRes.rows[0].paid || 0);

    if (paid >= total_amount) {
      await OrderModel.update(order_id, { status: "paid" });
    } 
  }

  async getByOrder(orderId) {
    const res = await pool.query(
      `SELECT * FROM payments WHERE order_id = $1 ORDER BY id DESC`,
      [orderId]
    );
    return res.rows;
  }
}

module.exports = new PaymentModel();
