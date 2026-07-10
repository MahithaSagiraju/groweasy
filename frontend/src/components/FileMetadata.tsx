'use client';

export function FileMetadata({ filename, totalRows, columns, size }: {
  filename: string;
  totalRows: number;
  columns: string[];
  size: number;
}) {
  const fmt = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ['Filename', filename],
          ['Total Rows', totalRows.toLocaleString()],
          ['Columns', String(columns.length)],
          ['File Size', fmt(size)],
        ].map(([label, value]) => (
          <div key={label} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
            <div className="text-sm font-medium truncate" title={value}>{value}</div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Detected Columns ({columns.length})
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {columns.map((col) => (
            <span key={col} className="px-2.5 py-1 text-xs rounded-full border border-[var(--border)] bg-[var(--muted)]">
              {col}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
