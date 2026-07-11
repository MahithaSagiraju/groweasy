import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import multer from 'multer';
import path from 'path';
import { ZodError } from 'zod';
import { config } from './utils/config';
import { logger, HttpError } from './utils/helpers';
import { uploadCsv, importData, getProgress } from './controllers/importController';

const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, config.uploadDir),
    filename: (_r, f, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.originalname)}`),
  }),
  fileFilter: (_r, f, cb) => {
    const ok = ['text/csv', 'text/plain', 'application/vnd.ms-excel', 'application/csv'];
    cb(null, ok.includes(f.mimetype) || f.originalname.endsWith('.csv'));
  },
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
});

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [config.corsOrigin, 'http://localhost:3000'].filter(Boolean),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));
app.post('/api/upload', upload.single('file'), uploadCsv);
app.post('/api/import', importData);
app.get('/api/import/:id/progress', getProgress);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'err');
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
  } else if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation error', details: err.errors });
  } else if (err?.message?.includes('CSV parse error') || err?.message?.includes('Only CSV')) {
    res.status(400).json({ error: err.message });
  } else {
    res.status(500).json({ error: 'Internal error', message: config.nodeEnv === 'development' ? err.message : undefined });
  }
});

app.listen(config.port, () => logger.info({ port: config.port }, 'up'));

export default app;
