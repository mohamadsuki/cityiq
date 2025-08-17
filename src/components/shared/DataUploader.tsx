import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle, CheckCircle2, Info } from "lucide-react";

type UploadContext = 'education' | 'engineering' | 'welfare' | 'non-formal' | 'business' | 'global' | 'regular_budget' | 'finance' | 'collection' | 'tabarim';

interface DataUploaderProps {
  context?: UploadContext;
  onUploadSuccess?: () => void;
}

interface DebugLog {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  timestamp: Date;
}

interface ImportOption {
  mode: 'replace' | 'append';
  confirmed: boolean;
}

const parseCollectionExcelByCellAddresses = (sheet: any) => {
  console.log('📊 parseCollectionExcelByCellAddresses called');
  
  // This is a simplified version - the full implementation would be in the ExcelCellReader
  const data: any[] = [];
  const summaryCards: any = {};
  
  try {
    // Get the raw data from the sheet
    const rawData = XLSX.utils.sheet_to_json(sheet);
    console.log('📊 Raw collection data:', rawData);
    
    // Basic parsing for collection data
    rawData.forEach((row: any, index: number) => {
      if (row && typeof row === 'object') {
        const parsedRow = {
          property_type: row['סוג נכס'] || row['property_type'] || '',
          annual_budget: parseFloat(row['תקציב שנתי'] || row['annual_budget'] || '0') || 0,
          relative_budget: parseFloat(row['תקציב יחסי'] || row['relative_budget'] || '0') || 0,
          actual_collection: parseFloat(row['גביה בפועל'] || row['actual_collection'] || '0') || 0
        };
        
        if (parsedRow.property_type) {
          data.push(parsedRow);
        }
      }
    });
    
    console.log('📊 Parsed collection data:', data);
    
  } catch (error) {
    console.error('❌ Error parsing collection data:', error);
  }
  
  return { data, summaryCards };
};

const detectTarget = (headers: string[], ctx: UploadContext) => {
  console.log('🎯 detectTarget called with headers:', headers, 'context:', ctx);
  
  // Context-based detection first
  if (ctx === 'tabarim') {
    return { table: 'tabarim', reason: 'זוהה כנתוני תב"רים על בסיס הקונטקסט' };
  }
  
  if (ctx === 'education') {
    return { table: 'institutions', reason: 'זוהה כנתוני חינוך על בסיס הקונטקסט' };
  }
  
  if (ctx === 'engineering') {
    return { table: 'engineering_plans', reason: 'זוהה כנתוני הנדסה על בסיס הקונטקסט' };
  }
  
  if (ctx === 'welfare') {
    return { table: 'welfare_services', reason: 'זוהה כנתוני רווחה על בסיס הקונטקסט' };
  }
  
  if (ctx === 'non-formal') {
    return { table: 'non_formal_activities', reason: 'זוהה כנתוני חינוך בלתי פורמלי על בסיס הקונטקסט' };
  }
  
  if (ctx === 'business') {
    return { table: 'business_licenses', reason: 'זוהה כנתוני עסקים על בסיס הקונטקסט' };
  }
  
  if (ctx === 'regular_budget' || ctx === 'finance') {
    return { table: 'regular_budget', reason: 'זוהה כנתוני תקציב רגיל על בסיס הקונטקסט' };
  }
  
  if (ctx === 'collection') {
    return { table: 'collection_data', reason: 'זוהה כנתוני גביה על בסיס הקונטקסט' };
  }
  
  // Header-based detection as fallback
  const headerStr = headers.join(' ').toLowerCase();
  
  // Check for tabarim-specific keywords
  if (headerStr.includes('תב"ר') || headerStr.includes('תקציב בלתי רגיל') || headerStr.includes('התקבולים והתשלומים')) {
    return { table: 'tabarim', reason: 'זוהה על בסיס כותרות תב"רים' };
  }
  
  if (headerStr.includes('institution') || headerStr.includes('מוסד')) {
    return { table: 'institutions', reason: 'זוהה על בסיס כותרות מוסדות חינוך' };
  }
  
  if (headerStr.includes('license') || headerStr.includes('רישיון')) {
    return { table: 'business_licenses', reason: 'זוהה על בסיס כותרות רישיונות עסק' };
  }
  
  return { table: null, reason: 'לא זוהה סוג נתונים מתאים' };
};

const normalizeKey = (k: string, debugLogs?: DebugLog[]) => {
  const original = k;
  let normalized = k.toLowerCase().trim();
  
  // Hebrew to English mappings
  const mappings: Record<string, string> = {
    // Institution fields
    'שם המוסד': 'institution_name',
    'כתובת': 'address',
    'טלפון': 'phone',
    'סוג המוסד': 'institution_type',
    
    // Business license fields  
    'שם העסק': 'business_name',
    'בעל הרישיון': 'license_holder',
    'מספר רישיון': 'license_number',
    'סוג הרישיון': 'license_type',
    'תאריך הנפקה': 'issue_date',
    'תאריך תפוגה': 'expiry_date',
    'סטטוס': 'status',
    
    // Budget fields
    'קטגוריה': 'category_name',
    'סוג': 'category_type',
    'תקציב': 'budget_amount',
    'ביצוע': 'actual_amount',
    
    // Collection fields
    'סוג נכס': 'property_type',
    'תקציב שנתי': 'annual_budget',
    'תקציב יחסי': 'relative_budget',
    'גביה בפועל': 'actual_collection',
    
    // Tabarim fields
    'שם תב"ר': 'tabar_name',
    'מספר תב"ר': 'tabar_number',
    'תחום': 'domain',
    'תחום פעילות': 'domain',
    'מקור מימון': 'funding_source1',
    'מקור מימון 1': 'funding_source1',
    'תקציב מאושר': 'approved_budget',
    'הכנסות בפועל': 'income_actual',
    'הוצאות בפועל': 'expense_actual'
  };
  
  if (mappings[original]) {
    normalized = mappings[original];
    if (debugLogs) {
      debugLogs.push({
        id: Math.random().toString(),
        type: 'info',
        message: `מיפוי כותרת: "${original}" → "${normalized}"`,
        timestamp: new Date()
      });
    }
  }
  
  return normalized;
};

const mapRowToTable = (table: string, row: Record<string, any>, debugLogs?: DebugLog[]) => {
  console.log(`🗂️ mapRowToTable called for table: ${table}`, row);
  
  const mapped: Record<string, any> = {};
  
  // Normalize all keys first
  const normalizedRow: Record<string, any> = {};
  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeKey(key, debugLogs);
    normalizedRow[normalizedKey] = value;
  });
  
  console.log('🗂️ Normalized row:', normalizedRow);
  
  switch (table) {
    case 'institutions':
      mapped.institution_name = normalizedRow.institution_name || normalizedRow['שם המוסד'] || '';
      mapped.address = normalizedRow.address || normalizedRow['כתובת'] || '';
      mapped.phone = normalizedRow.phone || normalizedRow['טלפון'] || '';
      mapped.institution_type = normalizedRow.institution_type || normalizedRow['סוג המוסד'] || 'אחר';
      break;
      
    case 'business_licenses':
      mapped.business_name = normalizedRow.business_name || normalizedRow['שם העסק'] || '';
      mapped.license_holder = normalizedRow.license_holder || normalizedRow['בעל הרישיון'] || '';
      mapped.license_number = normalizedRow.license_number || normalizedRow['מספר רישיון'] || '';
      mapped.license_type = normalizedRow.license_type || normalizedRow['סוג הרישיון'] || 'כללי';
      
      // Handle dates
      if (normalizedRow.issue_date || normalizedRow['תאריך הנפקה']) {
        const dateValue = normalizedRow.issue_date || normalizedRow['תאריך הנפקה'];
        mapped.issue_date = dateValue;
      }
      
      if (normalizedRow.expiry_date || normalizedRow['תאריך תפוגה']) {
        const dateValue = normalizedRow.expiry_date || normalizedRow['תאריך תפוגה'];
        mapped.expiry_date = dateValue;
      }
      
      mapped.status = normalizedRow.status || normalizedRow['סטטוס'] || 'פעיל';
      break;
      
    case 'regular_budget':
      mapped.category_name = normalizedRow.category_name || normalizedRow['קטגוריה'] || '';
      mapped.category_type = normalizedRow.category_type || normalizedRow['סוג'] || 'הכנסות';
      mapped.budget_amount = parseFloat(normalizedRow.budget_amount || normalizedRow['תקציב'] || '0') || 0;
      mapped.actual_amount = parseFloat(normalizedRow.actual_amount || normalizedRow['ביצוע'] || '0') || 0;
      break;
      
    case 'collection_data':
      mapped.property_type = normalizedRow.property_type || normalizedRow['סוג נכס'] || '';
      mapped.annual_budget = parseFloat(normalizedRow.annual_budget || normalizedRow['תקציב שנתי'] || '0') || 0;
      mapped.relative_budget = parseFloat(normalizedRow.relative_budget || normalizedRow['תקציב יחסי'] || '0') || 0;
      mapped.actual_collection = parseFloat(normalizedRow.actual_collection || normalizedRow['גביה בפועל'] || '0') || 0;
      break;
      
    case 'tabarim':
      // Handle tabarim-specific mapping based on actual Excel structure
      // From logs, the project name is in the first column
      mapped.tabar_name = normalizedRow['ריכוז התקבולים והתשלומים של התקציב הבלתי רגיל לפי פרקי התקציב'] || 
                          normalizedRow.tabar_name || 
                          normalizedRow['שם תב"ר'] || 
                          normalizedRow['שם'] || '';
      
      // The number might be in the second column or a specific field
      mapped.tabar_number = normalizedRow[''] || 
                            normalizedRow.tabar_number || 
                            normalizedRow['מספר תב"ר'] || 
                            normalizedRow['מספר'] || 
                            String(normalizedRow['__empty'] || '');
      
      // Map domain field - from logs it's in "נכון לחודש 6/2025" column
      const domainValue = normalizedRow['נכון לחודש 6/2025'] || 
                         normalizedRow.domain || 
                         normalizedRow['תחום'] || 
                         normalizedRow['תחום פעילות'] || '';
      
      console.log('🔍 Domain mapping for tabarim:', { domainValue, normalizedRow });
      
      if (domainValue) {
        // Map Hebrew domain names to enum values based on actual tabar_domain enum
        if (domainValue.includes('חינוך') || domainValue.includes('מוסדות חינוך')) {
          mapped.domain = 'education_buildings';
        } else if (domainValue.includes('מוסדות ציבור') || domainValue.includes('בינוי')) {
          mapped.domain = 'public_buildings';
        } else if (domainValue.includes('תשתיות') || domainValue.includes('כבישים')) {
          mapped.domain = 'infrastructure_roads';
        } else if (domainValue.includes('תכנון')) {
          mapped.domain = 'planning';
        } else if (domainValue.includes('רווחה')) {
          mapped.domain = 'welfare';
        } else if (domainValue.includes('סביבה') || domainValue.includes('איכות')) {
          mapped.domain = 'environment';
        } else if (domainValue.includes('פעילויות') || domainValue.includes('תרבות')) {
          mapped.domain = 'activities';
        } else if (domainValue.includes('מרחבים') || domainValue.includes('ציבוריים')) {
          mapped.domain = 'public_spaces';
        } else if (domainValue.includes('דיגיטל') || domainValue.includes('טכנולוגיה')) {
          mapped.domain = 'digital';
        } else if (domainValue.includes('ארגוני') || domainValue.includes('ניהול')) {
          mapped.domain = 'organizational';
        } else if (domainValue.includes('אנרגיה') || domainValue.includes('התייעלות')) {
          mapped.domain = 'energy';
        } else if (domainValue.includes('וטרינר')) {
          mapped.domain = 'veterinary';
        } else {
          mapped.domain = 'other';
        }
      } else {
        mapped.domain = 'other';
      }
      
      // Map funding sources - check multiple possible columns  
      const funding1 = normalizedRow['__empty_1'] || 
                       normalizedRow['__empty_2'] ||
                       normalizedRow.funding_source1 || 
                       normalizedRow['מקור מימון 1'] || 
                       normalizedRow['מקור מימון'] || '';
                       
      if (funding1) {
        if (funding1.includes('משרד') || funding1.includes('ministry')) {
          mapped.funding_source1 = 'ministry';
        } else if (funding1.includes('רשות') || funding1.includes('authority')) {
          mapped.funding_source1 = 'authority';
        } else if (funding1.includes('עצמי') || funding1.includes('self')) {
          mapped.funding_source1 = 'self';
        } else if (funding1.includes('הלוואה') || funding1.includes('loan')) {
          mapped.funding_source1 = 'other';
        } else if (funding1.includes('עירייה') || funding1.includes('municipality')) {
          mapped.funding_source1 = 'self';
        } else {
          mapped.funding_source1 = 'other';
        }
      }
      
      // Map numeric fields - check the __empty_4, __empty_5, etc. columns
      mapped.approved_budget = parseFloat(normalizedRow['__empty_4'] || 
                                         normalizedRow.approved_budget || 
                                         normalizedRow['תקציב מאושר'] || '0') || 0;
      
      mapped.income_actual = parseFloat(normalizedRow['__empty_9'] || 
                                       normalizedRow.income_actual || 
                                       normalizedRow['הכנסות בפועל'] || '0') || 0;
      
      mapped.expense_actual = parseFloat(normalizedRow['__empty_10'] || 
                                        normalizedRow.expense_actual || 
                                        normalizedRow['הוצאות בפועל'] || '0') || 0;
      
      // Calculate surplus/deficit from __empty_13 or calculate it
      mapped.surplus_deficit = parseFloat(normalizedRow['__empty_13'] || '0') || 
                              ((mapped.income_actual || 0) - (mapped.expense_actual || 0));
      
      break;
      
    default:
      // For unrecognized tables, return the normalized row as-is
      return normalizedRow;
  }
  
  console.log('🗂️ Final mapped row:', mapped);
  return mapped;
};

export function DataUploader({ context = 'global', onUploadSuccess }: DataUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [detected, setDetected] = useState<{ table: string | null; reason: string }>({ table: null, reason: '' });
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importOption, setImportOption] = useState<ImportOption>({ mode: 'replace', confirmed: false });
  const { toast } = useToast();

  const handleConfirmImport = (mode: 'replace' | 'append') => {
    console.log(`📋 Import confirmed with mode: ${mode}`);
    setImportOption({ mode, confirmed: true });
    setShowImportDialog(false);
    // Continue with the import process
    setTimeout(() => {
      console.log('🔄 Continuing import after dialog close');
      uploadAndIngest();
    }, 100);
  };

  const onFile = async (f: File) => {
    console.log('🔥 onFile called with file:', f.name, 'context:', context);
    setFile(f);
    setDebugLogs([]);
    const logs: DebugLog[] = [];
    
    const addLog = (type: DebugLog['type'], message: string, details?: any) => {
      console.log(`📋 [${type}] ${message}`, details || '');
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
      console.log('📊 Starting file processing...');
      
      const ab = await f.arrayBuffer();
      console.log('📊 ArrayBuffer created, size:', ab.byteLength);
      const wb = XLSX.read(ab, { type: "array" });
      console.log('📊 Workbook read, sheets:', wb.SheetNames);
      const first = wb.SheetNames[0];
      const sheet = wb.Sheets[first];
      console.log('📊 Sheet extracted, context check:', context);
      
      // Check if this should be parsed as collection data
      if (context === 'collection') {
        addLog('info', 'משתמש בפענוח נתוני גביה בסיסי');
        const result = parseCollectionExcelByCellAddresses(sheet);
        const { data, summaryCards } = result;
        addLog('success', `נמצאו ${data.length} סוגי נכסים לגביה`);
        
        setRows(data);
        setHeaders(['property_type', 'annual_budget', 'relative_budget', 'actual_collection']);
        setDetected({ table: 'collection_data', reason: 'פענוח ישיר נתוני גביה' });
        
        setDebugLogs(logs);
        toast({ title: "קובץ נטען בהצלחה", description: `${data.length} סוגי נכסים נמצאו` });
        return;
      }
      
      // Standard header detection for all other contexts  
      console.log('📊 Headers detection for context:', context);
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];
      console.log('📊 Raw headers found:', headers);
      const cleanHeaders = headers.filter(h => h && h.trim()).map(h => h.trim().toLowerCase());
      console.log('📊 Clean headers:', cleanHeaders);

      const detected = detectTarget(cleanHeaders, context);
      console.log('🎯 Detection result:', detected);
      
      setDetected(detected);
      const rows = XLSX.utils.sheet_to_json(sheet);
      console.log('📊 Rows count:', rows.length);
      
      setRows(rows);
      setHeaders(cleanHeaders);
      addLog('success', `נמצאו ${rows.length} שורות`);
      
      setDebugLogs(logs);
      toast({ title: "קובץ נטען בהצלחה", description: `${rows.length} שורות. ${detected.reason}` });
    } catch (e: any) {
      addLog('error', `שגיאה בקריאת הקובץ: ${e.message}`);
      setDebugLogs(logs);      
      toast({ title: "שגיאה בקריאת הקובץ", description: e.message, variant: "destructive" });
    }
  };

  const uploadAndIngest = async () => {
    console.log('🔥 uploadAndIngest called!');
    console.log('State check:', { 
      file: !!file, 
      rowsLength: rows.length, 
      detectedTable: detected.table,
      context,
      importOption: importOption.confirmed
    });

    if (!file || rows.length === 0 || !detected.table) {
      toast({ title: "שגיאה", description: "אין קובץ או נתונים להעלאה", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const logs: DebugLog[] = [...debugLogs];
    
    const addLog = (type: DebugLog['type'], message: string, details?: any) => {
      console.log(`📋 [${type}] ${message}`, details || '');
      logs.push({
        id: Math.random().toString(),
        type,
        message,
        details,
        timestamp: new Date()
      });
      setDebugLogs([...logs]);
    };

    try {
      // Add debug logging
      console.log('🔍 Starting upload process...');
      console.log('🔍 File:', file.name, 'Context:', context);
      console.log('🔍 Detected table:', detected.table);
      
      // First, upload the file to Supabase storage with a safe filename
      addLog('info', 'מעלה קובץ לאחסון...');
      console.log('🔍 About to upload to storage...');
      
      // Create a safe filename by removing non-ASCII characters and replacing them
      const fileExtension = file.name.split('.').pop() || 'xlsx';
      const safeFileName = `tabarim_${Date.now()}.${fileExtension}`;
      const fileName = `uploads/${safeFileName}`;
      
      console.log('📁 Original filename:', file.name);
      console.log('📁 Safe filename:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      console.log('🔍 Storage upload result:', { uploadData, uploadError });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        addLog('error', `שגיאה בהעלאת הקובץ: ${uploadError.message}`);
        toast({ title: "שגיאה בהעלאה", description: uploadError.message, variant: "destructive" });
        return;
      }

      addLog('success', `קובץ הועלה בהצלחה: ${fileName}`);
      console.log('✅ File uploaded successfully');

      // Log the ingestion event
      console.log('🔍 About to log ingestion event...');
      const { error: logError } = await supabase
        .from('ingestion_logs')
        .insert({
          file_name: file.name,
          file_path: fileName,
          context: context,
          detected_table: detected.table,
          row_count: rows.length,
          status: 'processing',
          user_id: '33333333-3333-3333-3333-333333333333' // Finance demo user
        });

      console.log('🔍 Ingestion log result:', { logError });

      if (logError) {
        console.error('❌ Log error:', logError);
        addLog('warning', `שגיאה בתיעוד: ${logError.message}`);
      } else {
        console.log('✅ Ingestion logged successfully');
      }

      // Clear existing data if replace mode
      if (importOption.mode === 'replace') {
        addLog('info', `מוחק נתונים קיימים מטבלה: ${detected.table}`);
        const { error: deleteError } = await (supabase as any)
          .from(detected.table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

        if (deleteError) {
          console.error('❌ Delete error:', deleteError);
          addLog('warning', `שגיאה במחיקת נתונים קיימים: ${deleteError.message}`);
        } else {
          addLog('success', 'נתונים קיימים נמחקו בהצלחה');
        }
      }

      // Process and insert data
      addLog('info', `מעבד ומכניס ${rows.length} שורות...`);
      
      const batchSize = 100;
      let insertedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const mappedBatch = batch.map(row => {
          const mapped = mapRowToTable(detected.table!, row, logs);
          // Add user_id for all tables that require it
          if (detected.table === 'tabarim' || detected.table === 'regular_budget' || detected.table === 'collection_data') {
            mapped.user_id = '33333333-3333-3333-3333-333333333333'; // Finance demo user
          }
          return mapped;
        });
        
        console.log(`📝 Processing batch ${Math.floor(i/batchSize) + 1}, rows ${i + 1}-${Math.min(i + batchSize, rows.length)}`);
        console.log('📝 Sample mapped row:', mappedBatch[0]);

        const { data: insertData, error: insertError } = await (supabase as any)
          .from(detected.table)
          .insert(mappedBatch)
          .select();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          addLog('error', `שגיאה בהכנסת נתונים: ${insertError.message}`, { batch: i/batchSize + 1 });
          errorCount += batch.length;
        } else {
          console.log('✅ Batch inserted successfully:', insertData?.length || 0, 'rows');
          insertedCount += insertData?.length || 0;
          addLog('success', `הוכנסו ${insertData?.length || 0} שורות בקבוצה ${Math.floor(i/batchSize) + 1}`);
        }
      }

      // Update the ingestion log
      const { error: updateLogError } = await (supabase as any)
        .from('ingestion_logs')
        .update({
          status: errorCount > 0 ? 'completed_with_errors' : 'completed',
          inserted_rows: insertedCount,
          error_rows: errorCount
        })
        .eq('file_path', fileName);

      if (updateLogError) {
        console.error('❌ Update log error:', updateLogError);
      }

      const finalMessage = errorCount > 0 
        ? `הושלם עם שגיאות: ${insertedCount} שורות הוכנסו, ${errorCount} שגיאות`
        : `הושלם בהצלחה: ${insertedCount} שורות הוכנסו`;

      addLog(errorCount > 0 ? 'warning' : 'success', finalMessage);
      toast({ 
        title: "ההעלאה הושלמה", 
        description: finalMessage,
        variant: errorCount > 0 ? "destructive" : "default"
      });

      // Call the success callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      addLog('error', `שגיאה לא צפויה: ${error.message}`);
      toast({ title: "שגיאה לא צפויה", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = () => {
    console.log('🎯 handleUpload called');
    console.log('Current state:', { 
      hasFile: !!file, 
      rowsCount: rows.length, 
      detectedTable: detected.table,
      importOption
    });

    if (!file || rows.length === 0 || !detected.table) {
      toast({ title: "שגיאה", description: "אין קובץ או נתונים להעלאה", variant: "destructive" });
      return;
    }

    // Show confirmation dialog for tabarim
    if (detected.table === 'tabarim') {
      console.log('📋 Showing import dialog for tabarim');
      setShowImportDialog(true);
      return;
    }

    // For other tables, proceed directly
    uploadAndIngest();
  };

  const getIcon = (type: DebugLog['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            העלאת קובץ Excel
          </CardTitle>
          <CardDescription>
            בחר קובץ Excel להעלאה ועיבוד הנתונים
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">קובץ Excel</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {file && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">{file.name}</span>
                  <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                </div>

                {detected.table && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">טבלה מזוהה: {detected.table}</Badge>
                      <Badge variant="outline">{rows.length} שורות</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{detected.reason}</p>
                  </div>
                )}

                {rows.length > 0 && (
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading}
                    className="mt-4"
                  >
                    {isUploading ? 'מעלה...' : 'העלה נתונים'}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {debugLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>יומן עיבוד</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {debugLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm">
                    {getIcon(log.type)}
                    <div className="flex-1">
                      <div>{log.message}</div>
                      {log.details && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>אישור יבוא נתונים</AlertDialogTitle>
            <AlertDialogDescription>
              נמצאו {rows.length} תב"רים בקובץ. 
              <br />
              האם להחליף את הרשימה הקיימת או להוסיף לרשימה הנוכחית?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleConfirmImport('append')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              הוסף לרשימה הקיימת
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => handleConfirmImport('replace')}
              className="bg-red-600 hover:bg-red-700"
            >
              החלף את הרשימה הקיימת
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}