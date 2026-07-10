'use client';

import { ImportResult } from '../types';
import { exportAsJson, downloadSkippedRecords } from '../utils/csv';

interface ImportResultsProps {
  result: ImportResult;
  filename: string;
}

export function ImportResults({ result, filename }: ImportResultsProps) {
  const { imported, skipped, summary } = result;

  return (
    <div className="space-y-4 p-4 rounded-lg border border-[var(--border)]">
      <h3 className="text-lg font-semibold">Import Complete</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {summary.imported}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Imported</div>
        </div>
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {summary.skipped}
          </div>
          <div className="text-sm text-yellow-700 dark:text-yellow-300">Skipped</div>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-[var(--border)]">
          <div className="text-2xl font-bold">{summary.total}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => exportAsJson(imported, filename)}
          className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
        >
          Export Imported JSON
        </button>
        {skipped.length > 0 && (
          <button
            onClick={() => downloadSkippedRecords(skipped, filename)}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
          >
            Download Skipped Records
          </button>
        )}
      </div>

      {skipped.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-yellow-600 dark:text-yellow-400">
            View {skipped.length} skipped record(s)
          </summary>
          <div className="mt-2 max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2">Row</th>
                  <th className="text-left py-2 px-2">Reason</th>
                  <th className="text-left py-2 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((skip) => (
                  <tr key={skip.row} className="border-b border-[var(--border)]">
                    <td className="py-2 px-2">{skip.row}</td>
                    <td className="py-2 px-2 text-red-600 dark:text-red-400">
                      {skip.reason}
                    </td>
                    <td className="py-2 px-2">
                      <pre className="text-xs truncate max-w-[300px]">
                        {JSON.stringify(skip.data)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
