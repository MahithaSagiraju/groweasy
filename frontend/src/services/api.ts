import axios from 'axios';
import { UploadResponse, ImportResult } from '../types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 600000,
});

export async function uploadCsv(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<UploadResponse>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });

  return data;
}

export async function startImport(id: string): Promise<void> {
  await api.post('/import', { id });
}

export interface ImportProgressResponse {
  progress: {
    total: number;
    processed: number;
    imported: number;
    skipped: number;
    batch: number;
    totalBatches: number;
    status: 'idle' | 'processing' | 'completed' | 'error';
    message?: string;
  };
  result?: ImportResult;
  error?: string;
}

export async function getImportProgress(
  id: string
): Promise<ImportProgressResponse> {
  const { data } = await api.get<ImportProgressResponse>(`/import/${id}/progress`);
  return data;
}
