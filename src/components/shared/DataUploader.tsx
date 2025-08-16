import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type UploadContext =
  | "finance"
  | "regular_budget"
  | "tabarim"
  | "education"
  | "engineering"
  | "welfare"
  | "non-formal"
  | "business"
  | "global";

interface DataUploaderProps {
  context?: UploadContext;
  onUploadSuccess?: () => void;
}

interface DebugLog {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  timestamp: Date;
}

function parseExcelByCellAddresses(sheet: any): { data: any[], summaryCards: any } {
  const results = [];
  
  // Define cell ranges for different categories
  const incomeRanges = [
    { names: 'A7:A11', budget: 'D7:D11', actual: 'F7:F11' },
    { names: 'A14:A19', budget: 'D14:D19', actual: 'F14:F19' },
    { names: 'A23:A24', budget: 'D23:D24', actual: 'F23:F24' }
  ];
  
  const expenseRanges = [
    { names: 'A27:A29', budget: 'D27:D29', actual: 'F27:F29' },
    { names: 'A32:A33', budget: 'D32:D33', actual: 'F32:F33' },
    { names: 'A35:A36', budget: 'D35:D36', actual: 'F35:F36' },
    { names: 'A41:A41', budget: 'D41:D41', actual: 'F41:F41' },
    { names: 'A44:A44', budget: 'D44:D44', actual: 'F44:F44' },
    { names: 'A49:A49', budget: 'D49:D49', actual: 'F49:F49' }
  ];
  
  // Helper function to get cell value
  const getCellValue = (cellAddress: string) => {
    const cell = sheet[cellAddress];
    return cell ? cell.v : null;
  };

  // Read summary cards data from specific cells
  const summaryCards = {
    plannedIncomeYearly: getCellValue('B25'), // הכנסות שנתי מתוכננות
    plannedIncomePeriod: getCellValue('D25'), // הכנסות לתקופה מתוכננות
    actualIncomePeriod: getCellValue('F25'), // הכנסות לתקופה בפועל
    incomeDeviation: getCellValue('J25'), // סטייה מהתקציב הכנסות (באחוזים)
    plannedExpensesYearly: getCellValue('B50'), // הוצאות שנתי מתוכננות
    plannedExpensesPeriod: getCellValue('D50'), // הוצאות לתקופה מתוכננות
    actualExpensesPeriod: getCellValue('F50'), // הוצאות לתקופה בפועל
    expensesDeviation: getCellValue('J50') // סטייה מהתקציב הוצאות (באחוזים)
  };
  
  // Helper function to expand range to individual cells
  const expandRange = (range: string): string[] => {
    const [start, end] = range.split(':');
    if (!end) return [start];
    
    const startCol = start.match(/[A-Z]+/)[0];
    const startRow = parseInt(start.match(/\d+/)[0]);
    const endCol = end.match(/[A-Z]+/)[0];
    const endRow = parseInt(end.match(/\d+/)[0]);
    
    const cells = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
        cells.push(String.fromCharCode(col) + row);
      }
    }
    return cells;
  };
  
  // Process income ranges
  incomeRanges.forEach(range => {
    const nameCells = expandRange(range.names);
    const budgetCells = expandRange(range.budget);
    const actualCells = expandRange(range.actual);
    
    nameCells.forEach((nameCell, index) => {
      const categoryName = getCellValue(nameCell);
      const budgetAmount = getCellValue(budgetCells[index]);
      const actualAmount = getCellValue(actualCells[index]);
      
      if (categoryName && String(categoryName).trim() !== '') {
        results.push({
          category_type: 'income',
          category_name: String(categoryName).trim(),
          budget_amount: budgetAmount ? Number(budgetAmount) : null,
          actual_amount: actualAmount ? Number(actualAmount) : null,
          excel_cell_ref: `${nameCell}, ${budgetCells[index]}, ${actualCells[index]}`,
          year: new Date().getFullYear()
        });
      }
    });
  });
  
  // Process expense ranges
  expenseRanges.forEach(range => {
    const nameCells = expandRange(range.names);
    const budgetCells = expandRange(range.budget);
    const actualCells = expandRange(range.actual);
    
    nameCells.forEach((nameCell, index) => {
      const categoryName = getCellValue(nameCell);
      const budgetAmount = getCellValue(budgetCells[index]);
      const actualAmount = getCellValue(actualCells[index]);
      
      if (categoryName && String(categoryName).trim() !== '') {
        results.push({
          category_type: 'expense',  
          category_name: String(categoryName).trim(),
          budget_amount: budgetAmount ? Number(budgetAmount) : null,
          actual_amount: actualAmount ? Number(actualAmount) : null,
          excel_cell_ref: `${nameCell}, ${budgetCells[index]}, ${actualCells[index]}`,
          year: new Date().getFullYear()
        });
      }
    });
  });
  
  return { data: results, summaryCards };
}

// Very lightweight header-based classifier - now enhanced with cell address parsing
function detectTarget(headers: string[], ctx: UploadContext): { table: string | null; reason: string } {
  const h = headers.map((s) => s.toLowerCase());

  const hasAny = (...keys: string[]) => keys.some((k) => h.includes(k));
  const hasWords = (...words: string[]) => words.some((w) => h.some((x) => x.includes(w)));

  // Business licenses
  if (
    ctx === "business" ||
    hasWords("license", "רישיון", "מספר רישיון") ||
    hasWords("business", "שם עסק") ||
    hasWords("expires", "פקיעה", "תוקף")
  ) {
    return { table: "licenses", reason: "זוהה מבנה רישוי עסקים" };
  }

  // Engineering plans
  if (
    ctx === "engineering" ||
    hasWords("plan", 'תב"ע', "מספר תוכנית") ||
    hasWords("land_use", "ייעוד")
  ) {
    return { table: "plans", reason: "זוהה מבנה תוכניות הנדסה" };
  }

  // Education institutions
  if (
    ctx === "education" ||
    hasWords("institution", "מוסד") ||
    hasWords("students", "תלמידים") ||
    hasWords("classes", "כיתות") ||
    hasWords("level", "שלב")
  ) {
    return { table: "institutions", reason: "זוהה מבנה מוסדות חינוך" };
  }

  // Finance regular budget - Enhanced detection with more Hebrew variations
  if (
    ctx === "finance" ||
    ctx === "regular_budget" ||
    hasWords("קטגוריה", "category", "סעיף", "פריט", "פרט", "תיאור") ||
    hasWords("תקציב מאושר", "budget_amount", "תקציב", "מאושר", "תקציב שנתי") ||
    hasWords("ביצוע בפועל", "actual_amount", "ביצוע", "בפועל", "ביצוע שנתי") ||
    hasWords("הכנסה", "income", "הוצאה", "expense", "הכנסות", "הוצאות") ||
    hasWords("ארנונה", "אגרת", "היטל", "מענק", "קנס", "רישיון") ||
    hasWords("סכום", "כסף", "שח", "₪", "מיליון", "אלף") ||
    hasAny("f7", "f8", "f9", "f10", "f11", "g7", "g8", "h7", "h8") // Excel cell references for budget
  ) {
    return { table: "regular_budget", reason: "זוהה מבנה תקציב רגיל" };
  }

  // Finance tabarim
  if (
    ctx === "tabarim" ||
    hasWords('תב"ר', "tabar") ||
    hasWords("תחום", "domain") ||
    hasWords("מקור תקציבי", "funding_source")
  ) {
    return { table: "tabarim", reason: 'זוהה מבנה תב"רים' };
  }

  // Finance projects / grants (but not if already detected as regular_budget)
  if (
    hasWords("project", 'תב"ר') ||
    hasWords("budget", "תקציב")
  ) {
    return { table: "projects", reason: 'זוהה מבנה פרויקטים/תב"ר' };
  }
  if (hasWords("grant", "מענק", "קול קורא", "משרד")) {
    return { table: "grants", reason: "זוהה מבנה מענקים" };
  }

  // Welfare
  if (
    ctx === "welfare" ||
    hasWords("service_type", "שירות", "ילדים בסיכון", "מוגבלות", "קשישים")
  ) {
    return { table: "welfare_services", reason: "זוהה מבנה שירותי רווחה" };
  }

  // Non formal activities
  if (
    ctx === "non-formal" ||
    hasWords("activity", "פעילות") ||
    hasWords("program", "תוכנית") ||
    hasWords("age_group", "גיל") ||
    hasWords("participants", "משתתפים")
  ) {
    return { table: "activities", reason: "זוהה מבנה פעילויות חינוך בלתי פורמאלי" };
  }

  return { table: null, reason: "לא זוהה מבנה נתונים מוכר" };
}

function normalizeKey(k: string, debugLogs?: DebugLog[]): string {
  const key = k.trim();
  
  const addLog = (type: DebugLog['type'], message: string, details?: any) => {
    if (debugLogs) {
      debugLogs.push({
        id: Math.random().toString(),
        type,
        message,
        details,
        timestamp: new Date()
      });
    }
  };
  
  addLog('info', `מנרמל מפתח: "${key}"`);
  
  const map: Record<string, string> = {
    // Common Hebrew -> English  
    "מספר רישיון": "license_number",
    "שם עסק": "business_name",
    "בעל העסק": "owner",
    "כתובת": "address",
    "סוג רישיון": "type",
    "סטטוס": "status",
    "תוקף": "expires_at",
    "תאריך פקיעה": "expires_at",

    // Regular budget mapping - Hebrew terms
    "קטגוריה": "category_name",
    "שם קטגוריה": "category_name",
    "שם הקטגוריה": "category_name",
    "תיאור": "category_name",
    "פריט": "category_name",
    "פרט": "category_name",
    "סעיף": "category_name",
    "שם": "category_name",
    "שם הסעיף": "category_name",
    "סוג קטגוريה": "category_type",
    "סוג": "category_type",
    "הכנסה": "income",
    "הוצאה": "expense",
    "הכנסות": "income",
    "הוצאות": "expense",
    "תקציב מאושר": "budget_amount",
    "תקציב": "budget_amount",
    "מאושר": "budget_amount", 
    "תקציב שנתי": "budget_amount",
    "תקציב 2025": "budget_amount",
    "תקציב 2024": "budget_amount",
    "סכום מאושר": "budget_amount",
    "סכום תקציב": "budget_amount",
    "ביצוע בפועל": "actual_amount",
    "ביצוע": "actual_amount",
    "בפועל": "actual_amount",
    "ביצוע שנתי": "actual_amount", 
    "ביצוע 2025": "actual_amount",
    "ביצוע 2024": "actual_amount",
    "סכום בפועל": "actual_amount",
    "סכום ביצוע": "actual_amount",
    "תא באקסל": "excel_cell_ref",
    "תא": "excel_cell_ref",
    "תא אקסל": "excel_cell_ref",
    "מיקום תא": "excel_cell_ref",
    "שנה": "year",
    "שנת תקציב": "year",

    // Tabarim mapping
    'מספר תב"ר': "tabar_number",
    'שם תב"ר': "tabar_name",
    "תחום": "domain",
    "מקור תקציבי": "funding_source1",
    "מקור תקציב ראשון": "funding_source1",
    "מקור תקציבי 2": "funding_source2",
    "מקור תקציב 2": "funding_source2",
    "מקור תקציבי 3": "funding_source3",
    "מקור תקציב 3": "funding_source3",
    "ביצוע מצטבר הכנסות": "income_actual",
    "ביצוע מצטבר הוצאות": "expense_actual",
    "עודף/גרעון": "surplus_deficit",

    "מספר תוכנית": "plan_number",
    "שם תוכנית": "name",
    "אזור": "address",
    "ייעוד": "land_use",
    "שטח": "area",

    "שם מוסד": "name",
    "שלב": "level",
    "תלמידים": "students",
    "כיתות": "classes",
    "תפוסה": "occupancy",

    "שם פרויקט": "name",
    "מקור מימון פרויקט": "funding_source",

    "שירות": "service_type",
    "מקבלי שירות": "recipients",
    "רשימת המתנה": "waitlist",
    "ניצול": "utilization",

    "שם פעילות": "name",
    "תוכנית": "program",
    "קטגוריית פעילות": "category",
    "קבוצת גיל": "age_group",
    "משתתפים": "participants",
    "מיקום": "location",
    "תאריך": "scheduled_at",
  };

  // First try exact match
  if (map[key]) {
    addLog('success', `התאמה מדויקת: "${key}" -> "${map[key]}"`);
    return map[key];
  }

  // Try case insensitive match
  const lowerKey = key.toLowerCase();
  for (const [hebrewKey, englishValue] of Object.entries(map)) {
    if (hebrewKey.toLowerCase() === lowerKey) {
      addLog('success', `התאמה ללא רגישות לגודל אותיות: "${key}" -> "${englishValue}"`);
      return englishValue;
    }
  }

  // Enhanced Hebrew terms recognition
  if (key.includes('תקציב') && !key.includes('ביצוע')) {
    addLog('info', `מכיל "תקציב" -> "budget_amount"`);
    return 'budget_amount';
  }
  if (key.includes('ביצוע') || key.includes('בפועל') || key.includes('מבוצע')) {
    addLog('info', `מכיל "ביצוע/בפועל/מבוצע" -> "actual_amount"`);
    return 'actual_amount';
  }
  if (key.includes('קטגוריה') || key.includes('סעיף') || key.includes('שם') || key.includes('תיאור') || key.includes('פריט')) {
    addLog('info', `מכיל מונח מזהה קטגוריה -> "category_name"`);
    return 'category_name';
  }
  if (key.includes('סכום') || key.includes('כסף') || key.includes('₪') || key.includes('שח')) {
    addLog('warning', `מכיל מונח כספי, אבל לא ברור אם תקציב או ביצוע -> "budget_amount"`);
    return 'budget_amount';
  }

  // Fallback
  const fallback = key.replace(/\s+/g, "_");
  addLog('warning', `לא נמצאה התאמה, משתמש בחלופה: "${key}" -> "${fallback}"`);
  return fallback;
}

function mapRowToTable(table: string, row: Record<string, any>, debugLogs?: DebugLog[]) {
  const addLog = (type: DebugLog['type'], message: string, details?: any) => {
    if (debugLogs) {
      debugLogs.push({
        id: Math.random().toString(),
        type,
        message,
        details,
        timestamp: new Date()
      });
    }
  };

  // Normalize keys
  const norm: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    const nk = normalizeKey(String(k), debugLogs);
    norm[nk] = row[k];
  });

  switch (table) {
    case "regular_budget":
      addLog('info', 'מעבד שורת תקציב רגיל');
      addLog('info', `מפתחות מקוריים: ${Object.keys(row).join(', ')}`);
      addLog('info', `ערכים לדוגמה: ${Object.values(row).slice(0, 3).join(', ')}`);
      
      const keyMappings = Object.keys(row).map(k => ({
        original: k,
        normalized: normalizeKey(k, debugLogs)
      }));
      addLog('info', 'מיפוי מפתחות:', keyMappings);
      
      // Check for meaningful content - be more lenient
      const meaningfulFields = ['category_name', 'name', 'budget_amount', 'actual_amount'];
      const validFields = meaningfulFields.filter(field => {
        const value = norm[field];
        const isValidValue = value !== null && value !== undefined && value !== "" && String(value).trim() !== "";
        if (isValidValue) {
          addLog('success', `נמצא נתון משמעותי בשדה "${field}": "${value}"`);
        }
        return isValidValue;
      });
      
      // Also check if we have any data in the original row that could be useful
      const hasAnyData = Object.values(row).some(v => 
        v !== null && v !== undefined && v !== "" && String(v).trim() !== ""
      );
      
      if (validFields.length === 0 && !hasAnyData) {
        addLog('warning', 'שורה נדחתה: לא נמצאו נתונים משמעותיים');
        return null;
      }
      
      addLog('success', `שדות תקינים: ${validFields.join(', ')}`);
      
      // Helper function to parse numbers safely
      const parseNumber = (val: any, fieldName: string) => {
        if (val === null || val === undefined || val === '') {
          addLog('info', `${fieldName}: ערך ריק`);
          return null;
        }
        
        // Handle different number formats
        let numStr = String(val).replace(/,/g, '').replace(/₪/g, '').replace(/שח/g, '').trim();
        
        // Handle negative numbers in parentheses: (1000) -> -1000
        if (numStr.match(/^\(.*\)$/)) {
          numStr = '-' + numStr.replace(/[()]/g, '');
        }
        
        const num = Number(numStr);
        const result = isNaN(num) ? null : num;
        
        if (result !== null) {
          addLog('success', `${fieldName}: פוענח בהצלחה "${val}" -> ${result}`);
        } else {
          addLog('warning', `${fieldName}: לא ניתן לפענח "${val}"`);
        }
        
        return result;
      };
      
      // Determine category type more intelligently
      let categoryType = 'expense'; // default
      if (norm.category_type) {
        categoryType = norm.category_type === 'income' || norm.category_type === 'הכנסה' ? 'income' : 'expense';
      } else if (norm.income || String(norm.category_name || norm.name || '').match(/הכנס|ארנונה|אגרת|היטל|קנס|רישיון|מענק/)) {
        categoryType = 'income';
      }
      
      // Get meaningful category name
      const categoryName = norm.category_name || norm.name || 
                          Object.keys(row).find(k => k !== 'category_type' && row[k] && String(row[k]).trim().length > 2) || 
                          'פריט תקציבי';
      
      const result = {
        category_type: categoryType,
        category_name: categoryName,
        budget_amount: parseNumber(norm.budget_amount, 'תקציב'),
        actual_amount: parseNumber(norm.actual_amount, 'ביצוע'),
        excel_cell_ref: norm.excel_cell_ref,
        year: norm.year ? Number(norm.year) : new Date().getFullYear(),
      };
      
      addLog('success', `שורה מעובדת בהצלחה: ${categoryName}`, result);
      return result;
    case "tabarim":
      return {
        tabar_number: norm.tabar_number,
        tabar_name: norm.tabar_name || norm.name,
        domain: norm.domain,
        funding_source1: norm.funding_source1 || norm.funding_source,
        funding_source2: norm.funding_source2,
        funding_source3: norm.funding_source3,
        approved_budget: norm.approved_budget ? Number(norm.approved_budget) : null,
        income_actual: norm.income_actual ? Number(norm.income_actual) : null,
        expense_actual: norm.expense_actual ? Number(norm.expense_actual) : null,
        surplus_deficit: norm.surplus_deficit ? Number(norm.surplus_deficit) : null,
        status: norm.status || 'planning',
      };
    case "licenses":
      return {
        license_number: norm.license_number || norm.license || norm.id,
        business_name: norm.business_name || norm.name,
        owner: norm.owner,
        address: norm.address,
        type: norm.type,
        status: norm.status,
        expires_at: norm.expires_at ? new Date(norm.expires_at) : null,
        lat: norm.lat ?? null,
        lng: norm.lng ?? null,
      };
    case "plans":
      return {
        plan_number: norm.plan_number || norm.id || norm.code,
        name: norm.name,
        address: norm.address,
        block: norm.block,
        parcel: norm.parcel,
        status: norm.status,
        land_use: norm.land_use || norm.use,
        area: norm.area ? Number(norm.area) : null,
        lat: norm.lat ?? null,
        lng: norm.lng ?? null,
      };
    case "institutions":
      return {
        name: norm.name,
        level: norm.level,
        students: norm.students ? Number(norm.students) : null,
        classes: norm.classes ? Number(norm.classes) : null,
        occupancy: norm.occupancy ? Number(norm.occupancy) : null,
        address: norm.address,
        lat: norm.lat ?? null,
        lng: norm.lng ?? null,
      };
    case "projects":
      return {
        code: norm.code || norm.project || norm.id,
        name: norm.name || norm.title,
        department: norm.department,
        domain: norm.domain,
        funding_source: norm.funding_source,
        budget_approved: norm.budget_approved ? Number(norm.budget_approved) : null,
        budget_executed: norm.budget_executed ? Number(norm.budget_executed) : null,
        status: norm.status,
        progress: norm.progress ? Number(norm.progress) : null,
      };
    case "grants":
      return {
        name: norm.name || norm.grant,
        ministry: norm.ministry || norm.ministry_name,
        amount: norm.amount ? Number(norm.amount) : null,
        status: norm.status,
        submitted_at: norm.submitted_at ? new Date(norm.submitted_at) : null,
        decision_at: norm.decision_at ? new Date(norm.decision_at) : null,
      };
    case "welfare_services":
      return {
        service_type: norm.service_type || norm.service,
        recipients: norm.recipients ? Number(norm.recipients) : null,
        budget_allocated: norm.budget_allocated ? Number(norm.budget_allocated) : null,
        utilization: norm.utilization ? Number(norm.utilization) : null,
        waitlist: norm.waitlist ? Number(norm.waitlist) : null,
        period: norm.period,
      };
    case "activities":
      return {
        program: norm.program,
        name: norm.name,
        category: norm.category,
        age_group: norm.age_group,
        participants: norm.participants ? Number(norm.participants) : null,
        scheduled_at: norm.scheduled_at ? new Date(norm.scheduled_at) : null,
        location: norm.location,
        status: norm.status,
      };
    default:
      return {};
  }
}

export function DataUploader({ context = "global", onUploadSuccess }: DataUploaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [detected, setDetected] = useState<{ table: string | null; reason: string }>({ table: null, reason: "" });
  const [busy, setBusy] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [headers, setHeaders] = useState<string[]>([]);

  const onFile = async (f: File) => {
    setFile(f);
    setDebugLogs([]);
    const logs: DebugLog[] = [];
    
    const addLog = (type: DebugLog['type'], message: string, details?: any) => {
      logs.push({
        id: Math.random().toString(),
        type,
        message,
        details,
        timestamp: new Date()
      });
    };

    try {
      addLog('info', `קורא קובץ: ${f.name}`);
      
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const first = wb.SheetNames[0];
      const sheet = wb.Sheets[first];
      
      // Check if this should be parsed by cell addresses (for regular budget)
      if (context === 'regular_budget' || context === 'finance') {
        addLog('info', 'משתמש בפענוח ישיר לפי כתובות תאים');
        const result = parseExcelByCellAddresses(sheet);
        const { data, summaryCards } = result;
        addLog('success', `נמצאו ${data.length} פריטי תקציב`);
        
        // Store summary cards in localStorage for the regular budget page
        if (summaryCards) {
          localStorage.setItem('regular_budget_summary', JSON.stringify(summaryCards));
          addLog('info', 'נתוני סיכום נשמרו:', summaryCards);
        }
        
        setRows(data);
        setHeaders(['category_name', 'category_type', 'budget_amount', 'actual_amount']);
        setDetected({ table: 'regular_budget', reason: 'פענוח ישיר לפי כתובות תאים' });
        
        // Log sample of parsed data
        if (data.length > 0) {
          addLog('info', 'דוגמת נתונים שנמצאו:', data.slice(0, 3));
        }
        
        setDebugLogs(logs);
        toast({ title: "קובץ נטען בהצלחה", description: `${data.length} פריטי תקציב נמצאו` });
        return;
      }
      
      // Fallback to the original method for other contexts
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
      addLog('success', `נקראו ${data.length} שורות מהקובץ`);
      
      setRows(data);
      
      const extractedHeaders = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];
      const finalHeaders = extractedHeaders || Object.keys(data[0] || {});
      setHeaders(finalHeaders);
      
      addLog('info', `זוהו כותרות: ${finalHeaders.join(', ')}`);
      
      // Test the normalization process
      if (data[0]) {
        addLog('info', 'בודק נרמול כותרות:');
        Object.keys(data[0]).forEach(key => {
          const normalized = normalizeKey(key, logs);
        });
      }
      
      const d = detectTarget(finalHeaders, context);
      setDetected(d);
      
      addLog(d.table ? 'success' : 'warning', d.reason);
      addLog('info', `השלמת ניתוח הקובץ`);
      
      setDebugLogs(logs);
      toast({ title: "קובץ נטען בהצלחה", description: `${data.length} שורות. ${d.reason}` });
    } catch (e: any) {
      addLog('error', `שגיאה בקריאת הקובץ: ${e.message}`);
      setDebugLogs(logs);      
      toast({ title: "שגיאה בקריאת הקובץ", description: e.message, variant: "destructive" });
    }
  };

  const uploadAndIngest = async () => {
    if (!file || rows.length === 0) return;
    if (!detected.table) {
      toast({ title: "לא זוהה יעד מתאים", description: "עדכן כותרות עמודות או בחר קובץ אחר", variant: "destructive" });
      return;
    }

    setBusy(true);
    try {
      // Check for user - either from session or demo user
      let userId = user?.id;
      
      if (!userId) {
        const { data: sessionRes } = await supabase.auth.getSession();
        userId = sessionRes.session?.user?.id;
      }
      
      if (!userId) {
        toast({
          title: "נדרש חיבור למערכת",
          description: "יש להתחבר תחילה כדי להעלות נתונים. לחץ על 'התחבר' בפינה העליונה של הדף",
          variant: "destructive",
        });
        setBusy(false);
        return;
      }

      // All users now use real database - no demo user logic needed

      // Upload raw file to storage for traceability
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("uploads").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
      if (upErr) console.warn("upload warn:", upErr.message);

      // Map and insert
      const inferDept = (table: string, ctx: UploadContext): 'finance' | 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business' | null => {
        if (ctx && ctx !== 'global') {
          switch (ctx) {
            case 'regular_budget':
            case 'tabarim':
            case 'finance':
              return 'finance';
            default:
              return ctx as any;
          }
        }
        switch (table) {
          case 'regular_budget':
          case 'tabarim':
          case 'projects':
          case 'grants':
            return 'finance';
          case 'institutions':
            return 'education';
          case 'plans':
            return 'engineering';
          case 'welfare_services':
            return 'welfare';
          case 'activities':
            return 'non-formal';
          case 'licenses':
            return 'business';
          default:
            return null;
        }
      };

      const deptSlug = inferDept(detected.table!, context);
      const processingLogs: DebugLog[] = [];
      
      const addProcessingLog = (type: DebugLog['type'], message: string, details?: any) => {
        processingLogs.push({
          id: Math.random().toString(),
          type,
          message,
          details,
          timestamp: new Date()
        });
      };

      // For regular budget with direct cell parsing, skip complex mapping
      if (context === 'regular_budget' && detected.table === 'regular_budget' && rows[0]?.category_name) {
        addProcessingLog('info', 'משתמש בנתונים מעובדים מכתובות תאים');
        
        const mapped = rows.map((row, index) => ({
          ...row,
          user_id: userId
        }));
        
        addProcessingLog('success', `עובדו ${mapped.length} פריטי תקציב`);
        setDebugLogs([...debugLogs, ...processingLogs]);
        
        // Clear existing data and insert new data
        const targetTableName = 'regular_budget';
        if (targetTableName === "regular_budget") {
          const { error: deleteError } = await supabase
            .from('regular_budget')
            .delete()
            .eq('user_id', userId);

          if (deleteError) {
            addProcessingLog('warning', `שגיאה במחיקת נתונים קיימים: ${deleteError.message}`);
          } else {
            addProcessingLog('success', 'נתונים קיימים נמחקו בהצלחה');
          }
        }
        
        addProcessingLog('info', `מכניס ${mapped.length} שורות לטבלה ${targetTableName}`);
        const { error } = await supabase.from(targetTableName).insert(mapped as any);
        if (error) throw error;

        await supabase.from("ingestion_logs").insert({
          user_id: userId,
          source_file: path,
          table_name: detected.table,
          rows: mapped.length,
          status: "success",
        });

        addProcessingLog('success', `הנתונים נקלטו בהצלחה! ${mapped.length} שורות`);
        setDebugLogs([...debugLogs, ...processingLogs]);
        
        toast({ title: "הנתונים נקלטו בהצלחה", description: `${mapped.length} פריטי תקציב` });
        
        onUploadSuccess?.();
        setFile(null);
        setRows([]);
        setDetected({ table: null, reason: "" });
        setHeaders([]);
        setBusy(false);
        return;
      }

      const mapped = rows.map((r, index) => {
        addProcessingLog('info', `מעבד שורה ${index + 1}`);
        const mappedRow = mapRowToTable(detected.table!, r, processingLogs);
        
        // Skip null rows (invalid data)
        if (mappedRow === null) {
          addProcessingLog('warning', `שורה ${index + 1} דולגה - אין נתונים תקינים`);
          return null;
        }
        
        const result = { 
          ...mappedRow, 
          user_id: userId,
          // Only add department_slug for tables that have this column
          ...(deptSlug && detected.table !== 'regular_budget' ? { department_slug: deptSlug } : {})
        };
        
        addProcessingLog('success', `שורה ${index + 1} עובדה בהצלחה`);
        return result;
      }).filter(row => row !== null); // Remove null rows first
      
      addProcessingLog('info', `לאחר מיפוי: ${mapped.length} שורות תקינות`);
      
      // More lenient filtering - only filter out rows that are completely empty
      const filtered = mapped.filter((obj) => {
        // For regular_budget, check if we have at least category_name or meaningful amounts
        if (detected.table === 'regular_budget') {
          const budgetObj = obj as any;
          const hasCategory = budgetObj.category_name && budgetObj.category_name !== 'ללא שם' && budgetObj.category_name.trim() !== '';
          const hasBudget = budgetObj.budget_amount !== null && budgetObj.budget_amount !== undefined;
          const hasActual = budgetObj.actual_amount !== null && budgetObj.actual_amount !== undefined;
          const isValid = hasCategory || hasBudget || hasActual;
          
          if (!isValid) {
            addProcessingLog('warning', `שורת תקציב נדחתה - קטגוריה: "${budgetObj.category_name}", תקציב: ${budgetObj.budget_amount}, ביצוע: ${budgetObj.actual_amount}`);
          }
          return isValid;
        }
        
        // For other tables, use the original logic
        const hasContent = Object.values(obj).some((v) => v !== null && v !== undefined && v !== "");
        if (!hasContent) {
          addProcessingLog('warning', 'שורה נדחתה - אין תוכן');
        }
        return hasContent;
      });
      
      addProcessingLog('info', `לאחר סינון סופי: ${filtered.length} שורות תקינות`);
      setDebugLogs([...debugLogs, ...processingLogs]);

      if (filtered.length === 0) {
        addProcessingLog('error', 'לא נמצאו נתונים תקינים לייבוא');
        setDebugLogs([...debugLogs, ...processingLogs]);
        toast({ title: "אין נתונים לשיבוץ", description: "בדוק/י את הקובץ והכותרות בתצוגת הדיבוג", variant: "destructive" });
        setBusy(false);
        return;
      }

      const tableName = detected.table as 'regular_budget' | 'tabarim' | 'licenses' | 'plans' | 'institutions' | 'projects' | 'grants' | 'welfare_services' | 'activities';
      
      // For regular_budget table, delete existing data first to replace with new data
      if (tableName === "regular_budget") {
        addProcessingLog('info', 'מוחק נתוני תקציב קיימים');
        const { error: deleteError } = await supabase
          .from('regular_budget')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          addProcessingLog('warning', `שגיאה במחיקת נתונים קיימים: ${deleteError.message}`);
        } else {
          addProcessingLog('success', 'נתונים קיימים נמחקו בהצלחה');
        }
      }

      addProcessingLog('info', `מכניס ${filtered.length} שורות לטבלה ${tableName}`);
      const { error } = await supabase.from(tableName).insert(filtered as any);
      if (error) throw error;

      await supabase.from("ingestion_logs").insert({
        user_id: userId,
        source_file: path,
        table_name: detected.table,
        rows: filtered.length,
        status: "success",
      });

      addProcessingLog('success', `הנתונים נקלטו בהצלחה! ${filtered.length} שורות`);
      setDebugLogs([...debugLogs, ...processingLogs]);
      
      toast({ title: "הנתונים נקלטו בהצלחה", description: `${filtered.length} שורות אל הטבלה ${detected.table}` });
      
      // Call success callback to refresh parent component
      onUploadSuccess?.();
      
      setFile(null);
      setRows([]);
      setDetected({ table: null, reason: "" });
      setHeaders([]);
    } catch (e: any) {
      const errorLogs: DebugLog[] = [{
        id: Math.random().toString(),
        type: 'error',
        message: `שגיאה קריטית בייבוא: ${e.message}`,
        details: e,
        timestamp: new Date()
      }];
      setDebugLogs([...debugLogs, ...errorLogs]);
      toast({ title: "שגיאה בקליטת נתונים", description: e.message || "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const getLogIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">ייבוא נתונים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx"
              onChange={(e) => e.target.files && onFile(e.target.files[0])}
            />
            {file && <Badge variant="secondary">{file.name}</Badge>}
          </div>

          {detected.table && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                יעד מזוהה: <span className="font-medium">{detected.table}</span> · {detected.reason}
              </AlertDescription>
            </Alert>
          )}

          {rows.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <p>תצוגה מקדימה: {rows.length} שורות</p>
              {headers.length > 0 && (
                <p>כותרות: {headers.slice(0, 5).join(', ')}{headers.length > 5 ? '...' : ''}</p>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            {debugLogs.length > 0 && (
              <Collapsible open={showDebug} onOpenChange={setShowDebug}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ChevronDown className="h-4 w-4 mr-1" />
                    תצוגת דיבוג ({debugLogs.length})
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            )}
            <Button onClick={uploadAndIngest} disabled={busy || !file}>
              {busy ? "מייבא..." : "ייבוא ושיבוץ"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {debugLogs.length > 0 && (
        <Collapsible open={showDebug} onOpenChange={setShowDebug}>
          <CollapsibleContent>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">לוג עיבוד הקובץ</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-2">
                    {debugLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`flex items-start gap-2 p-2 rounded-md text-sm ${
                          log.type === 'error' ? 'bg-red-50 border border-red-200' :
                          log.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                          log.type === 'success' ? 'bg-green-50 border border-green-200' :
                          'bg-blue-50 border border-blue-200'
                        }`}
                      >
                        {getLogIcon(log.type)}
                        <div className="flex-1">
                          <p className="font-medium">{log.message}</p>
                          {log.details && (
                            <pre className="text-xs mt-1 overflow-x-auto bg-white/50 p-1 rounded">
                              {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.timestamp.toLocaleTimeString('he-IL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {rows.length > 0 && showDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">תצוגה מקדימה של הנתונים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">כותרות הקובץ:</h4>
                <div className="flex flex-wrap gap-1">
                  {headers.map((header, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">3 שורות ראשונות:</h4>
                <ScrollArea className="h-40 w-full">
                  <pre className="text-xs bg-muted p-2 rounded">
                    {JSON.stringify(rows.slice(0, 3), null, 2)}
                  </pre>
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
