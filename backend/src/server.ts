import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { ENV } from './config/env';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { generalLimiter } from './middleware/rateLimit';
import { AIService } from './services/aiService';
import { bootstrapAdmin, ensureDepartments, seedDemoData } from './services/seedService';
import { UPLOAD_ROOT } from './services/storageService';

import authRoutes from './routes/authRoutes';
import transcriptionRoutes from './routes/transcriptionRoutes';
import complaintRoutes from './routes/complaintRoutes';
import adminRoutes from './routes/adminRoutes';
import mediaRoutes from './routes/mediaRoutes';
import { dataSources } from './controllers/complaintController';

export const app = express();

if (ENV.TRUST_PROXY) app.set('trust proxy', 1);
app.disable('x-powered-by');

// The site (frontend + API) is served from one origin. The CSP allows exactly what the app loads:
// map tiles (OpenStreetMap), Google Fonts, and blob: URLs for photo previews and audio playback.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'data:', 'blob:', 'https://*.tile.openstreetmap.org'],
        'media-src': ["'self'", 'blob:'],
        'connect-src': ["'self'"],
        // Only force https in production; it would break plain-http local runs.
        'upgrade-insecure-requests': ENV.NODE_ENV === 'production' ? [] : null,
      },
    },
  }),
);

// Strict CORS: only configured frontend origins (FRONTEND_URL, comma-separated) may make credentialed requests.
// In development only, any localhost / 127.0.0.1 port is also accepted, because Vite moves to the next free
// port (5174, 5175, ...) when 5173 is busy. This is never enabled in production.
const allowedOrigins = new Set(ENV.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean));
const isLocalDevOrigin = (o: string) => ENV.NODE_ENV === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin) || isLocalDevOrigin(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }),
);

app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
if (ENV.NODE_ENV === 'development') app.use(morgan('dev'));

// Only images and resolution evidence are public. Voice recordings live in a private folder.
const staticOpts = { index: false, dotfiles: 'deny' as const };
app.use('/uploads/images', express.static(path.join(UPLOAD_ROOT, 'images'), staticOpts));
app.use('/uploads/evidence', express.static(path.join(UPLOAD_ROOT, 'evidence'), staticOpts));

const health = (_req: Request, res: Response) => {
  res.json({
    status: mongoose.connection.readyState === 1 ? 'healthy' : 'degraded',
    service: 'CivicEye API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    // Configuration only. Whether a given analysis was live is recorded on each report (ai.status / ai.isSimulated).
    ai: {
      geminiKeyConfigured: AIService.isConfigured(),
      analysisMode: AIService.isConfigured() ? 'gemini' : 'simulated-keyword-rules',
      models: AIService.isConfigured() ? { analysis: ENV.GEMINI_MODEL, transcription: ENV.GEMINI_TRANSCRIBE_MODEL, speech: ENV.GEMINI_TTS_MODEL } : undefined,
      simulatedFallbackOnFailure: ENV.AI_DEMO_FALLBACK,
    },
  });
};
app.get('/api/health', health);

const api = express.Router();
api.get('/health', health);
api.use('/auth', authRoutes);
api.use('/voice', transcriptionRoutes);
api.use('/complaints', complaintRoutes);
api.use('/admin', adminRoutes);
api.use('/media', mediaRoutes);
api.get('/data-sources', dataSources);
app.use('/api/v1', generalLimiter, api);

// Single-service deployment: serve the built frontend (frontend/dist) and fall back to index.html for client-side
// routes. Enabled by default in production, or with SERVE_FRONTEND=true. API and upload paths never fall through.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const serveFrontend = ENV.SERVE_FRONTEND ?? ENV.NODE_ENV === 'production';
if (serveFrontend) {
  if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
    app.use(express.static(frontendDist, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));
  } else {
    logger.warn(`SERVE_FRONTEND is on but ${frontendDist} has no build. Run "npm run build:frontend" first.`);
  }
}

app.use(notFoundHandler);
app.use(errorHandler);

export const startServer = async () => {
  await connectDB();
  await ensureDepartments();
  await bootstrapAdmin();
  if (ENV.SEED_DEMO_DATA) await seedDemoData();

  app.listen(ENV.PORT, () => {
    logger.info(`CivicEye API listening on http://localhost:${ENV.PORT} (${ENV.NODE_ENV})`);
  });
};

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}
