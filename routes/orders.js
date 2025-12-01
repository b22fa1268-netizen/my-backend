// routes/orders.js
const express = require("express");
const router = express.Router();
const authGuard = require("../middleware/authGuard");
const { requireRoles, ROLES } = require("../middleware/roleGuard");
const ordersController = require("../controller/orders");

// админ бүх захиалгыг харна
router.get(
  "/",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.getOrders.bind(ordersController)
);

// user checkout from own cart
router.post(
  "/checkout",
  authGuard,
  ordersController.checkoutFromCart.bind(ordersController)
);

// захиалгыг дэлгэрэнгүй (хэрэглэгч өөрийнхөө, админ бүгдийг)
router.get(
  "/:id",
  authGuard,
  ordersController.getOrder.bind(ordersController)
);

// админ: захиалгыг илгээсэн гэж тэмдэглэх (shipment үүсгэнэ)
router.post(
  "/:id/ship",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.shipOrder.bind(ordersController)
);

// админ: захиалга хүргэгдсэн гэж тэмдэглэх
router.post(
  "/:id/deliver",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.markDelivered.bind(ordersController)
);

// админ гар аргаар үүсгэх
router.post(
  "/",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.createOrder.bind(ordersController)
);

// захиалгын статус, хаяг шинэчлэх
router.put(
  "/:id",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.updateOrder.bind(ordersController)
);

// устгах
router.delete(
  "/:id",
  authGuard,
  requireRoles(ROLES.ADMIN),
  ordersController.deleteOrder.bind(ordersController)
);
router.put("/:id/cancel", authGuard, ordersController.cancelOrder);

module.exports = router;
