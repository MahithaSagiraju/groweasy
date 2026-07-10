'use client';

import { ImportProgress } from '../types';

interface ProgressIndicatorProps {
  progress: ImportProgress;
}

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  const percentage =
    progress.totalBatches > 0
      ? Math.round((progress.batch / progress.totalBatches) * 100)
      : 0;

  return (
    <div className="space-y-3 p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[var(--primary)] animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="font-medium">Processing Import...</span>
        </div>
        <span className="text-sm text-gray-500">{percentage}%</span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Processed: </span>
          <span className="font-medium">{progress.processed}</span>
        </div>
        <div>
          <span className="text-green-600 dark:text-green-400">Imported: </span>
          <span className="font-medium">{progress.imported}</span>
        </div>
        <div>
          <span className="text-yellow-600 dark:text-yellow-400">Skipped: </span>
          <span className="font-medium">{progress.skipped}</span>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Batch {Math.min(progress.batch + 1, progress.totalBatches)} of{' '}
        {progress.totalBatches}
      </p>
    </div>
  );
}
