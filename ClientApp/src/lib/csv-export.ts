import { RCTableRow, TABLE_COLUMNS } from '@/types/rc-verification';

export function exportToCSV(
  data: RCTableRow[],
  fileName: string = 'rc-verification-export',
  visibleColumns?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const columnsToExport = visibleColumns
    ? TABLE_COLUMNS.filter(col => visibleColumns.includes(col.key))
    : TABLE_COLUMNS;

  // Create header row
  const headers = columnsToExport.map(col => col.label);

  // Create data rows
  const rows = data.map(row => {
    return columnsToExport.map(col => {
      const value = row[col.key as keyof RCTableRow];
      
      // Handle boolean values
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      
      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportSelectedToCSV(
  data: RCTableRow[],
  selectedIds: string[],
  visibleColumns?: string[]
): void {
  const selectedData = data.filter(row => selectedIds.includes(row.id));
  exportToCSV(selectedData, 'rc-verification-selected-export', visibleColumns);
}
