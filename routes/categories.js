const express = require("express");
const authGuard = require("../middleware/authGuard");
const { requireRoles, ROLES } = require("../middleware/roleGuard");
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/categories");

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategory);

router.post("/", authGuard, requireRoles(ROLES.ADMIN), createCategory);
router.put("/:id", authGuard, requireRoles(ROLES.ADMIN), updateCategory);
router.delete("/:id", authGuard, requireRoles(ROLES.ADMIN), deleteCategory);

module.exports = router;