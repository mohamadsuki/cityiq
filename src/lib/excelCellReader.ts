import * as XLSX from "xlsx";

export interface CellReaderOptions {
  trimValues?: boolean;
  skipEmptyRows?: boolean;
  convertNumbers?: boolean;
}

export interface ExcelConfig {
  name: string;
  headerRow?: number;
  dataStartRow?: number;
  columnMapping: Record<string, string>;
  propertyTypeMapping?: Record<string, string>;
}

// Configuration for "טיוטת מאזן RAW" file
export const COLLECTION_EXCEL_CONFIG: ExcelConfig = {
  name: "טיוטת מאזן RAW",
  headerRow: 12, // Row 12 contains headers
  dataStartRow: 13, // Data starts from row 13
  columnMapping: {
    D: "property_type", // תיאור סוג נכס
    H: "annual_budget", // תקציב שנתי ארנונה
    I: "relative_budget", // תקציב יחסי ארנונה
    M: "actual_collection" // גביה בפועל
  },
  propertyTypeMapping: {
    "מגורים": "מגורים",
    "דירות מגורים": "מגורים", 
    "בתים פרטיים": "מגורים",
    "מסחר": "מסחר",
    "חנויות": "מסחר",
    "מסעדות": "מסחר",
    "תעשיה": "תעשיה",
    "בתי חרושת": "תעשיה",
    "מפעלים": "תעשיה",
    "משרדים": "משרדים",
    "משרדי עורכי דין": "משרדים",
    "משרדי רופאים": "משרדים",
    "אחר": "אחר",
    "שונות": "אחר",
    "לא מסווג": "אחר"
  }
};

export class ExcelCellReader {
  private sheet: any;
  private options: CellReaderOptions;

  constructor(sheet: any, options: CellReaderOptions = {}) {
    this.sheet = sheet;
    this.options = {
      trimValues: true,
      skipEmptyRows: true,
      convertNumbers: true,
      ...options
    };
  }

  /**
   * Read a specific cell value (e.g., "F25")
   */
  readCell(cellAddress: string): any {
    const cell = this.sheet[cellAddress];
    if (!cell) return null;
    
    let value = cell.v;
    if (this.options.trimValues && typeof value === 'string') {
      value = value.trim();
    }
    
    if (this.options.convertNumbers && typeof value === 'string' && !isNaN(Number(value))) {
      value = Number(value);
    }
    
    return value;
  }

  /**
   * Read a range of cells (e.g., "A1:C10")
   */
  readRange(startCell: string, endCell: string): any[][] {
    const range = XLSX.utils.decode_range(`${startCell}:${endCell}`);
    const result: any[][] = [];
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      const rowData: any[] = [];
      let hasData = false;
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const value = this.readCell(cellAddress);
        rowData.push(value);
        if (value !== null && value !== undefined && value !== '') {
          hasData = true;
        }
      }
      
      if (!this.options.skipEmptyRows || hasData) {
        result.push(rowData);
      }
    }
    
    return result;
  }

  /**
   * Sum values in a column within a row range
   */
  sumColumn(column: string, fromRow: number, toRow: number): number {
    let sum = 0;
    for (let row = fromRow; row <= toRow; row++) {
      const cellAddress = `${column}${row}`;
      const value = this.readCell(cellAddress);
      if (typeof value === 'number' && !isNaN(value)) {
        sum += value;
      }
    }
    return sum;
  }

  /**
   * Find header row by searching for specific text
   */
  findHeader(searchText: string, maxRows: number = 20): number | null {
    for (let row = 1; row <= maxRows; row++) {
      for (let col = 0; col < 20; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row - 1, c: col });
        const value = this.readCell(cellAddress);
        if (typeof value === 'string' && value.includes(searchText)) {
          return row;
        }
      }
    }
    return null;
  }

  /**
   * Get column letter from column index (0-based)
   */
  static getColumnLetter(colIndex: number): string {
    return XLSX.utils.encode_col(colIndex);
  }

  /**
   * Get column index from column letter
   */
  static getColumnIndex(colLetter: string): number {
    return XLSX.utils.decode_col(colLetter);
  }

  /**
   * Parse collection data using the predefined configuration
   */
  parseCollectionData(config: ExcelConfig = COLLECTION_EXCEL_CONFIG): any[] {
    const results: any[] = [];
    const currentYear = new Date().getFullYear();
    
    // Find the actual data range by scanning for non-empty rows
    let lastDataRow = config.dataStartRow || 13;
    for (let row = lastDataRow; row <= lastDataRow + 50; row++) {
      const hasData = Object.keys(config.columnMapping).some(col => {
        const value = this.readCell(`${col}${row}`);
        return value !== null && value !== undefined && value !== '';
      });
      
      if (hasData) {
        lastDataRow = row;
      }
    }

    console.log(`Scanning rows ${config.dataStartRow} to ${lastDataRow} for collection data`);

    // Parse each data row
    for (let row = config.dataStartRow || 13; row <= lastDataRow; row++) {
      const rowData: any = { year: currentYear };
      let hasValidData = false;

      // Extract data from configured columns
      Object.entries(config.columnMapping).forEach(([col, field]) => {
        const value = this.readCell(`${col}${row}`);
        
        if (field === 'property_type') {
          // Clean and standardize property type
          const cleanType = this.standardizePropertyType(value, config.propertyTypeMapping);
          if (cleanType) {
            rowData[field] = cleanType;
            hasValidData = true;
          }
        } else {
          // Handle numeric fields
          const numValue = this.parseNumericValue(value);
          if (numValue !== null) {
            rowData[field] = numValue;
            hasValidData = true;
          } else if (value !== null && value !== undefined && value !== '') {
            rowData[field] = value;
            hasValidData = true;
          }
        }
      });

      // Only add rows that have at least property type or numeric data
      if (hasValidData && (rowData.property_type || rowData.annual_budget || rowData.relative_budget || rowData.actual_collection)) {
        // Calculate surplus/deficit
        const actualCollection = rowData.actual_collection || 0;
        const relativeBudget = rowData.relative_budget || 0;
        rowData.surplus_deficit = actualCollection - relativeBudget;
        
        results.push(rowData);
        console.log(`Row ${row}:`, rowData);
      }
    }

    console.log(`Parsed ${results.length} collection records`);
    return results;
  }

  /**
   * Standardize property type using mapping
   */
  private standardizePropertyType(value: any, mapping?: Record<string, string>): string | null {
    if (!value || typeof value !== 'string') return null;
    
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    // Use mapping if provided
    if (mapping) {
      const mapped = Object.entries(mapping).find(([key]) => 
        cleanValue.includes(key) || key.includes(cleanValue)
      );
      if (mapped) return mapped[1];
    }
    
    // Default categorization
    if (cleanValue.includes('מגור')) return 'מגורים';
    if (cleanValue.includes('מסחר') || cleanValue.includes('חנו')) return 'מסחר';
    if (cleanValue.includes('תעשי') || cleanValue.includes('מפעל')) return 'תעשיה';
    if (cleanValue.includes('משרד')) return 'משרדים';
    
    return 'אחר';
  }

  /**
   * Parse numeric value from various formats
   */
  private parseNumericValue(value: any): number | null {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      // Remove commas, spaces, and currency symbols
      const cleaned = value.replace(/[,\s₪]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    }
    
    return null;
  }

  /**
   * Get summary totals for all numeric columns
   */
  getSummaryTotals(data: any[]): Record<string, number> {
    const totals: Record<string, number> = {};
    const numericFields = ['annual_budget', 'relative_budget', 'actual_collection', 'surplus_deficit'];
    
    numericFields.forEach(field => {
      totals[field] = data.reduce((sum, row) => sum + (row[field] || 0), 0);
    });
    
    return totals;
  }

  /**
   * Group data by property type for charts
   */
  groupByPropertyType(data: any[], field: string): Array<{ name: string; value: number; }> {
    const grouped: Record<string, number> = {};
    
    data.forEach(row => {
      const propertyType = row.property_type || 'לא מסווג';
      const value = row[field] || 0;
      grouped[propertyType] = (grouped[propertyType] || 0) + value;
    });
    
    return Object.entries(grouped)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }
}

export default ExcelCellReader;