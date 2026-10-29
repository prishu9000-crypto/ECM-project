/**
 * Sanitizes and escapes a cell value for CSV export, preventing Formula Injection
 * (=, +, -, @) which could exploit Excel or Google Sheets.
 */
export function escapeCSVCell(value) {
  if (value === null || value === undefined) return '""';
  let str = String(value);

  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Downloads an array of row objects as a CSV file.
 * @param {string} filename - Output filename (e.g. 'event-attendance-report.csv')
 * @param {Array<string>} headers - Column titles
 * @param {Array<Array<any>>} rows - 2D array of row cell values
 */
export function exportToCSV(filename, headers, rows) {
  const headerLine = headers.map(escapeCSVCell).join(',');
  const rowLines = rows.map(row => row.map(escapeCSVCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n'); // BOM for UTF-8 in Excel

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
