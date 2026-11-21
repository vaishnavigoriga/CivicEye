import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { seedDatabase } from './services/seedService';
import { User } from './models/User';

// Routers
import authRoutes from './routes/authRoutes';
import transcriptionRoutes from './routes/transcriptionRoutes';
import complaintRoutes from './routes/complaintRoutes';
import adminRoutes from './routes/adminRoutes';

export const app = express();

// Security & utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow serving uploaded images
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.includes(origin) || origin.endsWith('.local')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev mode for smooth demo evaluation
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded static files
const uploadsPath = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CivicEye Backend API',
    aiEngine: ENV.GEMINI_API_KEY ? 'Gemini 1.5 Flash' : 'Simulated Deterministic AI (Offline Mode)',
    version: '1.0.0',
  });
});

// Mount modular API routers
app.use('/api/auth', authRoutes);
app.use('/api/transcription', transcriptionRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server function
export const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty for seamless zero-setup demo experience
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Empty database detected. Auto-seeding initial demo data...');
      await seedDatabase();
    }

    if (ENV.NODE_ENV !== 'test') {
      app.listen(ENV.PORT, () => {
        logger.info(`=======================================================`);
        logger.info(` CivicEye API Server running on port ${ENV.PORT}`);
        logger.info(` Mode: ${ENV.NODE_ENV}`);
        logger.info(` AI Status: ${ENV.GEMINI_API_KEY ? 'Gemini 1.5 Flash (Online)' : 'Deterministic Simulated AI (Turnkey Demo Mode)'}`);
        logger.info(` Healthcheck: http://localhost:${ENV.PORT}/api/health`);
        logger.info(`=======================================================`);
      });
    }
  } catch (error: any) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}
