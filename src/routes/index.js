const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./auth.routes');
const appointmentEnquiryRoutes = require('./appointmentEnquiry.routes');
const availabilityRoutes = require('./availability.routes');
const notificationRoutes = require('./notification.routes');
const ApiResponse = require('../utils/ApiResponse');

function createV1Router(serviceMode = 'all') {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(200).json(
      new ApiResponse(200, {
        service: serviceMode,
        status: 'ok',
        database: dbReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      })
    );
  });

  if (serviceMode === 'all') {
    router.use('/auth', authRoutes);
  }
  if (serviceMode === 'all' || serviceMode === 'enquiries') {
    router.use('/enquiries', appointmentEnquiryRoutes);
  }
  if (serviceMode === 'all' || serviceMode === 'availability') {
    router.use('/availability', availabilityRoutes);
  }
  if (serviceMode === 'all' || serviceMode === 'notifications') {
    router.use('/notifications', notificationRoutes);
  }

  return router;
}

module.exports = createV1Router;
