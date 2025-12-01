const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const ProductController = require('../controller/products');

const productModel = new Product();
const productController = new ProductController(productModel);

// Бүх бүтээгдэхүүн (attributes-г харуулахгүй)
router.get('/', productController.getProducts.bind(productController));

// Нэг бүтээгдэхүүн detail (attributes-тэй)
router.get('/detail/:id', productController.getProductDetail.bind(productController));

// Шинэ бүтээгдэхүүн үүсгэх
router.post('/', productController.createProduct.bind(productController));

// Бүтээгдэхүүн шинэчлэх
router.put('/:id', productController.updateProduct.bind(productController));

// Бүтээгдэхүүн устгах
router.delete('/:id', productController.deleteProduct.bind(productController));

module.exports = router;  