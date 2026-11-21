import mongoose from 'mongoose';
import { ENV } from './env';
import { logger } from '../utils/logger';

let mongoMemoryServerInstance: any = null;

export const connectDB = async (): Promise<typeof mongoose> => {
  // If MONGO_URI is set, attempt to connect to it
  if (ENV.MONGO_URI && ENV.MONGO_URI.trim().length > 0) {
    try {
      logger.info(`Attempting connection to MongoDB at: ${ENV.MONGO_URI}`);
      const conn = await mongoose.connect(ENV.MONGO_URI, {
        serverSelectionTimeoutMS: 3000,
      });
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (err: any) {
      logger.warn(`Could not connect to external MongoDB: ${err.message}. Initializing in-memory Mongo engine for zero-setup demo...`);
    }
  }

  // Fallback: MongoMemoryServer for instant hackathon evaluation without external DB dependency
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const uri = mongoMemoryServerInstance.getUri();
    logger.info(`Zero-Config In-Memory MongoDB running at: ${uri}`);
    const conn = await mongoose.connect(uri);
    logger.info('Connected successfully to In-Memory MongoDB (Supports GeoJSON 2dsphere indexing and aggregations).');
    return conn;
  } catch (error: any) {
    logger.error(`Critical MongoDB connection error: ${error.message}`);
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (mongoMemoryServerInstance) {
    await mongoMemoryServerInstance.stop();
  }
};
