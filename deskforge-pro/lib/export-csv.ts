export type CsvColumn<T> = {key: keyof T | string; label: string; value?: (row: T) => unknown};

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Guard against CSV injection in spreadsheet apps.
  const sanitized = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(sanitized)) return `"${sanitized.replace(/"/g, '""')}"`;
  return sanitized;
}

/** Build a CSV string from rows using the provided column definitions. */
export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.value ? c.value(row) : (row as Record<string, unknown>)[c.key as string])).join(','),
  );
  return [header, ...body].join('\r\n');
}

/** Trigger a client-side download of CSV content. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(['\ufeff', csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
