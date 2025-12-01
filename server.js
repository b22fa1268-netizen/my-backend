const express = require("express");
const bodyParser = require('body-parser');
const { connectDB } = require("./db");

const PORT = 4000;
const ordersRoutes = require("./routes/orders");
const logger = require("./middleware/logger");
const errorHandler = require("./middleware/error");
const authRoutes = require("./routes/auth"); 
const adminRoutes = require("./routes/admin");
const appRoutes = require("./routes/app"); 
const categoriesRoutes = require("./routes/categories");
const productRoutes = require("./routes/products");
const brandsRoutes = require("./routes/brands");
const app = express();
const cartRoutes = require("./routes/cart");
const paymentRoutes = require("./routes/payments");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/api/cart", cartRoutes);
// Middleware
app.use(logger);

// Routes
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/app", appRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/brands", brandsRoutes);
// Error handling middleware
app.use(errorHandler);

// Start the server after DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  });
