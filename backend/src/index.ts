import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { upload } from './middleware/upload';
import { errorHandler } from './middleware/errorHandler';
import { uploadCsv, importData, getProgress } from './controllers/importController';

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload CSV
app.post('/api/upload', upload.single('file'), uploadCsv);

// Import data (process with LLM)
app.post('/api/import', importData);

// Get import progress
app.get('/api/import/:id/progress', getProgress);

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
});

export default app;
