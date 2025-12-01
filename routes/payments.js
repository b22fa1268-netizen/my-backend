const express = require("express");
const router = express.Router();
const authGuard = require("../middleware/authGuard");
const { requireRoles, ROLES } = require("../middleware/roleGuard");
const {
  createPayment,
  confirmPayment,
  getOrderPayments,
} = require("../controller/payments");

router.use(authGuard);

// Хэрэглэгч → төлбөр үүсгэх
router.post("/", createPayment);

// Захиалгын төлбөрүүдийг харах
router.get("/order/:orderId", getOrderPayments);

// Админ → төлбөр баталгаажуулах

module.exports = router;
