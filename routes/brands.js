const express = require("express");
const router = express.Router();
const authGuard = require("../middleware/authGuard");
const { requireRoles, ROLES } = require("../middleware/roleGuard");
const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controller/brands");

// Нийтэд нээлттэй routes (брэнд харах)
router.get("/", getBrands);
router.get("/:id", getBrand);

// Админ эрх шаардлагатай routes
router.post("/", authGuard, requireRoles(ROLES.ADMIN), createBrand);
router.put("/:id", authGuard, requireRoles(ROLES.ADMIN), updateBrand);
router.delete("/:id", authGuard, requireRoles(ROLES.ADMIN), deleteBrand);

module.exports = router;