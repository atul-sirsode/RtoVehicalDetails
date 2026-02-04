import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ImportedRecord } from '@/types/rc-verification';

export interface ParseResult {
  success: boolean;
  data: ImportedRecord[];
  rcNumbers: string[];
  error?: string;
  fileName: string;
  totalRows: number;
}

function findRCColumn(headers: string[]): string | null {
  const possibleNames = [
    'rc_number',
    'rcnumber',
    'rc number',
    'rc',
    'registration_number',
    'registrationnumber',
    'registration number',
    'reg_no',
    'regno',
    'reg no',
    'vehicle_number',
    'vehiclenumber',
    'vehicle number',
    'veh_no',
    'vehno',
  ];

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim().replace(/[_\s-]/g, '');
    for (const possible of possibleNames) {
      const normalizedPossible = possible.toLowerCase().replace(/[_\s-]/g, '');
      if (normalizedHeader === normalizedPossible || normalizedHeader.includes(normalizedPossible)) {
        return header;
      }
    }
  }

  return null;
}

export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          resolve({
            success: false,
            data: [],
            rcNumbers: [],
            error: results.errors[0].message,
            fileName: file.name,
            totalRows: 0,
          });
          return;
        }

        const headers = results.meta.fields || [];
        const rcColumn = findRCColumn(headers);

        if (!rcColumn) {
          resolve({
            success: false,
            data: [],
            rcNumbers: [],
            error: 'Could not find RC Number column. Please ensure your file has a column named "RC_Number", "RC Number", or similar.',
            fileName: file.name,
            totalRows: 0,
          });
          return;
        }

        const data: ImportedRecord[] = results.data.map((row) => ({
          ...row,
          rc_number: String(row[rcColumn] || '').trim().toUpperCase(),
        }));

        const rcNumbers = data
          .map((row) => row.rc_number)
          .filter((rc) => rc && rc.length > 0);

        resolve({
          success: true,
          data,
          rcNumbers,
          fileName: file.name,
          totalRows: data.length,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          rcNumbers: [],
          error: error.message,
          fileName: file.name,
          totalRows: 0,
        });
      },
    });
  });
}

export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (jsonData.length === 0) {
          resolve({
            success: false,
            data: [],
            rcNumbers: [],
            error: 'The Excel file is empty or could not be parsed.',
            fileName: file.name,
            totalRows: 0,
          });
          return;
        }

        const headers = Object.keys(jsonData[0] || {});
        const rcColumn = findRCColumn(headers);

        if (!rcColumn) {
          resolve({
            success: false,
            data: [],
            rcNumbers: [],
            error: 'Could not find RC Number column. Please ensure your file has a column named "RC_Number", "RC Number", or similar.',
            fileName: file.name,
            totalRows: 0,
          });
          return;
        }

        const parsedData: ImportedRecord[] = jsonData.map((row) => ({
          ...row,
          rc_number: String(row[rcColumn] || '').trim().toUpperCase(),
        }));

        const rcNumbers = parsedData
          .map((row) => row.rc_number)
          .filter((rc) => rc && rc.length > 0);

        resolve({
          success: true,
          data: parsedData,
          rcNumbers,
          fileName: file.name,
          totalRows: parsedData.length,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          rcNumbers: [],
          error: error instanceof Error ? error.message : 'Failed to parse Excel file',
          fileName: file.name,
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        rcNumbers: [],
        error: 'Failed to read file',
        fileName: file.name,
        totalRows: 0,
      });
    };

    reader.readAsBinaryString(file);
  });
}

export async function parseFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (['xlsx', 'xls'].includes(extension || '')) {
    return parseExcel(file);
  }

  return {
    success: false,
    data: [],
    rcNumbers: [],
    error: 'Unsupported file format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)',
    fileName: file.name,
    totalRows: 0,
  };
}
