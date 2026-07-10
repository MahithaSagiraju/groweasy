import Papa from 'papaparse';

export function parseCsv(
  file: File
): Promise<{ data: Record<string, string>[]; columns: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter(
            (e) => e.type !== 'FieldMismatch'
          );
          if (criticalErrors.length > 0) {
            reject(
              new Error(
                criticalErrors.map((e) => e.message).join(', ')
              )
            );
            return;
          }
        }
        const data = results.data as Record<string, string>[];
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        resolve({ data, columns });
      },
      error: (error: Error) => reject(error),
    });
  });
}

export function validateCsv(data: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (data.length === 0) {
    errors.push('CSV file is empty');
    return errors;
  }
  if (data.length > 100000) {
    errors.push('CSV file exceeds maximum of 100,000 rows');
  }
  return errors;
}

export function exportAsJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(blob, filename.replace('.csv', '.json'));
}

export function downloadSkippedRecords(
  skipped: { row: number; reason: string; data: Record<string, string> }[],
  filename: string
): void {
  if (skipped.length === 0) return;
  const allKeys = [...new Set(skipped.flatMap((s) => Object.keys(s.data)))];
  const headers = ['Row', 'Reason', ...allKeys];
  const csvRows = [
    headers.join(','),
    ...skipped.map((s) =>
      [
        s.row,
        `"${s.reason.replace(/"/g, '""')}"`,
        ...allKeys.map((k) => `"${String(s.data[k] || '').replace(/"/g, '""')}"`),
      ].join(',')
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  downloadBlob(blob, `skipped_${filename}`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
