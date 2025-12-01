const User = require("../models/User");
const bcrypt = require("bcryptjs");

async function getAllUsers(req, res) {
  try {
    const users = await User.getAllUsers();
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ 
      success: false,
      message: "Хэрэглэгчдийг татахад алдаа гарлаа" 
    });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Хэрэглэгч олдсонгүй" 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error("Get user by ID error:", err);
    res.status(500).json({ 
      success: false,
      message: "Хэрэглэгч татахад алдаа гарлаа" 
    });
  }
}

async function updateUser(req, res) {
  try {
    const { username, email, phone, role } = req.body;
    
    const user = await User.updateUser(req.params.id, {
      username,
      email,
      phone,
      role
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Хэрэглэгч олдсонгүй" 
      });
    }

    res.json({
      success: true,
      message: "Хэрэглэгчийн мэдээлэл амжилттай шинэчлэгдлээ",
      data: user
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ 
      success: false,
      message: "Хэрэглэгч шинэчлэхэд алдаа гарлаа" 
    });
  }
}

async function deleteUser(req, res) {
  try {
    if (req.user.id == req.params.id) {
      return res.status(400).json({ 
        success: false,
        message: "Өөрийгөө устгаж болохгүй" 
      });
    }

    const user = await User.deleteUser(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Хэрэглэгч олдсонгүй" 
      });
    }

    res.json({
      success: true,
      message: "Хэрэглэгч амжилттай устгагдлаа"
    });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ 
      success: false,
      message: "Хэрэглэгч устгахад алдаа гарлаа" 
    });
  }
}

async function adminResetPassword(req, res) {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.updatePassword(req.params.id, hashedPassword);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Хэрэглэгч олдсонгүй" 
      });
    }

    res.json({
      success: true,
      message: "Нууц үг амжилттай сэргээгдлээ"
    });
  } catch (err) {
    console.error("Admin reset password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Нууц үг сэргээхэд алдаа гарлаа" 
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  adminResetPassword
};