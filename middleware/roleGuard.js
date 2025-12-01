// Role definitions
const ROLES = {
  ADMIN: 1,
  USER: 10
};

// Role names for display
const ROLE_NAMES = {
  1: "Админ",
  10: "Хэрэглэгч"
};

// Permission definitions
const PERMISSIONS = {
  // User permissions
  VIEW_OWN_PROFILE: [ROLES.ADMIN, ROLES.USER],
  UPDATE_OWN_PROFILE: [ROLES.ADMIN, ROLES.USER],
  VIEW_OWN_ORDERS: [ROLES.ADMIN, ROLES.USER],
  CREATE_ORDER: [ROLES.ADMIN, ROLES.USER],
  MANAGE_OWN_CART: [ROLES.ADMIN, ROLES.USER],
  
  // Admin permissions
  VIEW_ALL_USERS: [ROLES.ADMIN],
  MANAGE_USERS: [ROLES.ADMIN],
  MANAGE_PRODUCTS: [ROLES.ADMIN],
  MANAGE_CATEGORIES: [ROLES.ADMIN],
  MANAGE_INVENTORY: [ROLES.ADMIN],
  VIEW_ALL_ORDERS: [ROLES.ADMIN],
  MANAGE_ORDERS: [ROLES.ADMIN],
};

// Check if user has specific permission
function hasPermission(userRole, permission) {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles && allowedRoles.includes(userRole);
}

function requirePermission(permission) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Нэвтрэх шаардлагатай" 
      });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        success: false,
        message: "Та энэ үйлдлийг хийх эрхгүй байна" 
      });
    }

    next();
  };
}

function requireRoles(...allowed) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Нэвтрэх шаардлагатай" 
      });
    }

    const userRole = req.user.role;
    const hasRole = allowed.some((r) => r == userRole);
    
    if (!hasRole) {
      return res.status(403).json({ 
        success: false,
        message: "Эрх хүрэлцэхгүй байна" 
      });
    }

    next();
  };
}

module.exports = { 
  ROLES, 
  ROLE_NAMES,
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireRoles 
};