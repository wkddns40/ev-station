export function objectToCSVRow(dataObject: Record<string, unknown>): string {
  const fields: string[] = [];
  for (const key in dataObject) {
    const raw = dataObject[key];
    fields.push(raw === null || raw === undefined ? '' : '"' + String(raw) + '"');
  }
  return fields.join(',') + '\r\n';
}

export function convertToCSV<T extends Record<string, unknown>>(rows: T[]): string {
  let csv = '﻿';
  const first = rows[0];
  if (!first) return csv;
  csv += objectToCSVRow(Object.fromEntries(Object.keys(first).map((k) => [k, k])));
  for (const row of rows) {
    csv += objectToCSVRow(row);
  }
  return csv;
}

export function downloadCSV(csvContent: string, fileName: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}
