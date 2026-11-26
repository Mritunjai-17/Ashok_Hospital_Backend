require('dotenv').config();

const { connectDB } = require('../src/config/db');
const { createApp } = require('../src/config/app');

const app = createApp({ serviceMode: 'all', enableEventListeners: true });

module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
