'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface CsvUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function CsvUploader({ onFileSelected, disabled }: CsvUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled,
    multiple: false,
  });

  const borderColor = isDragActive
    ? 'var(--primary)'
    : 'var(--border)';

  return (
    <div
      {...getRootProps()}
      style={{ borderColor }}
      className={`border-2 border-dashed rounded-xl p-12 md:p-16 text-center cursor-pointer transition-all duration-200
        ${isDragActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-[var(--muted)]'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <span className="text-4xl leading-none mb-1 opacity-60">{isDragActive ? '📥' : '📄'}</span>
        {isDragActive ? (
          <p className="text-lg font-medium text-[var(--primary)]">
            Drop your CSV file here
          </p>
        ) : (
          <>
            <p className="text-lg font-medium">Drop a CSV to get started</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              or click to browse
            </p>
          </>
        )}
      </div>
    </div>
  );
}
