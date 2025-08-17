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
    F: "year", // שנה
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

// Configuration for Tabarim Excel file
export const TABARIM_EXCEL_CONFIG: ExcelConfig = {
  name: "תב\"רים",
  headerRow: 1, // Headers on first row
  dataStartRow: 2, // Data starts from row 2
  columnMapping: {
    A: "tabar_number", // מספר תב"ר
    B: "tabar_name", // שם תב"ר
    C: "funding_source1", // מקור תקציבי 1
    D: "domain", // תחום
    E: "funding_source2", // מקור תקציבי 2  
    F: "funding_source3", // מקור תקציבי 3
    G: "approved_budget", // תקציב מאושר
    H: "income_actual", // הכנסה בפועל
    I: "expense_actual", // הוצאה בפועל
    J: "status" // סטטוס
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
   * Parse Tabarim data from an Excel sheet
   */
  parseTabarimData(config: ExcelConfig): any[] {
    console.log('=== TABARIM EXCEL PARSING DEBUG ===');
    
    if (!this.sheet) {
      console.error('❌ No sheet available');
      return [];
    }

    const result: any[] = [];
    const range = XLSX.utils.decode_range(this.sheet['!ref'] || 'A1:J100');
    
    // Find the last row with actual data
    let lastDataRow = config.dataStartRow || 2;
    for (let row = lastDataRow; row <= range.e.r + 1; row++) {
      const hasData = Object.keys(config.columnMapping).some(col => {
        const cellAddress = col + row;
        const cell = this.sheet[cellAddress];
        return cell && cell.v && String(cell.v).trim() !== '';
      });
      if (hasData) {
        lastDataRow = row;
      }
    }

    console.log(`📊 Processing Tabarim data rows ${config.dataStartRow} to ${lastDataRow}`);

    // Parse each data row
    for (let row = config.dataStartRow || 2; row <= lastDataRow; row++) {
      try {
        const rowData: any = {};
        let hasValidData = false;

        // Extract data from configured columns
        Object.entries(config.columnMapping).forEach(([col, field]) => {
          const cellAddress = col + row;
          const cell = this.sheet[cellAddress];
          const rawValue = cell?.v;

          if (rawValue !== null && rawValue !== undefined && String(rawValue).trim() !== '') {
            if (field === 'tabar_number' || field === 'tabar_name') {
              rowData[field] = String(rawValue).trim();
              hasValidData = true;
            } else if (field === 'domain') {
              // Map domain to standard values
              const domainValue = this.mapDomainValue(String(rawValue).trim());
              rowData[field] = domainValue;
              hasValidData = true;
            } else if (field === 'status') {
              // Map status to standard values
              const statusValue = this.mapStatusValue(String(rawValue).trim());
              rowData[field] = statusValue;
              hasValidData = true;
            } else if (field.startsWith('funding_source')) {
              // Map funding sources to standard values
              const fundingValue = this.mapFundingSourceValue(String(rawValue).trim());
              rowData[field] = fundingValue;
              hasValidData = true;
            } else {
              // Handle numeric fields
              console.log(`🔍 Processing numeric field ${field} in ${cellAddress}: raw value = "${rawValue}" (type: ${typeof rawValue})`);
              const numValue = this.parseNumericValue(rawValue);
              console.log(`📊 Parsed numeric value for ${field}: ${numValue}`);
              if (numValue !== null) {
                rowData[field] = numValue;
                hasValidData = true;
              } else {
                console.log(`⚠️ Failed to parse numeric value for ${field}: "${rawValue}"`);
              }
            }
          }
        });

        if (hasValidData) {
          // Filter out unwanted header/summary rows
          const tabarName = rowData.tabar_name || '';
          const skipPatterns = ['מספר תב"ר', 'סה"כ כללי', 'דו"ח תקופתי', 'ריכוז תקבולים'];
          const shouldSkip = skipPatterns.some(pattern => tabarName.includes(pattern));
          
          if (shouldSkip) {
            console.log(`⏭️ Skipping row ${row}: "${tabarName}" (matches skip pattern)`);
          } else {
            // Set default values for missing fields
            rowData.approved_budget = rowData.approved_budget || 0;
            rowData.income_actual = rowData.income_actual || 0;
            rowData.expense_actual = rowData.expense_actual || 0;
            
            // Calculate surplus/deficit
            rowData.surplus_deficit = (rowData.income_actual || 0) - (rowData.expense_actual || 0);
            
            console.log(`✅ Row ${row}: ${rowData.tabar_name} - Budget: ${rowData.approved_budget}, Income: ${rowData.income_actual}, Expense: ${rowData.expense_actual}`);
            result.push(rowData);
          }
        }

      } catch (error) {
        console.error(`❌ Error processing Tabarim row ${row}:`, error);
      }
    }

    console.log(`📈 Successfully parsed ${result.length} Tabarim records`);
    return result;
  }

  /**
   * Parse collection data using the predefined configuration
   */
  parseCollectionData(config: ExcelConfig = COLLECTION_EXCEL_CONFIG): any[] {
    const results: any[] = [];
    const currentYear = new Date().getFullYear();
    
    console.log('Starting collection data parsing with improved error handling...');
    
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
      try {
        const rowData: any = {};
        let hasValidData = false;

        // Extract data from configured columns
        Object.entries(config.columnMapping).forEach(([col, field]) => {
          const rawValue = this.readCell(`${col}${row}`);
          console.log(`Row ${row}, Column ${col} (${field}): Raw value = "${rawValue}", Type = ${typeof rawValue}`);
          
          if (field === 'property_type') {
            // Clean and standardize property type
            const cleanType = this.standardizePropertyType(rawValue, config.propertyTypeMapping);
            if (cleanType) {
              rowData[field] = cleanType;
              hasValidData = true;
              console.log(`✅ Property type: "${cleanType}"`);
            }
          } else if (field === 'year') {
            // Handle year field - parse as number but fallback to current year
            const yearValue = this.parseYearValue(rawValue);
            rowData[field] = yearValue;
            console.log(`✅ Year value: ${yearValue}`);
          } else {
            // Handle numeric fields with improved parsing
            const numValue = this.parseNumericValue(rawValue);
            if (numValue !== null && numValue !== undefined) {
              rowData[field] = numValue;
              hasValidData = true;
              console.log(`✅ Numeric value for ${field}: ${numValue}`);
            } else {
              console.log(`⚠️ Could not parse numeric value for ${field}: "${rawValue}"`);
              // Set to null instead of undefined to avoid database issues
              rowData[field] = null;
            }
          }
        });

        // Only add rows that have at least property type or numeric data
        if (hasValidData && (rowData.property_type || rowData.annual_budget || rowData.relative_budget || rowData.actual_collection)) {
          // Ensure all required fields exist (set to null if missing)
          rowData.annual_budget = rowData.annual_budget || null;
          rowData.relative_budget = rowData.relative_budget || null;
          rowData.actual_collection = rowData.actual_collection || null;
          
          // Ensure year exists - fallback to current year if not set
          if (!rowData.year) {
            rowData.year = currentYear;
          }
          
          // Calculate surplus/deficit (will be handled by database trigger, but calculate for logging)
          const actualCollection = rowData.actual_collection || 0;
          const relativeBudget = rowData.relative_budget || 0;
          rowData.surplus_deficit = actualCollection - relativeBudget;
          
          results.push(rowData);
          console.log(`✅ Added row ${row}:`, rowData);
        } else {
          console.log(`❌ Skipped row ${row} - no valid data found`);
        }
      } catch (error) {
        console.error(`Error processing row ${row}:`, error);
        // Continue processing other rows even if one fails
      }
    }

    console.log(`✅ Successfully parsed ${results.length} collection records`);
    return results;
  }

  /**
   * Standardize property type using mapping
   */
  private standardizePropertyType(value: any, mapping?: Record<string, string>): string | null {
    if (!value || typeof value !== 'string') return null;
    
    const cleanValue = value.trim();
    if (!cleanValue) return null;
    
    // Remove extra whitespace and normalize
    const normalizedValue = cleanValue.replace(/\s+/g, ' ');
    
    console.log(`Standardizing property type: "${normalizedValue}"`);
    
    // Use mapping if provided
    if (mapping) {
      // Try exact match first
      if (mapping[normalizedValue]) {
        console.log(`✅ Exact mapping match: "${normalizedValue}" -> "${mapping[normalizedValue]}"`);
        return mapping[normalizedValue];
      }
      
      // Try partial match
      const mapped = Object.entries(mapping).find(([key]) => 
        normalizedValue.includes(key) || key.includes(normalizedValue)
      );
      if (mapped) {
        console.log(`✅ Partial mapping match: "${normalizedValue}" -> "${mapped[1]}"`);
        return mapped[1];
      }
    }
    
    // Enhanced categorization with Hebrew keywords
    const lowerValue = normalizedValue.toLowerCase();
    
    // Residential (מגורים)
    if (lowerValue.includes('מגור') || 
        lowerValue.includes('דיר') || 
        lowerValue.includes('בית') || 
        lowerValue.includes('residential')) {
      console.log(`✅ Detected residential: "${normalizedValue}" -> "מגורים"`);
      return 'מגורים';
    }
    
    // Commercial (מסחר)
    if (lowerValue.includes('מסחר') || 
        lowerValue.includes('חנו') || 
        lowerValue.includes('מסעד') || 
        lowerValue.includes('commercial') ||
        lowerValue.includes('עסק')) {
      console.log(`✅ Detected commercial: "${normalizedValue}" -> "מסחר"`);
      return 'מסחר';
    }
    
    // Industrial (תעשיה)
    if (lowerValue.includes('תעשי') || 
        lowerValue.includes('מפעל') || 
        lowerValue.includes('בית חרושת') ||
        lowerValue.includes('industrial') ||
        lowerValue.includes('יצור')) {
      console.log(`✅ Detected industrial: "${normalizedValue}" -> "תעשיה"`);
      return 'תעשיה';
    }
    
    // Office (משרדים)
    if (lowerValue.includes('משרד') || 
        lowerValue.includes('office') ||
        lowerValue.includes('עורך דין') ||
        lowerValue.includes('רופא')) {
      console.log(`✅ Detected office: "${normalizedValue}" -> "משרדים"`);
      return 'משרדים';
    }
    
    // If none match, classify as "אחר"
    console.log(`⚠️ No match found for: "${normalizedValue}" -> "אחר"`);
    return 'אחר';
  }

  /**
   * Map domain value to standard domain types
   */
  private mapDomainValue(value: string): string {
    const domainMappings: Record<string, string> = {
      "מבני חינוך": "education_buildings",
      "חינוך": "education_buildings",
      "תשתיות": "infrastructure", 
      "תשתית": "infrastructure",
      "גנים ופארקים": "parks_gardens",
      "פארקים": "parks_gardens",
      "גנים": "parks_gardens",
      "נוף": "parks_gardens",
      "תרבות וספורט": "culture_sports",
      "תרבות": "culture_sports",
      "ספורט": "culture_sports",
      "ארגוני": "organizational",
      "ארגון": "organizational",
      "רווחה": "welfare"
    };

    const normalizedValue = value.trim();
    return domainMappings[normalizedValue] || "organizational";
  }

  /**
   * Map status value to standard status types
   */
  private mapStatusValue(value: string): string {
    const statusMappings: Record<string, string> = {
      "תכנון": "planning",
      "מאושר": "approved",
      "פעיל": "active", 
      "הושלם": "completed",
      "בוטל": "cancelled"
    };

    const normalizedValue = value.trim();
    return statusMappings[normalizedValue] || "planning";
  }

  /**
   * Map funding source value to standard funding source types
   */
  private mapFundingSourceValue(value: string): string {
    const fundingMappings: Record<string, string> = {
      "עיריה": "municipality",
      "מדינה": "municipality", // fallback to municipality
      "משרד החינוך": "education_ministry",
      "משרד הפנים": "interior_ministry", 
      "משרד התחבורה": "transportation_ministry",
      "משרד הבריאות": "health_ministry",
      "משרד הרווחה": "interior_ministry", // no welfare ministry enum, fallback
      "משרד התרבות": "culture_ministry",
      "משרד האנרגיה": "energy_ministry",
      "משרד החקלאות": "agriculture_ministry",
      "משרד הכלכלה": "economy_ministry",
      "משרד המדע": "science_technology_ministry",
      "משרד הבינוי": "construction_housing_ministry",
      "משרד להגנת הסביבה": "environmental_protection_ministry",
      "רשות התכנון": "planning_administration",
      "מפעל הפיס": "lottery",
      "קרן": "lottery", // fallback to lottery
      "תרומות": "municipality", // fallback to municipality
      "הלוואה": "loan",
      "אחר": "municipality" // fallback to municipality instead of "other"
    };

    const normalizedValue = value.trim();
    return fundingMappings[normalizedValue] || "municipality"; // default fallback
  }

  /**
   * Parse year value from various formats
   */
  private parseYearValue(value: any): number {
    const currentYear = new Date().getFullYear();
    
    // Handle null, undefined, or empty values - default to current year
    if (value === null || value === undefined || value === '') {
      return currentYear;
    }
    
    // If already a number, validate it's a reasonable year
    if (typeof value === 'number' && !isNaN(value)) {
      if (value >= 1900 && value <= currentYear + 10) {
        return Math.floor(value);
      }
      return currentYear;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Skip empty strings after trimming
      if (trimmed === '') return currentYear;
      
      // Try to extract year from string
      const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        if (year >= 1900 && year <= currentYear + 10) {
          return year;
        }
      }
      
      // Try direct number conversion
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 1900 && num <= currentYear + 10) {
        return num;
      }
    }
    
    // Fallback to current year
    console.log(`⚠️ Could not parse year value: "${value}", using current year ${currentYear}`);
    return currentYear;
  }

  /**
   * Parse numeric value from various formats
   */
  private parseNumericValue(value: any): number | null {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    // If already a number, return it
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      const trimmed = value.trim();
      
      // Skip empty strings after trimming
      if (trimmed === '') return null;
      
      // Skip text headers or labels (Hebrew text that shouldn't be numbers)
      if (trimmed.includes('תקציב') || 
          trimmed.includes('ארנונה') || 
          trimmed.includes('גביה') ||
          trimmed.includes('סכום') ||
          trimmed.includes('שנתי') ||
          trimmed.includes('יחסי') ||
          trimmed.includes('בפועל') ||
          trimmed.includes('נומינלי') ||
          trimmed.includes('תיאור') ||
          trimmed.includes('סוג') ||
          trimmed.includes('נכס')) {
        console.log(`Skipping text value: "${trimmed}"`);
        return null;
      }
      
      // Remove commas, spaces, currency symbols, and other formatting
      const cleaned = trimmed
        .replace(/[,\s₪$€£¥]/g, '') // Remove common currency symbols and formatting
        .replace(/[^\d.-]/g, ''); // Keep only digits, dots, and minus signs
      
      // If nothing left after cleaning, return null
      if (cleaned === '' || cleaned === '-' || cleaned === '.') {
        return null;
      }
      
      const num = parseFloat(cleaned);
      
      // Check if the result is a valid number
      if (isNaN(num) || !isFinite(num)) {
        console.log(`Could not parse numeric value from: "${value}" -> "${cleaned}"`);
        return null;
      }
      
      return num;
    }
    
    // For any other type, try to convert to number
    const num = Number(value);
    return isNaN(num) ? null : num;
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