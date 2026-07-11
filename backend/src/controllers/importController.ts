import { Request, Response, NextFunction } from 'express';
import { saveUpload, buildUploadResponse } from '../utils/csv';
import { mapBatchToCrm } from '../services/llm';
import { HttpError, logger } from '../utils/helpers';
import { ImportResult } from '../types';
import { config } from '../utils/config';

const sessions: Record<string, {
  rows: Record<string, string>[];
  progress: {
    total: number; processed: number; imported: number; skipped: number;
    batch: number; totalBatches: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
  };
  result?: ImportResult;
  error?: string;
}> = {};

export async function uploadCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new HttpError(400, 'No file uploaded');

    const result = await saveUpload(req.file);
    const response = buildUploadResponse(result);

    sessions[result.id] = {
      rows: result.rows,
      progress: {
        total: result.rows.length,
        processed: 0, imported: 0, skipped: 0,
        batch: 0,
        totalBatches: Math.ceil(result.rows.length / config.batchSize),
        status: 'idle',
      },
    };

    logger.info({ id: result.id, rows: result.rows.length }, 'CSV uploaded');
    res.json(response);
  } catch (error) {
    next(error);
  }
}

export async function importData(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.body;
    if (!id) throw new HttpError(400, 'Missing id');

    const session = sessions[id];
    if (!session) throw new HttpError(404, 'Session not found');
    if (session.progress.status === 'processing') {
      throw new HttpError(409, 'Already processing');
    }

    session.progress.status = 'processing';
    res.status(202).json({ id, status: 'started' });

    runImport(session, id).catch((err) => {
      logger.error({ id, err }, 'Import failed');
      session.progress.status = 'error';
      session.error = err instanceof Error ? err.message : 'Unknown error';
    });
  } catch (error) {
    next(error);
  }
}

async function runImport(session: any, sessionId: string) {
  const { rows, progress } = session;
  const allImported: ImportResult['imported'] = [];
  const allSkipped: ImportResult['skipped'] = [];

  for (let i = 0; i < rows.length; i += config.batchSize) {
    const batch = rows.slice(i, i + config.batchSize);
    try {
      const result = await mapBatchToCrm(batch, Math.floor(i / config.batchSize));
      allImported.push(...result.imported);
      allSkipped.push(...result.skipped);

      progress.batch = Math.floor(i / config.batchSize) + 1;
      progress.processed = Math.min(i + config.batchSize, rows.length);
      progress.imported = allImported.length;
      progress.skipped = allSkipped.length;
    } catch (err: any) {
      logger.error({ sessionId, batch: i, err }, 'Batch failed');
      progress.status = 'error';
      session.error = err?.message || 'Batch failed';
      return;
    }
  }

  const seen = new Set<string>();
  const deduped: ImportResult['imported'] = [];
  for (const r of allImported) {
    const key = r.email || r.mobile_without_country_code;
    if (key && !seen.has(key)) { seen.add(key); deduped.push(r); }
  }

  progress.status = 'completed';
  progress.processed = rows.length;
  progress.imported = deduped.length;
  progress.skipped = allSkipped.length;
  session.result = { imported: deduped, skipped: allSkipped };
}

export async function getProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const session = sessions[id];
    if (!session) return next(new HttpError(404, 'Session not found'));

    res.json({
      progress: session.progress,
      result: session.progress.status === 'completed' ? session.result : undefined,
      error: session.progress.status === 'error' ? session.error : undefined,
    });
  } catch (error) {
    next(error);
  }
}
