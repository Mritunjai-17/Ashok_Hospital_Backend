const express = require('express');
const controller = require('../controllers/auth.controller');
const { authenticateJWT, requireSuperAdmin } = require('../middlewares/authMiddleware');
const {
  validateObjectId,
  validateRegister,
  validateLogin,
} = require('../middlewares/validateRequest');

const router = express.Router();

// Public auth endpoints
router.get('/setup-status', controller.getSetupStatus);
router.post('/register', validateRegister, controller.register);
router.post('/login', validateLogin, controller.login);
router.post('/logout', controller.logout);

// Authenticated session endpoint
router.get('/me', authenticateJWT, controller.getMe);

// Super Admin approval & user monitoring endpoints
router.get('/users', authenticateJWT, requireSuperAdmin, controller.listUsers);
router.patch(
  '/users/:id/approve',
  authenticateJWT,
  requireSuperAdmin,
  validateObjectId('id'),
  controller.approveUser
);
router.patch(
  '/users/:id/reject',
  authenticateJWT,
  requireSuperAdmin,
  validateObjectId('id'),
  controller.rejectUser
);
router.delete(
  '/users/:id',
  authenticateJWT,
  requireSuperAdmin,
  validateObjectId('id'),
  controller.deleteUser
);

module.exports = router;
