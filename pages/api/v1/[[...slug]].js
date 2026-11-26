const { connectDB } = require('../../../src/config/db');
const { createApp } = require('../../../src/config/app');

if (!globalThis.__hospitalBackendExpressApp) {
  globalThis.__hospitalBackendExpressApp = createApp({
    serviceMode: 'all',
    enableEventListeners: true,
  });
}

const app = globalThis.__hospitalBackendExpressApp;

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: err.message || 'Database connection failed',
    });
  }
}
