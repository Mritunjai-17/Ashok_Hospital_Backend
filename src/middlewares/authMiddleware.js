const authService = require('../services/auth.service');
const adminUserRepository = require('../repository/adminUser.repository');
const { ADMIN_ROLES, APPROVAL_STATUS } = require('../models/adminUser.model');
const ApiError = require('../utils/ApiError');

const AUTH_COOKIE_NAME = 'crm_token';

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  }
  return cookies;
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || null;
}

async function authenticateJWT(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next(new ApiError(401, 'Authentication required. Please sign in.'));
    }

    const decoded = authService.verifyToken(token);
    const user = await adminUserRepository.findById(decoded.sub);

    if (!user) {
      return next(new ApiError(401, 'User account no longer exists'));
    }

    if (user.approvalStatus !== APPROVAL_STATUS.APPROVED) {
      return next(new ApiError(403, 'Account does not have Super Admin approval'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Account is deactivated'));
    }

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Session expired. Please sign in again.'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid authentication token'));
    }
    return next(err);
  }
}

function requireSuperAdmin(req, _res, next) {
  if (!req.user || req.user.role !== ADMIN_ROLES.SUPER_ADMIN) {
    return next(new ApiError(403, 'Super Admin privileges required for this action'));
  }
  return next();
}

module.exports = {
  AUTH_COOKIE_NAME,
  authenticateJWT,
  requireSuperAdmin,
};
