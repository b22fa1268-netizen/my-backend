// controller/orderReports.js
const { pool } = require("../db");

exports.getOrderProblems = async (req, res) => {
  try {
    // 1) ❌ Амжилтгүй төлбөртэй захиалга
    const failedPayments = await pool.query(`
      SELECT 
        o.id AS order_id,
        o.user_id,
        o.status AS order_status,
        p.amount,
        p.status AS payment_status,
        p.provider_ref,
        o.total_amount,
        o.order_date
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      WHERE p.status = 'failed' OR o.status = 'payment_failed'
      ORDER BY o.id DESC
    `);

    // 2) ❌ Цуцлагдсан захиалга
    const cancelledOrders = await pool.query(`
      SELECT 
        id AS order_id,
        user_id,
        total_amount,
        order_date,
        status
      FROM orders
      WHERE status = 'cancelled'
      ORDER BY id DESC
    `);

    // 3) 🟡 Сагсанд хийгээд аваагүй (abandoned carts)
    const abandonedCarts = await pool.query(`
      SELECT 
        c.user_id,
        ci.product_id,
        ci.quantity,
        p.name AS product_name,
        p.price,
        c.created_at AS cart_created
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.id
      JOIN products p ON p.id = ci.product_id
      WHERE c.user_id NOT IN (SELECT DISTINCT user_id FROM orders)
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
    res.status(500).json({ 
      success: false, 
      message: "Тайлан үүсгэхэд алдаа гарлаа" 
    });
  }
};
