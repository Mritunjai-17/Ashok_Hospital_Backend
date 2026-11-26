const mongoose = require('mongoose');

let cachedConnection = null;
let connectionPromise = null;
let listenersRegistered = false;

function registerConnectionListeners() {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    cachedConnection = null;
    console.warn('MongoDB disconnected');
  });
}

/**
 * Connects to MongoDB Atlas using MONGODB_URI (and optional DB_NAME).
 * Reuses an existing connection across calls (safe for serverless environments).
 *
 * @returns {Promise<import('mongoose').Connection>}
 */
async function connectDB() {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  registerConnectionListeners();

  if (!connectionPromise) {
    const options = {
      serverSelectionTimeoutMS: 10000,
    };

    if (process.env.DB_NAME) {
      options.dbName = process.env.DB_NAME;
    }

    connectionPromise = mongoose
      .connect(uri, options)
      .then((mongooseInstance) => {
        cachedConnection = mongooseInstance.connection;
        return cachedConnection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

/**
 * Gracefully closes the active MongoDB connection.
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    cachedConnection = null;
    connectionPromise = null;
  }
}

module.exports = {
  connectDB,
  disconnectDB,
};
