// controller/payments.js
const PaymentModel = require("../models/Payment");
const { pool } = require("../db");

// ------------------------------------------------------
// 1) USER PAYS → auto-pay, auto-refund if overpaid
// ------------------------------------------------------
exports.createPayment = async (req, res, next) => {
  try {
    const { order_id, amount, method_id, provider_ref } = req.body;

    if (!order_id || !amount) {
      return res.status(400).json({
        success: false,
        message: "order_id болон amount шаардлагатай"
      });
    }

    // Check if the order exists
    const orderCheck = await pool.query(
      `SELECT id, total_amount FROM orders WHERE id = $1`,
      [order_id]
    );

    if (orderCheck.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Ийм захиалга байхгүй"
      });
    }

    const order = orderCheck.rows[0];
    const total = Number(order.total_amount);
    const paid = Number(amount);

    // --------------------------
    // CASE 1: Underpaid → reject
    // --------------------------
    if (paid < total) {
      return res.status(400).json({
        success: false,
        message: `Төлбөр хүрэлцэхгүй байна. Нийт: ${total}, төлсөн: ${paid}`
      });
    }

    // --------------------------
    // CASE 2: Exact payment
    // --------------------------
    if (paid === total) {
      const payment = await PaymentModel.create({
        order_id,
        method_id,
        amount: total,
        provider_ref: provider_ref || "LOCAL-" + Date.now(),
        status: "paid"
      });

      return res.status(201).json({
        success: true,
        message: "Төлбөр амжилттай хийгдлээ",
        data: payment
      });
    }

    // --------------------------
    // CASE 3: Overpaid → Auto refund
    // --------------------------
    const overpay = paid - total;

    // Main payment (paid part)
    const mainPayment = await PaymentModel.create({
      order_id,
      method_id,
      amount: total,
      provider_ref: provider_ref || "LOCAL-" + Date.now(),
      status: "paid"
    });

    // Refund record
    const refundPayment = await PaymentModel.create({
      order_id,
      method_id,
      amount: overpay,
      provider_ref: "REFUND-" + Date.now(),
      status: "refunded"
    });

    return res.status(201).json({
      success: true,
      message: `Төлбөр амжилттай хийгдлээ. Илүү төлсөн ${overpay}₮ буцаан олголоо.`,
      data: {
        payment: mainPayment,
        refund: refundPayment
      }
    });

  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------
// 2) GET all payments for an order
// ------------------------------------------------------
exports.getOrderPayments = async (req, res, next) => {
  try {
    const payments = await PaymentModel.getByOrder(req.params.orderId);

    res.json({
      success: true,
      data: payments
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPayment: exports.createPayment,
  getOrderPayments: exports.getOrderPayments
};
