const Category = require("../models/Category");

// Бүх ангиллуудыг авах
exports.getCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const categories = await Category.getAllCategories({ page, limit });
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

// Нэг ангилал авах
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.getCategoryById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Ангилал ${req.params.id} олдсонгүй`,
      });
    }
    
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Шинэ ангилал үүсгэх
exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.createCategory(req.body);

    res.status(201).json({
      success: true,
      message: "Ангилал амжилттай үүсгэлээ",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Ангилал шинэчлэх
exports.updateCategory = async (req, res, next) => {
  try {
    const updated = await Category.updateCategory(req.params.id, req.body);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Ангилал ${req.params.id} олдсонгүй`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Ангилал амжилттай шинэчлэгдлээ",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Ангилал устгах
exports.deleteCategory = async (req, res, next) => {
  try {
    const deleted = await Category.deleteCategory(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Ангилал ${req.params.id} олдсонгүй`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Ангилал амжилттай устгагдлаа",
    });
  } catch (err) {
    next(err);
  }
};