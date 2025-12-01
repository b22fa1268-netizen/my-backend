const express = require("express");
const { 
  register, 
  login, 
  profile, 
  updateProfile,
  changePassword,
  resetPassword
} = require("../controller/users");
const authGuard = require("../middleware/authGuard");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", resetPassword);

router.get("/profile", authGuard, profile);
router.put("/profile", authGuard, updateProfile);
router.post("/change-password", authGuard, changePassword);

module.exports = router;