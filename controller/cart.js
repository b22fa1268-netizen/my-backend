// controller/cart.js
const CartModel = require("../models/Cart");

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.id; // ✅ extracted from JWT token by authGuard
    const items = await CartModel.getCartItems(userId);

    res.json({ success: true,
      user_id: userId,          // ✅ include user id
      total_items: items.length,
      data: items
    });
  } catch (err) {
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;
    const userId = req.user.id; // ✅ from token

    const item = await CartModel.addItem(userId, product_id, quantity || 1);
    res.status(201).json({
      success: true,
      message: "Сагсанд нэмэгдлээ",
      data: item,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const item = await CartModel.updateItem(req.user.id, req.params.itemId, quantity);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.removeCartItem = async (req, res, next) => {
  try {
    const item = await CartModel.removeItem(req.user.id, req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    res.json({ success: true, message: "Removed" });
  } catch (err) {
    next(err);
  }
};
