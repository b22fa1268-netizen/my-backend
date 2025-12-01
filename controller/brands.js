const Brand = require("../models/Brand");

// Бүх брэндүүдийг авах
exports.getBrands = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const brands = await Brand.getAllBrands({ page, limit });
    
    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (err) {
    next(err);
  }
};

// Нэг брэнд авах
exports.getBrand = async (req, res, next) => {
  try {
    const brand = await Brand.getBrandById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: `Брэнд ${req.params.id} олдсонгүй`,
      });
    }

    // Брэндийн бүтээгдэхүүний тоо нэмж өгөх
    const productCount = await Brand.getBrandProductCount(req.params.id);
    brand.product_count = productCount;
    
    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// Шинэ брэнд үүсгэх (Админ)
exports.createBrand = async (req, res, next) => {
  try {
    // Request body шалгах
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body хоосон байна",
      });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Брэндийн нэр заавал шаардлагатай",
      });
    }

    const brand = await Brand.createBrand(req.body);

    res.status(201).json({
      success: true,
      message: "Брэнд амжилттай үүсгэлээ",
      data: brand,
    });
  } catch (err) {
    next(err);
  }
};

// Брэнд шинэчлэх (Админ)
exports.updateBrand = async (req, res, next) => {
  try {
    const updated = await Brand.updateBrand(req.params.id, req.body);
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: `Брэнд ${req.params.id} олдсонгүй`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Брэнд амжилттай шинэчлэгдлээ",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const deleted = await Brand.deleteBrand(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Брэнд ${req.params.id} олдсонгүй`,
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Брэнд амжилттай устгагдлаа",
    });
  } catch (err) {
    next(err);
  }
};