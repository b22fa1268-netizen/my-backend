const express = require("express");
const authGuard = require("../middleware/authGuard");
const { ROLES, requireRoles } = require("../middleware/roleGuard");
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminResetPassword
} = require("../controller/adminUsers");

const router = express.Router();

router.use(authGuard);
router.use(requireRoles(ROLES.ADMIN));

router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/users/:id/reset-password", adminResetPassword);
const { getOrderReport } = require("../controller/adminOrders");

router.get("/orders/report", getOrderReport);
const { getOrderProblems } = require("../controller/orderReports");

router.get("/orders/problems", getOrderProblems);

module.exports = router;