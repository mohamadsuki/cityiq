import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { FileUp, Upload, AlertCircle, CheckCircle, Database, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

type ImportOption = {
  mode: 'replace' | 'append';
  confirmed: boolean;
};

type DataUploaderProps = {
  context?: string;
  onUploadSuccess?: () => void;
};

type DebugLog = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  details?: any;
};

const detectDataType = (headers: string[], rows: any[]) => {
  const headerStr = headers.join(' ').toLowerCase();
  console.log('🔍 Headers for detection:', headers);
  console.log('🔍 First few rows for detection:', rows.slice(0, 3));
  
  // Check for collection-specific keywords
  if (headerStr.includes('property_type') || headerStr.includes('סוג נכס') || headerStr.includes('גביה')) {
    return { table: 'collection_data', reason: 'זוהה על בסיס כותרות גביה' };
  }
  
  // Check for salary-specific keywords
  if (headerStr.includes('salary') || headerStr.includes('משכורת') || headerStr.includes('רבעון') || headerStr.includes('quarter')) {
    return { table: 'salary_data', reason: 'זוהה על בסיס כותרות משכורות' };
  }
  
  // Check for regular budget keywords
  if (headerStr.includes('budget') || headerStr.includes('תקציב רגיל') || headerStr.includes('category')) {
    return { table: 'regular_budget', reason: 'זוהה על בסיס כותרות תקציב רגיל' };
  }
  
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
  console.log('🐛 DEBUG - Original row sample keys:', Object.keys(row).slice(0, 5));
  console.log('🐛 DEBUG - Row has project name key:', !!row['ריכוז התקבולים והתשלומים של התקציב הבלתי רגיל לפי פרקי התקציב']);
  
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
      // CRITICAL FIX: Use original row because normalizeKey lowercases the Hebrew key
      const projectName = row['ריכוז התקבולים והתשלומים של התקציב הבלתי רגיל לפי פרקי התקציב'] || '';
      
      console.log('🐛 FIXED: Extracted project name from original row:', projectName);
      
      // Skip if this looks like a header row or empty row
      if (!projectName || 
          projectName.includes('דו"ח תקופתי') || 
          projectName.includes('שם תב"ר') ||
          projectName.includes('כולל קליטה') ||
          projectName.length < 3) {
        console.log('🚫 Skipping header/empty row:', projectName);
        return null; // Skip this row
      }
      
      mapped.tabar_name = projectName;
      
      // The number might be in the second column or a specific field
      mapped.tabar_number = normalizedRow[''] || 
                            normalizedRow.tabar_number || 
                            normalizedRow['מספר תב"ר'] || 
                            normalizedRow['מספר'] || 
                            String(normalizedRow['__empty'] || '');
      
      // Map domain field - now accepts Hebrew text directly
      const domainValue = row['נכון לחודש 6/2025'] || 
                         normalizedRow['נכון לחודש 6/2025'] ||
                         normalizedRow.domain || 
                         normalizedRow['תחום'] || 
                         normalizedRow['תחום פעילות'] || '';
      
      console.log('🔍 Domain mapping for tabarim:', { domainValue, projectName });
      
      // Keep domain in Hebrew - now table accepts Hebrew text directly
      mapped.domain = domainValue || 'אחר';
      
      // Map funding sources based on actual Excel structure with __EMPTY_X columns
      // From previous logs: __EMPTY_1, __EMPTY_2, __EMPTY_3 contain funding sources
      const funding1 = row['__EMPTY_1'] || normalizedRow['__empty_1'] || '';
      const funding2 = row['__EMPTY_2'] || normalizedRow['__empty_2'] || '';  
      const funding3 = row['__EMPTY_3'] || normalizedRow['__empty_3'] || '';
      
      console.log('🔍 Fixed funding sources mapping:', { funding1, funding2, funding3 });
      console.log('🔍 Row __EMPTY_1:', row['__EMPTY_1'], 'Row __EMPTY_2:', row['__EMPTY_2'], 'Row __EMPTY_3:', row['__EMPTY_3']);
      
      // Keep funding sources in Hebrew - now table accepts Hebrew text
      mapped.funding_source1 = funding1 || null;
      mapped.funding_source2 = funding2 || null;
      mapped.funding_source3 = funding3 || null;
      
      // Map numeric fields - fix the column mapping based on actual Excel structure
      // From logs: __EMPTY_4 = approved budget, __EMPTY_9 = income, __EMPTY_10 = expense, __EMPTY_13 = surplus
      mapped.approved_budget = parseFloat(row['__EMPTY_4'] || normalizedRow['__empty_4'] || '0') || 0;
      
      mapped.income_actual = parseFloat(row['__EMPTY_9'] || normalizedRow['__empty_9'] || '0') || 0;
      
      mapped.expense_actual = parseFloat(row['__EMPTY_10'] || normalizedRow['__empty_10'] || '0') || 0;
      
      // Calculate surplus/deficit from __EMPTY_13 or calculate it
      mapped.surplus_deficit = parseFloat(row['__EMPTY_13'] || normalizedRow['__empty_13'] || '0') || 
                              ((mapped.income_actual || 0) - (mapped.expense_actual || 0));
      
      console.log('🔍 Fixed numeric mapping:', { 
        approved_budget: mapped.approved_budget, 
        income_actual: mapped.income_actual, 
        expense_actual: mapped.expense_actual, 
        surplus_deficit: mapped.surplus_deficit 
      });
      
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
        timestamp: new Date(),
        details
      });
      setDebugLogs([...logs]);
    };

    if (!f) {
      addLog('error', 'לא נבחר קובץ');
      return;
    }

    addLog('info', `קורא קובץ: ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      addLog('info', `גיליון נקרא בהצלחה: ${firstSheetName}`);
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: null,
        raw: false 
      }) as any[][];
      
      if (jsonData.length === 0) {
        addLog('error', 'הקובץ ריק');
        return;
      }
      
      // Find the first non-empty row as headers
      let headerRowIndex = 0;
      while (headerRowIndex < jsonData.length && (!jsonData[headerRowIndex] || jsonData[headerRowIndex].length === 0)) {
        headerRowIndex++;
      }
      
      if (headerRowIndex >= jsonData.length) {
        addLog('error', 'לא נמצאה שורת כותרות');
        return;
      }
      
      const headersArray = jsonData[headerRowIndex];
      const dataRows = jsonData.slice(headerRowIndex + 1);
      
      addLog('info', `נמצאו ${headersArray.length} כותרות ו-${dataRows.length} שורות נתונים`);
      
      // Convert to objects
      const rowObjects = dataRows.map((row, index) => {
        const obj: Record<string, any> = {};
        headersArray.forEach((header, colIndex) => {
          const key = header || `__EMPTY${colIndex > 0 ? `_${colIndex}` : ''}`;
          obj[key] = row[colIndex];
        });
        obj.__rowNum__ = index + headerRowIndex + 2; // Excel row number
        return obj;
      });
      
      setHeaders(headersArray);
      setRows(rowObjects);
      
      // Detect data type
      const detection = detectDataType(headersArray, rowObjects.slice(0, 5));
      setDetected(detection);
      
      if (detection.table) {
        addLog('success', `זוהה כ: ${detection.table} - ${detection.reason}`);
      } else {
        addLog('warning', `לא זוהה סוג נתונים: ${detection.reason}`);
      }
      
    } catch (error) {
      console.error('Error reading file:', error);
      addLog('error', `שגיאה בקריאת הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    }
  };

  const uploadAndIngest = useCallback(async () => {
    if (!file || !detected.table || rows.length === 0) {
      toast({ variant: "destructive", title: "שגיאה", description: "לא נבחר קובץ או לא זוהה סוג נתונים" });
      return;
    }

    if (!importOption.confirmed) {
      console.log('📋 Import not confirmed yet, showing dialog');
      setShowImportDialog(true);
      return;
    }

    console.log('🔄 Starting upload and ingestion process');
    setIsUploading(true);
    const logs: DebugLog[] = [...debugLogs];
    
    const addLog = (type: DebugLog['type'], message: string, details?: any) => {
      console.log(`📋 [${type}] ${message}`, details || '');
      logs.push({
        id: Math.random().toString(),
        type,
        message,
        timestamp: new Date(),
        details
      });
      setDebugLogs([...logs]);
    };

    try {
      console.log('🗂️ Starting data mapping and insertion process...');
      addLog('info', `מתחיל עיבוד ${rows.length} שורות לטבלה: ${detected.table}`);

      // Upload file to storage first
      const timestamp = Date.now();
      const fileName = `${detected.table}_${timestamp}.xlsx`;
      const filePath = `uploads/${fileName}`;

      addLog('info', `מעלה קובץ: ${filePath}`);
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`שגיאה בהעלאת קובץ: ${uploadError.message}`);
      }

      // Log the ingestion
      try {
        const { error: logError } = await supabase
          .from('ingestion_logs')
          .insert({
            file_name: file.name,
            file_path: filePath,
            context: detected.table,
            detected_table: detected.table,
            status: 'processing',
            user_id: '33333333-3333-3333-3333-333333333333' // Demo user
          });

        if (logError) {
          console.warn('⚠️ Could not create ingestion log:', logError);
        }
      } catch (logErr) {
        console.warn('⚠️ Ingestion log error:', logErr);
      }

      // Clear existing data if replace mode
      if (importOption.mode === 'replace') {
        addLog('info', `מוחק נתונים קיימים מטבלה: ${detected.table}`);
        const { error: deleteError } = await supabase
          .from(detected.table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all real records

        if (deleteError) {
          console.warn(`⚠️ Could not clear existing data: ${deleteError.message}`);
          addLog('warning', `לא ניתן למחוק נתונים קיימים: ${deleteError.message}`);
        }
      }

      // Process and insert data
      console.log('🗂️ Processing rows for table:', detected.table);
      let insertedCount = 0;
      let skippedCount = 0;

      try {
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          console.log(`🗂️ Processing row ${i + 1}/${rows.length}`);
          
          const mappedRow = mapRowToTable(detected.table, row, logs);
          
          if (!mappedRow) {
            console.log(`🚫 Skipping row ${i + 1} - returned null from mapping`);
            skippedCount++;
            continue;
          }

          // Add user_id and other metadata
          mappedRow.user_id = '33333333-3333-3333-3333-333333333333'; // Demo user

          console.log('🐛 DEBUG: Attempting to insert mapped row:', mappedRow);

          try {
            const { data, error } = await supabase
              .from(detected.table as any)
              .insert(mappedRow)
              .select('*');

            if (error) {
              console.error(`❌ Insert error for row ${i + 1}:`, error);
              addLog('error', `שגיאה בהכנסת שורה ${i + 1}: ${error.message}`, { row: mappedRow, error });
            } else {
              console.log(`✅ Successfully inserted row ${i + 1}:`, data);
              insertedCount++;
            }
          } catch (insertErr) {
            console.error(`❌ Insert exception for row ${i + 1}:`, insertErr);
            addLog('error', `חריגה בהכנסת שורה ${i + 1}: ${insertErr}`, { row: mappedRow });
          }
        }

        // Update ingestion log with results
        try {
          await supabase
            .from('ingestion_logs')
            .update({
              status: 'completed',
              inserted_rows: insertedCount,
              error_rows: rows.length - insertedCount - skippedCount
            })
            .eq('file_path', filePath);
        } catch (updateErr) {
          console.warn('⚠️ Could not update ingestion log:', updateErr);
        }

        console.log(`📋 [success] הושלם בהצלחה: ${insertedCount} שורות הוכנסו`);
        addLog('success', `הושלם בהצלחה: ${insertedCount} שורות הוכנסו, ${skippedCount} שורות דולגו`);

        // Call success callback
        if (onUploadSuccess) {
          console.log('🎯 Calling onUploadSuccess callback');
          onUploadSuccess();
        }

        // Verification step
        try {
          console.log('🔍 Verifying data insertion...');
          const { count, error: countError, data: sampleData } = await supabase
            .from(detected.table as any)
            .select('*', { count: 'exact' })
            .limit(1);
          
          console.log('🔍 Verification result:', { 
            count, 
            error: countError, 
            sampleRecord: sampleData?.[0] ? { _type: typeof sampleData[0], value: typeof sampleData[0] } : { _type: 'undefined', value: 'undefined' }
          });
        } catch (verifyErr) {
          console.warn('⚠️ Verification error:', verifyErr);
        }

        // Test direct insert
        try {
          console.log('🧪 Testing direct insert...');
          const { data: testData, error: testError } = await supabase
            .from(detected.table as any)
            .insert({
              tabar_name: 'בדיקת מערכת',
              tabar_number: '999',
              domain: 'other',
              approved_budget: 1000,
              income_actual: 500,
              expense_actual: 300,
              surplus_deficit: 200,
              user_id: '33333333-3333-3333-3333-333333333333'
            })
            .select('*');

          console.log('🧪 Test insert result:', { success: !testError, data: testData, error: testError });
        } catch (testErr) {
          console.warn('🧪 Test insert error:', testErr);
        }

      } catch (processingError) {
        console.error('❌ Processing error:', processingError);
        addLog('error', `שגיאה בעיבוד הנתונים: ${processingError instanceof Error ? processingError.message : 'שגיאה לא ידועה'}`);
        throw processingError;
      }

      toast({ 
        title: "הצלחה!", 
        description: `${insertedCount} רשומות הוכנסו בהצלחה לטבלה ${detected.table}` 
      });

    } catch (error) {
      console.error('❌ Upload and ingestion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      addLog('error', `שגיאה בהעלאה: ${errorMessage}`);
      toast({ 
        variant: "destructive", 
        title: "שגיאה", 
        description: `שגיאה בהעלאת הנתונים: ${errorMessage}` 
      });
    } finally {
      setIsUploading(false);
      setImportOption({ mode: 'replace', confirmed: false }); // Reset for next time
    }
  }, [file, detected.table, rows, debugLogs, importOption, onUploadSuccess, toast]);

  const renderPreview = () => {
    if (rows.length === 0) return null;

    const previewRows = rows.slice(0, 5);
    const previewHeaders = headers.slice(0, 10); // Limit columns for display

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">תצוגה מקדימה (5 שורות ראשונות):</h3>
        <div className="border rounded-lg overflow-auto max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                {previewHeaders.map((header, index) => (
                  <th key={index} className="border p-2 text-right">
                    {header || `עמודה ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/50">
                  {previewHeaders.map((header, colIndex) => (
                    <td key={colIndex} className="border p-2 text-right">
                      {String(row[header] || '').slice(0, 50)}
                      {String(row[header] || '').length > 50 ? '...' : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDebugLogs = () => {
    if (debugLogs.length === 0) return null;

    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">יומן עיבוד:</h3>
        <div className="space-y-1 max-h-64 overflow-auto">
          {debugLogs.map((log) => (
            <div key={log.id} className={cn(
              "text-xs p-2 rounded border-r-2",
              log.type === 'error' && "bg-destructive/10 border-r-destructive text-destructive",
              log.type === 'warning' && "bg-warning/10 border-r-warning text-warning",
              log.type === 'success' && "bg-success/10 border-r-success text-success", 
              log.type === 'info' && "bg-muted border-r-muted-foreground"
            )}>
              <div className="flex items-center gap-2">
                {log.type === 'error' && <AlertCircle className="w-3 h-3" />}
                {log.type === 'success' && <CheckCircle className="w-3 h-3" />}
                {log.type === 'info' && <Database className="w-3 h-3" />}
                <span>{log.message}</span>
              </div>
              {log.details && (
                <pre className="mt-1 text-xs opacity-75 overflow-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            העלאת נתונים מקובץ Excel
          </CardTitle>
          <CardDescription>
            בחר קובץ .xlsx או .xls כדי להעלות נתונים למערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="file">קובץ Excel</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => onFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
          </div>

          {detected.table && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {detected.table}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {detected.reason}
              </span>
            </div>
          )}

          {renderPreview()}
          {renderDebugLogs()}

          <div className="flex gap-2">
            <Button 
              onClick={uploadAndIngest}
              disabled={!file || !detected.table || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  מעלה...
                </>
              ) : (
                <>
                  <FileUp className="w-4 h-4 mr-2" />
                  העלה לבסיס הנתונים
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אפשרויות יבוא נתונים</DialogTitle>
            <DialogDescription>
              כיצד ברצונך להתמודד עם הנתונים הקיימים?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleConfirmImport('replace')}
              >
                <div className="text-right">
                  <div className="font-medium">החלף את כל הנתונים הקיימים</div>
                  <div className="text-sm text-muted-foreground">מחק את הנתונים הקיימים והכנס את החדשים</div>
                </div>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleConfirmImport('append')}
              >
                <div className="text-right">
                  <div className="font-medium">הוסף לנתונים הקיימים</div>
                  <div className="text-sm text-muted-foreground">הוסף את הנתונים החדשים לקיימים</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}