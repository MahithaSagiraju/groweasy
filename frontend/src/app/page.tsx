'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { CsvUploader } from '../components/CsvUploader';
import { CsvPreviewTable } from '../components/CsvPreviewTable';
import { FileMetadata } from '../components/FileMetadata';
import { ProgressIndicator } from '../components/ProgressIndicator';
import { ImportResults } from '../components/ImportResults';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { parseCsv, validateCsv } from '../utils/csv';
import { uploadCsv, startImport, getImportProgress } from '../services/api';
import { ParsedCsvData, ImportResult, ImportProgress } from '../types';

type Step = 'upload' | 'preview' | 'importing' | 'complete' | 'error';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setError(null);
    setImportResult(null);
    setProgress(null);

    try {
      const { data, columns } = await parseCsv(file);
      const validationErrors = validateCsv(data);
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        return;
      }

      setSelectedFile(file);
      setParsedData({
        data,
        columns,
        totalRows: data.length,
        filename: file.name,
        size: file.size,
      });

      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV');
      setStep('error');
    }
  }, []);

  const pollProgress = useCallback(async (sessionId: string) => {
    try {
      const res = await getImportProgress(sessionId);
      setProgress(res.progress);

      if (res.progress.status === 'completed') {
        if (res.result) {
          setImportResult(res.result);
        }
        setImporting(false);
        setStep('complete');
        return;
      }

      if (res.progress.status === 'error') {
        setError(res.error || 'Import failed');
        setImporting(false);
        setStep('error');
        return;
      }

      pollRef.current = setTimeout(() => pollProgress(sessionId), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check progress');
      setImporting(false);
      setStep('error');
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (!parsedData || !selectedFile) return;

    setImporting(true);
    setStep('importing');
    setError(null);

    try {
      const uploadRes = await uploadCsv(selectedFile);

      setProgress({
        total: parsedData.totalRows,
        processed: 0,
        imported: 0,
        skipped: 0,
        batch: 0,
        totalBatches: Math.ceil(parsedData.totalRows / 10),
        status: 'idle',
      });

      await startImport(uploadRes.id);

      setProgress((prev) =>
        prev ? { ...prev, status: 'processing' } : null
      );

      pollRef.current = setTimeout(() => pollProgress(uploadRes.id), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setProgress((prev) =>
        prev ? { ...prev, status: 'error', message: err instanceof Error ? err.message : 'Import failed' } : null
      );
      setImporting(false);
      setStep('error');
    }
  }, [parsedData, selectedFile, pollProgress]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
      }
    };
  }, []);

  const handleReset = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
    setStep('upload');
    setSelectedFile(null);
    setParsedData(null);
    setImportResult(null);
    setProgress(null);
    setError(null);
    setImporting(false);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">CSV Importer</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-powered CSV import for GrowEasy CRM
            </p>
          </div>
          <div className="flex items-center gap-3">
            {step !== 'upload' && (
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              >
                Start Over
              </button>
            )}
            <DarkModeToggle />
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <CsvUploader onFileSelected={handleFileSelected} />
          </div>
        )}

        {(step === 'preview' || step === 'importing' || step === 'complete') && parsedData && (
          <div className="space-y-6">
            <FileMetadata
              filename={parsedData.filename}
              totalRows={parsedData.totalRows}
              columns={parsedData.columns}
              size={parsedData.size}
            />

            <CsvPreviewTable
              data={parsedData.data}
              columns={parsedData.columns}
            />

            {step === 'preview' && (
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Processing...' : 'Confirm Import'}
                </button>
              </div>
            )}
          </div>
        )}

        {step === 'importing' && progress && (
          <div className="max-w-lg mx-auto mt-8">
            <ProgressIndicator progress={progress} />
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className="max-w-2xl mx-auto mt-8">
            <ImportResults
              result={importResult}
              filename={parsedData?.filename || 'export'}
            />
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-12">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
