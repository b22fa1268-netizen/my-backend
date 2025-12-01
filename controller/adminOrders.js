const { pool } = require("../db");

exports.getOrderReport = async (req, res) => {
  try {
    // FAILED payments
    const failedPayments = await pool.query(`
      SELECT o.id AS order_id, o.user_id, o.status, p.amount, p.status AS payment_status
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      WHERE p.status = 'failed'
      ORDER BY o.id DESC
    `);

    // CANCELLED orders
    const cancelledOrders = await pool.query(`
      SELECT id, user_id, status, total_amount, order_date
      FROM orders
      WHERE status = 'cancelled'
      ORDER BY id DESC
    `);

    // Abandoned carts → carts that have items but no orders created
    const abandonedCarts = await pool.query(`
      SELECT c.user_id, ci.product_id, ci.quantity, p.name AS product_name
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.id NOT IN (SELECT DISTINCT cart_id FROM orders)
      ORDER BY c.user_id
    `);

    res.json({
      success: true,
      data: {
        failedPayments: failedPayments.rows,
        cancelledOrders: cancelledOrders.rows,
        abandonedCarts: abandonedCarts.rows,
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Report generation failed" });
  }
};
