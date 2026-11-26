const express = require('express');
const controller = require('../controllers/notification.controller');
const { authenticateJWT } = require('../middlewares/authMiddleware');
const { validateObjectId } = require('../middlewares/validateRequest');

const router = express.Router();

// Internal microservice event webhook (optional inter-service communication)
router.post('/events', controller.receiveEvent);

// Protected CRM notification endpoints
router.get('/', authenticateJWT, controller.listNotifications);
router.get(
  '/enquiry/:enquiryId',
  authenticateJWT,
  validateObjectId('enquiryId'),
  controller.getNotificationsByEnquiryId
);
router.post(
  '/enquiry/:enquiryId/resend',
  authenticateJWT,
  validateObjectId('enquiryId'),
  controller.resendNotification
);

module.exports = router;
