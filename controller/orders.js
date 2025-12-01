// controller/orders.js
const OrderModel = require("../models/Order");
const CartModel = require("../models/Cart");
const { pool } = require("../db");
const { ROLES } = require("../middleware/roleGuard");

class OrdersController {
  // --- Админ бүх захиалгыг харах (pagination, filter) ---
  async getOrders(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;
      const { user_id, status } = req.query;

      const orders = await OrderModel.getAll({
        page,
        limit,
        user_id,
        status,
      });

      res.status(200).json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Нэг захиалга дэлгэрэнгүй (items, payments, shipments) ---
  async getOrder(req, res, next) {
    try {
      const order = await OrderModel.getById(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Зөвхөн админ эсвэл тухайн захиалгын эзэн үзэх эрхтэй
      if (req.user.role !== ROLES.ADMIN && order.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Энэ захиалгыг харах эрхгүй байна",
        });
      }

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Админ гар аргаар захиалга үүсгэх ---
  async createOrder(req, res, next) {
    try {
      const order = await OrderModel.create(req.body);
      res.status(201).json({
        success: true,
        message: "Order created",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Хэрэглэгчийн сагсаас checkout хийх (ORDER + ORDER_ITEMS автоматаар) ---
  async checkoutFromCart(req, res, next) {
    const client = await pool.connect();

    try {
      const userId = req.user.id;
      const {
        shipping_method_id,
        shipping_address_id,
        billing_address_id,
        tax_amount = 0,
        discount_amount = 0,
      } = req.body;

      // 1) Сагсыг унших
      const cartItems = await CartModel.getCartItems(userId);
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Таны сагс хоосон байна",
        });
      }

      // 2) Хүргэлтийн арга заавал байх ёстой
      if (!shipping_method_id) {
        return res.status(400).json({
          success: false,
          message: "shipping_method_id шаардлагатай",
        });
      }

      // 3) shipping_methods-оос flat_price авах
      const shipMethodRes = await client.query(
        `SELECT flat_price FROM shipping_methods WHERE id = $1`,
        [shipping_method_id]
      );
      if (shipMethodRes.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Ийм хүргэлтийн төрөл байхгүй",
        });
      }
      const shipping_amount = Number(shipMethodRes.rows[0].flat_price) || 0;

      // 4) Subtotal тооцоолох
      let subtotal_amount = 0;
      for (const item of cartItems) {
        subtotal_amount += Number(item.price) * Number(item.quantity);
      }

      const total_amount =
        subtotal_amount +
        shipping_amount +
        Number(tax_amount) -
        Number(discount_amount);

      await client.query("BEGIN");

      // 5) orders хүснэгтэд захиалга үүсгэх
      const orderRes = await client.query(
        `
        INSERT INTO orders (
          user_id,
          order_number,
          status,
          order_date,
          shipping_address_id,
          billing_address_id,
          subtotal_amount,
          shipping_amount,
          tax_amount,
          discount_amount,
          total_amount
        )
        VALUES (
          $1,
          $2,
          $3,
          NOW(),
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10
        )
        RETURNING *
        `,
        [
          userId,
          "ORD-" + Date.now(), // энгийн order дугаар
          "pending", // анхны статус
          shipping_address_id || null,
          billing_address_id || null,
          subtotal_amount,
          shipping_amount,
          tax_amount,
          discount_amount,
          total_amount,
        ]
      );

      const order = orderRes.rows[0];

      // 6) Сагсны бараа бүрийг order_items-д хуулж бичих
      for (const item of cartItems) {
        await client.query(
          `
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            sku,
            unit_price,
            quantity
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            order.id,
            item.product_id,
            item.product_name, // CartModel.getCartItems → p.name AS product_name
            item.sku,
            item.price,
            item.quantity,
          ]
        );
      }

      await client.query("COMMIT");

      // 7) Сагсыг хоосoloh
      await CartModel.clearCart(userId);

      // 8) Бүтэн захиалга (items/payments/shipments-тай) дахин уншиж буцаах
      const fullOrder = await OrderModel.getById(order.id);

      res.status(201).json({
        success: true,
        message: "Захиалга амжилттай үүслээ",
        data: fullOrder,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }

  // --- Админ: захиалгыг илгээсэн (shipment үүсгэх) ---
  async shipOrder(req, res, next) {
    const client = await pool.connect();

    try {
      const orderId = req.params.id;
      const { shipping_method_id, tracking_no } = req.body;

      if (!shipping_method_id) {
        return res.status(400).json({
          success: false,
          message: "shipping_method_id шаардлагатай",
        });
      }

      // Order байгаа эсэх
      const orderRes = await client.query(
        `SELECT id, status FROM orders WHERE id = $1`,
        [orderId]
      );
      if (orderRes.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // Хүргэлтийн төрөл байгаа эсэх
      const methodRes = await client.query(
        `SELECT id FROM shipping_methods WHERE id = $1`,
        [shipping_method_id]
      );
      if (methodRes.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Ийм хүргэлтийн төрөл байхгүй",
        });
      }

      await client.query("BEGIN");

      // 1) shipments хүснэгтэд мөр үүсгэх
      const shipRes = await client.query(
        `
        INSERT INTO shipments (
          order_id,
          method_id,
          tracking_no,
          shipped_at
        )
        VALUES ($1, $2, $3, NOW())
        RETURNING *
        `,
        [orderId, shipping_method_id, tracking_no || null]
      );

      // 2) orders.status = 'shipped'
      await client.query(
        `UPDATE orders SET status = 'shipped' WHERE id = $1`,
        [orderId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Захиалга илгээгдлээ",
        data: shipRes.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }

  // --- Админ: хүргэлт хүрсэн тэмдэглэх ---
  async markDelivered(req, res, next) {
    const client = await pool.connect();

    try {
      const orderId = req.params.id;

      // Order байгаа эсэх
      const orderRes = await client.query(
        `SELECT id FROM orders WHERE id = $1`,
        [orderId]
      );
      if (orderRes.rowCount === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      await client.query("BEGIN");

      // 1) shipments.delivered_at = NOW()
      const shipRes = await client.query(
        `
        UPDATE shipments
        SET delivered_at = NOW()
        WHERE order_id = $1
        RETURNING *
        `,
        [orderId]
      );

      if (shipRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Энэ захиалгад shipment олдсонгүй",
        });
      }

      // 2) orders.status = 'delivered'
      await client.query(
        `UPDATE orders SET status = 'delivered' WHERE id = $1`,
        [orderId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        message: "Захиалга хүргэгдсэн гэж тэмдэглэгдлээ",
        data: shipRes.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  }

  // --- Захиалга шинэчлэх (админ) ---
  async updateOrder(req, res, next) {
    try {
      const order = await OrderModel.update(req.params.id, req.body);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      res.status(200).json({
        success: true,
        message: "Order updated",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Захиалга устгах (админ) ---
  async deleteOrder(req, res, next) {
    try {
      const order = await OrderModel.delete(req.params.id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      res.status(200).json({
        success: true,
        message: "Order deleted",
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Захиалга цуцлах (user өөрийнхөө, админ бүгдийг) ---
  async cancelOrder(req, res, next) {
    try {
      const id = req.params.id;

      const order = await OrderModel.getById(id);
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      // User can cancel ONLY their own order, admin can cancel any
      if (req.user.role !== ROLES.ADMIN && order.user_id !== req.user.id) {
        return res
          .status(403)
          .json({ success: false, message: "Not allowed" });
      }

      // Cannot cancel if already shipped/delivered
      if (order.status === "shipped" || order.status === "delivered") {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel after shipment",
        });
      }

      // Cannot cancel paid orders (require refund flow instead)
      if (order.status === "paid") {
        return res.status(400).json({
          success: false,
          message:
            "Төлбөр төлөгдсөн захиалгыг цуцлах боломжгүй. Буцаалтын хүсэлт илгээнэ үү.",
        });
      }

      // If already cancelled
      if (order.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Энэ захиалга аль хэдийн цуцлагдсан байна",
        });
      }

      const updated = await OrderModel.update(id, { status: "cancelled" });

      return res.json({
        success: true,
        message: "Захиалга амжилттай цуцлагдлаа",
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrdersController();
