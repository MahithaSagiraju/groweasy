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
          Download JSON
        </button>
        {skipped.length > 0 && (
          <>
            <button
              onClick={() => downloadSkippedRecords(skipped, filename)}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
            >
              Download Skipped CSV
            </button>
          </>
        )}
      </div>

      {skipped.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm font-medium text-yellow-600 dark:text-yellow-400">
            {skipped.length} record(s) skipped — click for details
          </summary>
          <div className="mt-2 max-h-60 overflow-y-auto border border-[var(--border)] rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
                  <th className="text-left py-2 px-3">Row</th>
                  <th className="text-left py-2 px-3">Reason</th>
                  <th className="text-left py-2 px-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((s, idx) => (
                  <tr key={idx} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="py-2 px-3">{s.row}</td>
                    <td className="py-2 px-3 text-red-600 dark:text-red-400">{s.reason}</td>
                    <td className="py-2 px-3">
                      <code className="text-xs">{JSON.stringify(s.data).slice(0, 80)}</code>
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
