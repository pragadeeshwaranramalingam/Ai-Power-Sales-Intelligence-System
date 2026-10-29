const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sales_intelligence';

  try {
    // Attempt connecting to the configured MongoDB URI
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] Connected successfully to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${uri}: ${error.message}`);

    // If memory DB fallback is allowed (development or testing mode), spin up MongoMemoryServer
    if (process.env.ENABLE_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test') {
      try {
        console.log('[Database] Initializing fallback in-memory MongoDB instance for local demonstration...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memoryUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memoryUri);
        console.log(`[Database] In-memory MongoDB running successfully at ${memoryUri}`);
        return conn;
      } catch (memError) {
        console.error(`[Database] Failed to initialize in-memory MongoDB: ${memError.message}`);
        throw memError;
      }
    } else {
      console.error('[Database] MongoDB connection failed. Please ensure MongoDB is running or set ENABLE_MEMORY_DB=true.');
      throw error;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    console.log('[Database] Disconnected from MongoDB');
  } catch (err) {
    console.error(`[Database] Disconnect error: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
