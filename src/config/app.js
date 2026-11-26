const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const createV1Router = require('../routes');
const notificationService = require('../services/notification.service');
const { notFoundHandler, errorHandler } = require('../middlewares/errorHandler');

/**
 * Builds an Express application for either the unified backend ("all")
 * or an individual standalone microservice ("enquiries" | "availability" | "notifications").
 */
function createApp({ serviceMode = 'all', enableEventListeners = true } = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(process.cwd(), 'public')));

  if (enableEventListeners && (serviceMode === 'all' || serviceMode === 'notifications')) {
    notificationService.initListeners();
  }

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      service: `hospital-backend (${serviceMode})`,
      health: '/api/v1/health',
    });
  });

  app.use('/api/v1', createV1Router(serviceMode));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
