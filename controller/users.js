const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

async function register(req, res) {
  try {
    const { username, email, password, phone, role } = req.body;
    
    if (!username || !email || !password || !phone) {
      return res.status(400).json({ 
        success: false,
        message: "Бүх талбарыг бөглөнө үү" 
      });
    }

    const existingUserByPhone = await User.getUserByPhone(phone);
    if (existingUserByPhone) {
      return res.status(409).json({ 
        success: false,
        message: "Энэ утасны дугаараар бүртгэлтэй хэрэглэгч байна" 
      });
    }

    const existingUserByEmail = await User.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(409).json({ 
        success: false,
        message: "Энэ имэйл хаягаар бүртгэлтэй хэрэглэгч байна" 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.createUser({
      username,
      email,
      phone,
      password_hash: hashedPassword,
      role: role || 10,
    });

    res.status(201).json({
      success: true,
      message: "Амжилттай бүртгэгдлээ",
      data: user
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false,
      message: "Бүртгэл амжилтгүй боллоо" 
    });
  }
}

async function login(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Утасны дугаар болон нууц үгээ оруулна уу" 
      });
    }

    const user = await User.getUserByPhone(phone);
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Утасны дугаар эсвэл нууц үг буруу байна" 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Утасны дугаар эсвэл нууц үг буруу байна" 
      });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      message: "Амжилттай нэвтэрлээ",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Нэвтрэх үед алдаа гарлаа" 
    });
  }
}

async function profile(req, res) {
  try {
    const user = await User.getUserById(req.user.id);
    
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
    console.error("Profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Профайл татахад алдаа гарлаа" 
    });
  }
}

async function updateProfile(req, res) {
  try {
    const { username, email, phone } = req.body;
    
    const user = await User.updateUser(req.user.id, {
      username,
      email,
      phone
    });

    res.json({
      success: true,
      message: "Мэдээлэл амжилттай шинэчлэгдлээ",
      data: user
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ 
      success: false,
      message: "Мэдээлэл шинэчлэхэд алдаа гарлаа" 
    });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Хуучин болон шинэ нууц үгээ оруулна уу" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой" 
      });
    }

    const user = await User.getUserByIdWithPassword(req.user.id);
    
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Хуучин нууц үг буруу байна" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(req.user.id, hashedPassword);

    res.json({
      success: true,
      message: "Нууц үг амжилттай солигдлоо"
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Нууц үг солихдоо алдаа гарлаа" 
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { phone, email, newPassword } = req.body;

    if ((!phone && !email) || !newPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Утас эсвэл имэйл болон шинэ нууц үгээ оруулна уу" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой" 
      });
    }

    let user;
    if (phone) {
      user = await User.getUserByPhone(phone);
    } else {
      user = await User.getUserByEmail(email);
    }

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Хэрэглэгч олдсонгүй" 
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.id, hashedPassword);

    res.json({
      success: true,
      message: "Нууц үг амжилттай сэргээгдлээ"
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ 
      success: false,
      message: "Нууц үг сэргээхэд алдаа гарлаа" 
    });
  }
}

module.exports = { 
  register, 
  login, 
  profile, 
  updateProfile,
  changePassword,
  resetPassword
};