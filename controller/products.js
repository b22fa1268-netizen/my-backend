// controller/products.js

class ProductController {
  constructor(model) {
    this.model = model;
  }

  // --- Бүх бүтээгдэхүүн (attributes-г харуулахгүй) ---
  async getProducts(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 0;
      const limit = parseInt(req.query.limit) || 10;

      // model-доо already getAllProducts байгаа
      const products = await this.model.getAllProducts({ page, limit });

      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Нэг бүтээгдэхүүн (attributes-тэй) ---
  async getProductDetail(req, res, next) {
    try {
      const id = req.params.id;

      // 1. үндсэн бүтээгдэхүүн
      const product = await this.model.getProductById(id);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      // 2. attribute-ууд
      const attributes = await this.model.getAttributesByProductId(id);

      // 3. нийлүүлээд буцаах
      res.status(200).json({
        success: true,
        data: {
          ...product,
          attributes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Шинэ бүтээгдэхүүн үүсгэх ---
  async createProduct(req, res, next) {
    try {
      const product = await this.model.createProduct(req.body);
      res.status(201).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  // --- Бүтээгдэхүүн шинэчлэх ---
  async updateProduct(req, res, next) {
    try {
      const product = await this.model.updateProduct(
        req.params.id,
        req.body
      );
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }

  // --- Бүтээгдэхүүн устгах ---
  async deleteProduct(req, res, next) {
    try {
      const product = await this.model.deleteProduct(req.params.id);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, error: "Product not found" });
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = ProductController;
