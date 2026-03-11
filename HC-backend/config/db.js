const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic and event listeners.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 8 uses the new URL parser and unified topology by default
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting reconnection...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully.');
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    // Retry after 5 seconds
    console.log('🔄 Retrying connection in 5 seconds...');
    await new Promise((resolve) => setTimeout(resolve, 5000));
    return connectDB();
  }
};

module.exports = connectDB;
