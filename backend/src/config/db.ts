import mongoose from 'mongoose';
import { ENV } from './env';
import { logger } from '../utils/logger';

let memoryServer: { getUri: () => string; stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB. A real MONGO_URI is required unless USE_MEMORY_DB=true is set explicitly.
 * There is no silent fallback: a wrong URI fails loudly instead of quietly losing data on restart.
 */
export const connectDB = async (): Promise<typeof mongoose> => {
  if (ENV.USE_MEMORY_DB) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    logger.warn('USING IN-MEMORY MONGODB. All data is lost when the server stops.');
    return mongoose.connect(memoryServer.getUri());
  }

  if (!ENV.MONGO_URI.trim()) {
    throw new Error('MONGO_URI is not set. Set it, or set USE_MEMORY_DB=true for a throw-away development database.');
  }

  const safeUri = ENV.MONGO_URI.replace(/\/\/[^@/]*@/, '//***@');
  logger.info(`Connecting to MongoDB at ${safeUri}`);
  const conn = await mongoose.connect(ENV.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  logger.info(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};
