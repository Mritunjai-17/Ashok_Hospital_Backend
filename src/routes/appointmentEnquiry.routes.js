const express = require('express');
const controller = require('../controllers/appointmentEnquiry.controller');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const {
  validateObjectId,
  validateCreateEnquiry,
  validateUpdateEnquiry,
  validateStatusUpdate,
} = require('../middlewares/validateRequest');

const router = express.Router();

// Public patient-facing endpoints for the external frontend form
router.get('/options', controller.getFormOptions);
router.post('/', validateCreateEnquiry, controller.createEnquiry);

// Protected CRM staff & Super Admin endpoints
router.get('/', authenticateJWT, controller.getAllEnquiries);
router.get('/reference/:referenceId', authenticateJWT, controller.getEnquiryByReference);
router.get('/:id', authenticateJWT, validateObjectId('id'), controller.getEnquiryById);
router.put(
  '/:id',
  authenticateJWT,
  validateObjectId('id'),
  validateUpdateEnquiry,
  controller.updateEnquiry
);
router.patch(
  '/:id',
  authenticateJWT,
  validateObjectId('id'),
  validateUpdateEnquiry,
  controller.updateEnquiry
);
router.patch(
  '/:id/status',
  authenticateJWT,
  validateObjectId('id'),
  validateStatusUpdate,
  controller.updateEnquiryStatus
);
router.delete('/:id', authenticateJWT, validateObjectId('id'), controller.deleteEnquiry);

module.exports = router;
