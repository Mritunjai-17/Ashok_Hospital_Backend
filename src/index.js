require('dotenv').config();

const { connectDB, disconnectDB } = require('./config/db');
const { createApp } = require('./config/app');

const PORT = Number(process.env.PORT) || 5000;
const app = createApp({ serviceMode: 'all', enableEventListeners: true });

let server = null;

async function start() {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      console.log(`Hospital backend unified API running on http://localhost:${PORT}`);
    });
    return server;
  } catch (err) {
    console.error('Failed to start server:', err.message);
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

if (require.main === module) {
  start();
}

module.exports = { app, start };
