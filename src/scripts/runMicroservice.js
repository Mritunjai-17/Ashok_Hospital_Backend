require('dotenv').config();

const { connectDB, disconnectDB } = require('../config/db');
const { createApp } = require('../config/app');

const SERVICE_PORTS = {
  enquiries: Number(process.env.ENQUIRIES_PORT) || 5001,
  availability: Number(process.env.AVAILABILITY_PORT) || 5002,
  notifications: Number(process.env.NOTIFICATIONS_PORT) || 5003,
};

const serviceName = process.argv[2];

if (!serviceName || !SERVICE_PORTS[serviceName]) {
  console.error(
    `Usage: node src/scripts/runMicroservice.js <${Object.keys(SERVICE_PORTS).join('|')}>`
  );
  process.exit(1);
}

const port = SERVICE_PORTS[serviceName];
const app = createApp({
  serviceMode: serviceName,
  enableEventListeners: serviceName === 'notifications',
});

let server = null;

async function startMicroservice() {
  try {
    await connectDB();
    server = app.listen(port, () => {
      console.log(`[${serviceName}-service] listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error(`[${serviceName}-service] startup error:`, err.message);
    process.exit(1);
  }
}

async function shutdown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startMicroservice();
