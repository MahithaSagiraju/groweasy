import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from './config';
import { UploadResponse } from '../types';
import { logger } from './helpers';

export function parseCsvFile(filePath: string): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
    Papa.parse(stream, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      step: (results) => {
        if (results.data && typeof results.data === 'object' && Object.keys(results.data as object).length > 0) {
          rows.push(results.data as Record<string, string>);
        }
      },
      error: (err: Error) => reject(new Error(`CSV parse error: ${err.message}`)),
      complete: () => {
        logger.info({ rows: rows.length, file: path.basename(filePath) }, 'csv parsed');
        resolve(rows);
      },
    });
  });
}

export interface SaveUploadResult {
  id: string;
  filePath: string;
  rows: Record<string, string>[];
  columns: string[];
  filename: string;
}

export async function saveUpload(
  file: Express.Multer.File
): Promise<SaveUploadResult> {
  const id = randomUUID();
  const ext = path.extname(file.originalname);
  const destPath = path.join(config.uploadDir, `${id}${ext}`);

  fs.renameSync(file.path, destPath);
  const rows = await parseCsvFile(destPath);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return { id, filePath: destPath, rows, columns, filename: file.originalname };
}

export function buildUploadResponse(result: SaveUploadResult): UploadResponse {
  return {
    id: result.id,
    filename: result.filename,
    totalRows: result.rows.length,
    columns: result.columns,
    preview: result.rows.slice(0, 10),
    metadata: {
      size: result.rows.length,
      rows: result.rows.length,
      columns: result.columns.length,
      columnNames: result.columns,
    },
  };
}

export function filterRowByEmailOrMobile(
  row: Record<string, string>
): { hasEmail: boolean; hasMobile: boolean } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const values = Object.values(row).filter((v) => v && v.trim().length > 0);
  const hasEmail = values.some((v) => emailRegex.test(v.trim()));
  const mobileRegex = /^\+?\d{7,15}$/;
  const hasMobile = values.some((v) => mobileRegex.test(v.trim().replace(/[\s\-()]/g, '')));
  return { hasEmail, hasMobile };
}
