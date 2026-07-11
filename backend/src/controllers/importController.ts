import { Request, Response, NextFunction } from 'express';
import { saveUpload, buildUploadResponse } from '../utils/csv';
import { mapRows } from '../services/mapper';
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
  progress.batch = 1;
  progress.processed = rows.length;

  const result = mapRows(rows);

  const seen = new Set<string>();
  const deduped: ImportResult['imported'] = [];
  for (const r of result.imported) {
    const key = r.email || r.mobile_without_country_code;
    if (key && !seen.has(key)) { seen.add(key); deduped.push(r); }
  }

  progress.status = 'completed';
  progress.imported = deduped.length;
  progress.skipped = result.skipped.length;
  session.result = {
    imported: deduped,
    skipped: result.skipped,
    summary: { total: rows.length, imported: deduped.length, skipped: result.skipped.length },
  };
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
