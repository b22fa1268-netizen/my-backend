const express = require("express");
const router = express.Router();
const authGuard = require("../middleware/authGuard");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} = require("../controller/cart");

router.use(authGuard);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);

module.exports = router;
