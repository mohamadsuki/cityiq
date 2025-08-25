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

const detectDataType = (headers: string[], rows: any[], context?: string) => {
  const headerStr = headers.join(' ').toLowerCase();
  console.log('🔍 Headers for detection:', headers);
  console.log('🔍 Context for detection:', context);
  console.log('🔍 First few rows for detection:', rows.slice(0, 3));
  
  // If context is provided, trust it first
  if (context) {
    switch (context) {
      case 'regular_budget':
        return { table: 'regular_budget', reason: 'זוהה על בסיס הקשר הדף (תקציב רגיל)' };
      case 'collection':
        return { table: 'collection_data', reason: 'זוהה על בסיס הקשר הדף (גביה)' };
      case 'salary':
        return { table: 'salary_data', reason: 'זוהה על בסיס הקשר הדף (משכורות)' };
      case 'tabarim':
        return { table: 'tabarim', reason: 'זוהה על בסיס הקשר הדף (תב"רים)' };
      case 'grants':
        return { table: 'grants', reason: 'זוהה על בסיס הקשר הדף (קולות קוראים)' };
      case 'budget_authorizations':
        return { table: 'budget_authorizations', reason: 'זוהה על בסיס הקשר הדף (הרשאות תקציביות)' };
      case 'business':
        return { table: 'licenses', reason: 'זוהה על בסיס הקשר הדף (רישוי עסקים)' };
    }
  }
  
  // Also check in the first few rows content for grants indicators  
  const allContent = [...headers, ...rows.flatMap(row => Object.values(row).filter(v => typeof v === 'string'))].join(' ').toLowerCase();
  
  if (allContent.includes('קולות קוראים') || allContent.includes('משרד') || allContent.includes('ממקם') || 
      allContent.includes('תגוית') || allContent.includes('ספורט') || allContent.includes('grant')) {
    return { table: 'grants', reason: 'זוהה על בסיס תוכן הקובץ (קולות קוראים)' };
  }
  
  if (allContent.includes('תמצית נתוני התקציב הרגיל') || allContent.includes('תקציב שנתי מאושר') || allContent.includes('תקציב יחסי')) {
    return { table: 'regular_budget', reason: 'זוהה על בסיס תוכן הקובץ (תקציב רגיל)' };
  }
  
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
  
  // Check for budget authorizations keywords (more specific)
  if (headerStr.includes('הרשאה') || headerStr.includes('הרשאות') || 
      headerStr.includes('authorization') || headerStr.includes('מספר הרשאה') ||
      headerStr.includes('תוקף ההרשאה') || headerStr.includes('סכום ההרשאה') ||
      (headerStr.includes('משרד') && headerStr.includes('תב"ר')) ||
      (headerStr.includes('ministry') && headerStr.includes('authorization'))) {
    return { table: 'budget_authorizations', reason: 'זוהה על בסיס כותרות הרשאות תקציביות' };
  }
  
  // Check for grants-specific keywords
  if (headerStr.includes('grant') || headerStr.includes('קול קורא') || headerStr.includes('קולות קוראים') || 
      headerStr.includes('ministry') || headerStr.includes('משרד') || headerStr.includes('גרנט') ||
      headerStr.includes('ממקם') || headerStr.includes('תגוית') || headerStr.includes('ספורט')) {
    return { table: 'grants', reason: 'זוהה על בסיס כותרות קולות קוראים' };
  }
  
  if (headerStr.includes('institution') || headerStr.includes('מוסד')) {
    return { table: 'institutions', reason: 'זוהה על בסיس כותרות מוסדות חינוך' };
  }
  
  if (headerStr.includes('license') || headerStr.includes('רישיון')) {
    return { table: 'business_licenses', reason: 'זוהה על בסיס כותרות רישיונות עסק' };
  }
  
  return { table: null, reason: 'לא זוהה סוג נתונים מתאים' };
};

// Function to find Hebrew column indices in Excel headers
const findHebrewColumns = (headers: string[]) => {
  const columnMapping = {
    incomeIndex: -1,
    expenseIndex: -1,
    surplusIndex: -1
  };

  console.log('🔍 Searching for Hebrew columns in headers:', headers);

  headers.forEach((header, index) => {
    const headerStr = String(header || '').trim();
    console.log(`🔍 Header ${index}: "${headerStr}"`);
    
    // More flexible income column detection
    if (headerStr.includes('ביצוע') && headerStr.includes('הכנסות') ||
        headerStr.includes('ביצוע') && headerStr.includes('הכנסה') ||
        headerStr.includes('מצטבר') && headerStr.includes('הכנסות') ||
        headerStr.includes('הכנסות בפועל') ||
        headerStr === 'ביצוע מצטבר הכנסות') {
      columnMapping.incomeIndex = index;
      console.log(`✅ Found income column at index ${index}: "${headerStr}"`);
    }
    
    // More flexible expense column detection
    if (headerStr.includes('ביצוע') && headerStr.includes('הוצאות') ||
        headerStr.includes('ביצוע') && headerStr.includes('הוצאה') ||
        headerStr.includes('מצטבר') && headerStr.includes('הוצאות') ||
        headerStr.includes('הוצאות בפועל') ||
        headerStr === 'ביצוע מצטבר הוצאות') {
      columnMapping.expenseIndex = index;
      console.log(`✅ Found expense column at index ${index}: "${headerStr}"`);
    }
    
    // More flexible surplus column detection
    if (headerStr.includes('עודף') && headerStr.includes('גירעון') ||
        headerStr === 'עודף/גירעון' ||
        headerStr === 'עודף גירעון' ||
        headerStr.includes('עודף') || 
        headerStr.includes('גירעון')) {
      columnMapping.surplusIndex = index;
      console.log(`✅ Found surplus column at index ${index}: "${headerStr}"`);
    }
  });

  console.log('🔍 Final column mapping:', columnMapping);
  return columnMapping;
};

// Helper function to validate if a value is a valid date
const isValidDate = (value: any): boolean => {
  if (!value) return false;
  if (typeof value === 'string') {
    // Skip obvious non-date text like headers or descriptions
    if (value.includes('מספר') || value.includes('עסק') || value.includes('רישיון') || 
        value.includes('בעל') || value.includes('כתובת') || value.includes('סוג') ||
        value.length > 50) {
      return false;
    }
  }
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1900;
};

// Helper function to check if a row contains header/descriptive text
const isHeaderRow = (row: any): boolean => {
  const values = Object.values(row).filter(v => v && typeof v === 'string');
  const headerKeywords = ['מספר עסקים', 'שם העסק', 'בעל הרישיון', 'כתובת', 'סוג', 'רישיון', 'תאריך', 'סטטוס'];
  
  // If more than half the values contain header keywords, it's likely a header row
  const headerCount = values.filter(v => 
    headerKeywords.some(keyword => String(v).includes(keyword))
  ).length;
  
  return headerCount > values.length / 2;
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
    'הוצאות בפועל': 'expense_actual',
    
    // Grants fields
    'שם הקול קורא': 'grant_name',
    'שם': 'grant_name', 
    'משרד': 'ministry',
    'סכום': 'grant_amount',
    'תקציב גרנט': 'grant_amount',
    'סטטוס גרנט': 'grant_status',
    'תאריך הגשה': 'submitted_at',
    'תאריך החלטה': 'decision_at',
    
    // Budget Authorization fields
    'מספר הרשאה': 'authorization_number',
    'משרד מממן': 'ministry',
    'תוכנית': 'program',
    'מס\' תב"ר': 'purpose',
    'סכום ההרשאה': 'amount',
    'תוקף ההרשאה': 'valid_until',
    'מחלקה מטפלת': 'department',
    'תאריך אישור מליאה': 'approved_at',
    'הערות': 'notes'
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

const mapRowToTable = (table: string, row: Record<string, any>, debugLogs?: DebugLog[], allHeaders?: string[]) => {
  console.log(`🗂️ mapRowToTable called for table: ${table}`, row);
  console.log('🐛 DEBUG - Original row sample keys:', Object.keys(row).slice(0, 5));
  console.log('🐛 DEBUG - Row has project name key:', !!row['ריכוז התקבולים והתשלומים של התקציב הבלתי רגיל לפי פרקי התקציב']);
  
  // Skip header rows or rows with descriptive text
  if (isHeaderRow(row)) {
    console.log('⏭️ Skipping header row:', row);
    return null;
  }
  
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
      
    case 'licenses':
      // Updated mapping for new Hebrew Excel format with additional columns
      mapped.license_number = normalizedRow['רישיון'] || normalizedRow.license_number || normalizedRow['מספר רישיון'] || '';
      mapped.business_name = normalizedRow['שם עסק'] || normalizedRow.business_name || normalizedRow['שם העסק'] || '';
      mapped.owner = normalizedRow['שם בעל העסק'] || normalizedRow.owner || normalizedRow['בעל הרישיון'] || normalizedRow['בעל'] || '';
      
      // Combine address fields from street and house number
      const street = normalizedRow['רחוב'] || '';
      const houseNumber = normalizedRow['בית'] || '';
      mapped.address = [street, houseNumber].filter(part => 
        part && 
        part.toString().trim() !== '' && 
        part.toString() !== '0' && 
        part.toString().toLowerCase() !== 'null'
      ).join(' ');
      
      // Map additional fields if present in Excel
      mapped.phone = normalizedRow['מס טלפון'] || normalizedRow['טלפון'] || '';
      mapped.mobile = normalizedRow['מס פלאפון'] || normalizedRow['נייד'] || '';
      mapped.email = normalizedRow['כתובת מייל עסק'] || normalizedRow['כתובת מייל'] || normalizedRow['אימייל'] || '';
      
      // Clean validity field - remove leading numbers
      const validityRaw = normalizedRow['תוקף'] || normalizedRow['תוקף עד'] || '';
      mapped.validity = validityRaw ? validityRaw.toString().replace(/^\d+/, '') : '';
      
      // Clean business nature field - remove leading numbers  
      const businessNatureRaw = normalizedRow['מהות עסק'] || normalizedRow['טיב עסק'] || '';
      mapped.business_nature = businessNatureRaw ? businessNatureRaw.toString().replace(/^\d+/, '') : '';
      
      // Add missing fields from Excel
      mapped.dock_fee = normalizedRow['חייב במזח'] || '';
      mapped.days_from_request = normalizedRow['ימים מתא.בקשה'] || '';
      mapped.days_temporary_permit = normalizedRow['ימים בהיתר זמני'] || '';
      mapped.inspector = normalizedRow['מפקח'] || '';
      mapped.area = normalizedRow['אזור'] || '';
      mapped.property = normalizedRow['נכס'] || '';
      mapped.old_file = normalizedRow['תיק ישן'] || '';
      mapped.block_parcel_sub = normalizedRow['גוש חלקה תת'] || '';
      mapped.judgment_execution = normalizedRow['ביצוע פס\'ד'] || '';
      mapped.location_description = normalizedRow['תאור מקום'] || '';
      mapped.fire_department_number = normalizedRow['מספר כיבוי אש'] || '';
      mapped.risk_level = normalizedRow['דרגת סיכון'] || '';
      mapped.file_holder = normalizedRow['מחזיק בתיק'] || '';
      
      // Helper function to parse dates safely
      const parseDate = (dateField: any, fieldName: string): string | null => {
        if (!dateField || dateField.toString().trim() === '') return null;
        
        try {
          const dateStr = dateField.toString();
          if (!isNaN(Number(dateStr)) && Number(dateStr) > 40000) {
            const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
            return excelDate.toISOString().split('T')[0];
          } else if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(dateStr)) {
            const parts = dateStr.split(/[\/\-\.]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1;
              const year = parseInt(parts[2]);
              const fullYear = year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
              const parsedDate = new Date(fullYear, month, day);
              if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
              }
            }
          }
        } catch (e) {
          console.log(`Failed to parse ${fieldName}:`, dateField);
        }
        return null;
      };
      
      // Handle all date fields safely
      mapped.delivery_date = parseDate(normalizedRow['תאריך מסירה'], 'delivery_date');
      mapped.follow_up_date = parseDate(normalizedRow['תאריך מעקב'], 'follow_up_date');
      mapped.judgment_date = parseDate(normalizedRow['ת. פסק דין'], 'judgment_date');
      mapped.closure_date = parseDate(normalizedRow['תאריך סגירה'], 'closure_date');
      mapped.inspection_date = parseDate(normalizedRow['תאריך ביקורת'], 'inspection_date');
      // Handle expiry dates - check multiple possible columns and prioritize non-empty values
      const possibleExpiryFields = [
        normalizedRow['תאריך פקיעה'],
        normalizedRow['פוקע ב'],
        normalizedRow['תא.עדכון ק.תוקף'], 
        normalizedRow['תאריך עדכון תוקף'],
        normalizedRow['תוקף עד'],
        normalizedRow['תאריך תפוגה']
      ].filter(field => field && field.toString().trim() !== '');
      
      const expiryDateField = possibleExpiryFields[0]; // Take first non-empty value
      console.log(`🗓️ Available expiry fields for ${mapped.business_name}:`, possibleExpiryFields);
      console.log(`🗓️ Selected expiry field:`, expiryDateField);
      mapped.expires_at = parseDate(expiryDateField, 'expires_at');
      console.log(`🗓️ Final expires_at for ${mapped.business_name}:`, mapped.expires_at);
      mapped.request_date = parseDate(normalizedRow['תאריך בקשה'] || normalizedRow['תאריך פנייה'], 'request_date');
      
      // Clean request type field - remove leading numbers
      const requestTypeRaw = normalizedRow['סוג בקשה'] || normalizedRow['סוג פנייה'] || '';
      mapped.request_type = requestTypeRaw ? requestTypeRaw.toString().replace(/^\d+/, '') : '';
      
      // Clean group category field - remove leading numbers
      const groupCategoryRaw = normalizedRow['קבוצה'] || normalizedRow['קטגוריה'] || '';
      mapped.group_category = groupCategoryRaw ? groupCategoryRaw.toString().replace(/^\d+/, '') : '';
      
      // Handle reported area
      const areaField = normalizedRow['שטח מדווח'] || normalizedRow['שטח'] || '';
      if (areaField && !isNaN(parseFloat(areaField))) {
        mapped.reported_area = parseFloat(areaField);
      }
      
      // Set defaults for other fields
      mapped.type = normalizedRow.type || normalizedRow['סוג הרישיון'] || normalizedRow['סוג'] || 'כללי';
      mapped.status = normalizedRow.status || normalizedRow['סטטוס'] || 'פעיל';
      mapped.department_slug = 'business'; // Always set department_slug for licenses
      
      // Handle validity field (not a date field)
      mapped.validity = normalizedRow['תוקף עד'] || normalizedRow['תוקף'] || '';
      
      mapped.reason_no_license = normalizedRow.reason_no_license || normalizedRow['סיבה ללא רישוי'] || '';
      
      // Skip empty rows - check if all main fields are empty or just zeros
      const hasContent = (mapped.business_name && mapped.business_name.trim()) || 
                        (mapped.owner && mapped.owner.trim()) || 
                        (mapped.license_number && mapped.license_number.trim()) ||
                        (mapped.address && mapped.address.trim());
      
      if (!hasContent) {
        console.log('🚫 Skipping empty licenses row');
        return null;
      }
      
      // user_id יוגדר למטה בשורה 900+
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
      
      if (normalizedRow.expires_at || normalizedRow['תאריך תפוגה'] || normalizedRow['תאריך פקיעה']) {
        const dateValue = normalizedRow.expires_at || normalizedRow['תאריך תפוגה'] || normalizedRow['תאריך פקיעה'];
        mapped.expires_at = parseDate(dateValue, 'expires_at');
      }
      
      mapped.status = normalizedRow.status || normalizedRow['סטטוס'] || 'פעיל';
      break;
      
    case 'regular_budget':
      // Get category name from the first column (עיריית כפר קרע key)
      mapped.category_name = row['עיריית כפר קרע'] || normalizedRow.category_name || normalizedRow['קטגוריה'] || '';
      
      console.log('🔍 Regular Budget mapping:', {
        categoryName: mapped.category_name,
        rawData: {
          col1: row['__EMPTY_1'],
          col3: row['__EMPTY_3']
        }
      });
      
      // Determine category type based on content patterns
      let categoryType = 'income'; // default
      const categoryName = mapped.category_name.toLowerCase();
      
      // These are expense categories
      if (categoryName.includes('משכורות') || 
          categoryName.includes('שכר') || 
          categoryName.includes('הוצאות') || 
          categoryName.includes('רכישות') || 
          categoryName.includes('תחזוקה') || 
          categoryName.includes('שירותים') ||
          categoryName.includes('פעילויות') ||
          categoryName.includes('מימון')) {
        categoryType = 'expense';
      }
      
      mapped.category_type = categoryType;
      
      // Map budget and actual amounts from the Excel structure
      // Based on the logs: __EMPTY_1 seems to be budget, __EMPTY_3 seems to be actual
      const budgetValue = row['__EMPTY_1'] || normalizedRow.budget_amount || normalizedRow['תקציב'] || '0';
      const actualValue = row['__EMPTY_3'] || normalizedRow.actual_amount || normalizedRow['ביצוע'] || '0';
      
      // Clean and parse numeric values (remove commas)
      mapped.budget_amount = parseFloat(String(budgetValue).replace(/,/g, '')) || 0;
      mapped.actual_amount = parseFloat(String(actualValue).replace(/,/g, '')) || 0;
      
      console.log('🔍 Parsed amounts:', {
        budget: mapped.budget_amount,
        actual: mapped.actual_amount
      });
      
      // Skip empty rows or header rows
      if (!mapped.category_name || 
          mapped.category_name.includes('עיריית כפר קרע') ||
          mapped.category_name.includes('תקציב') ||
          mapped.category_name.length < 2) {
        console.log('🚫 Skipping row:', mapped.category_name);
        return null;
      }
      
      break;
      
    case 'collection_data':
      mapped.property_type = normalizedRow.property_type || normalizedRow['סוג נכס'] || '';
      mapped.annual_budget = parseFloat(normalizedRow.annual_budget || normalizedRow['תקציב שנתי'] || '0') || 0;
      mapped.relative_budget = parseFloat(normalizedRow.relative_budget || normalizedRow['תקציב יחסי'] || '0') || 0;
      mapped.actual_collection = parseFloat(normalizedRow.actual_collection || normalizedRow['גביה בפועל'] || '0') || 0;
      break;
      
    case 'tabarim':
      console.log('🐛 TABARIM DETAILED DEBUG:');
      console.log('🐛 Raw row object keys:', Object.keys(row));
      console.log('🐛 ALL ROW ENTRIES (FULL DEBUG):', Object.entries(row));
      console.log('🐛 HEADERS PROVIDED:', allHeaders);
      
      // Debug: Show all row values for troubleshooting
      console.log('🐛 All row key-value pairs:');
      Object.entries(row).forEach(([key, value], index) => {
        console.log(`🐛 ${index}: "${key}" = "${value}"`);
      });
      
      // Use allHeaders to find Hebrew column mapping once (more efficient)
      let columnMapping = { incomeIndex: -1, expenseIndex: -1, surplusIndex: -1 };
      if (allHeaders && allHeaders.length > 0) {
        console.log('🔍 Searching in provided headers for Hebrew columns...');
        columnMapping = findHebrewColumns(allHeaders);
      } else {
        // Fallback: search in row keys if headers not available
        console.log('🔍 No headers provided, searching in row keys...');
        const rowKeys = Object.keys(row);
        columnMapping = findHebrewColumns(rowKeys);
      }
      
      console.log('🔍 Final column mapping after search:', columnMapping);
      
      // Let's check what's actually in the funding and numeric columns
      const allEmptyKeys = Object.keys(row).filter(k => k.includes('EMPTY'));
      console.log('🐛 All EMPTY keys found:', allEmptyKeys);
      allEmptyKeys.forEach(key => {
        console.log(`🐛 ${key}: "${row[key]}"`);
      });
      
      // CRITICAL FIX: Use original row because normalizeKey lowercases the Hebrew key
      const projectName = row['ריכוז התקבולים והתשלומים של התקציב הבלתי רגיל לפי פרקי התקציב'] || '';
      
      console.log('🐛 FIXED: Extracted project name from original row:', projectName);
      
      // Skip if this looks like a header row or empty row or unwanted entries
      if (!projectName || 
          projectName.includes('דו"ח תקופתי') || 
          projectName.includes('שם תב"ר') ||
          projectName.includes('כולל קליטה') ||
          projectName.includes('בדיקת מערכת') ||
          projectName.includes('סה"כ כללי') ||
          projectName === 'בדיקת מערכת' ||
          projectName === 'סה"כ כללי' ||
          projectName.trim() === 'בדיקת מערכת' ||
          projectName.trim() === 'סה"כ כללי' ||
          projectName.length < 3) {
        console.log('🚫 Skipping unwanted row:', projectName);
        return null; // Skip this row
      }
      
      // Map tabar number from the FIRST column in Excel file
      const firstColumnKey = Object.keys(row)[0]; // Get first column key
      const tabarNumber = (row[firstColumnKey] || '').toString().trim();
      
      console.log('🔢 Tabar number mapping:', {
        firstColumnKey,
        tabarNumber,
        allColumns: Object.keys(row).slice(0, 5) // Show first 5 column names for debugging
      });
      
      // Skip rows without valid tabar number or with test numbers
      if (!tabarNumber || 
          tabarNumber === '999' || 
          tabarNumber === '' ||
          tabarNumber === 'null' ||
          tabarNumber === 'undefined' ||
          isNaN(parseInt(tabarNumber)) ||
          parseInt(tabarNumber) === 999) {
        console.log('🚫 Skipping row - invalid tabar number:', tabarNumber, 'for project:', projectName);
        return null; // Skip this row
      }
      
      // Additional check: Skip if project name contains test data patterns
      if (projectName.toLowerCase().includes('test') || 
          projectName.toLowerCase().includes('בדיקה') ||
          projectName.toLowerCase().includes('בדיקת') ||
          (tabarNumber === '999' && projectName.includes('מערכת'))) {
        console.log('🚫 Skipping test data row:', projectName, tabarNumber);
        return null; // Skip this row  
      }
      
      mapped.tabar_name = projectName;
      mapped.tabar_number = tabarNumber;
      
      // Map domain field - now accepts Hebrew text directly
      const domainValue = row['נכון לחודש 6/2025'] || 
                         normalizedRow['נכון לחודש 6/2025'] ||
                         normalizedRow.domain || 
                         normalizedRow['תחום'] || 
                         normalizedRow['תחום פעילות'] || '';
      
      console.log('🔍 Domain mapping for tabarim:', { domainValue, projectName });
      
      // Keep domain in Hebrew - now table accepts Hebrew text directly
      mapped.domain = domainValue || 'אחר';
      
      // Map funding sources - CORRECTED: Use __EMPTY_4, __EMPTY_5, __EMPTY_6
      const funding1 = row['__EMPTY_4'] && String(row['__EMPTY_4']).trim() !== 'null' ? String(row['__EMPTY_4']).trim() : null;
      const funding2 = row['__EMPTY_5'] && String(row['__EMPTY_5']).trim() !== 'null' ? String(row['__EMPTY_5']).trim() : null;
      const funding3 = row['__EMPTY_6'] && String(row['__EMPTY_6']).trim() !== 'null' ? String(row['__EMPTY_6']).trim() : null;
      
      console.log('🔍 Funding sources mapping:', { 
        domainValue: domainValue,
        projectName: projectName
      });
      
      mapped.funding_source1 = funding1;
      mapped.funding_source2 = funding2;
      mapped.funding_source3 = funding3;
      
      // Map numeric fields using specific __EMPTY_ columns as requested
      // User specified: Income=Column M (__EMPTY_12), Expense=Column N (__EMPTY_13), Surplus=Column Q (__EMPTY_16)
      console.log('🐛 All EMPTY keys already found above:', allEmptyKeys);
      
      const approvedBudgetRaw = row['__EMPTY_7'] || '0';
      const incomeActualRaw = row['__EMPTY_12'] || '0';  // Column M - "ביצוע מצטבר הכנסות"
      const expenseActualRaw = row['__EMPTY_13'] || '0'; // Column N - "ביצוע מצטבר הוצאות"  
      const surplusDeficitRaw = row['__EMPTY_16'] || '0'; // Column Q - "עודף/גירעון"
      
      console.log('🔍 Using specified columns:', {
        approved_budget: `__EMPTY_7 = "${approvedBudgetRaw}"`,
        income_actual: `__EMPTY_12 (Column M) = "${incomeActualRaw}"`,
        expense_actual: `__EMPTY_13 (Column N) = "${expenseActualRaw}"`,
        surplus_deficit: `__EMPTY_16 (Column Q) = "${surplusDeficitRaw}"`
      });
      
      // Clean numbers (remove commas if they exist)
      mapped.approved_budget = parseFloat(String(approvedBudgetRaw).replace(/,/g, '')) || 0;
      mapped.income_actual = parseFloat(String(incomeActualRaw).replace(/,/g, '')) || 0;
      mapped.expense_actual = parseFloat(String(expenseActualRaw).replace(/,/g, '')) || 0;
      mapped.surplus_deficit = parseFloat(String(surplusDeficitRaw).replace(/,/g, '')) || 0;
      
      console.log('🔍 CORRECTED numeric mapping:', { 
        raw_values: { approvedBudgetRaw, incomeActualRaw, expenseActualRaw, surplusDeficitRaw },
        parsed_values: {
          approved_budget: mapped.approved_budget, 
          income_actual: mapped.income_actual, 
          expense_actual: mapped.expense_actual, 
          surplus_deficit: mapped.surplus_deficit 
        }
      });
      
      break;
      
    case 'grants':
      // Map according to Excel structure from logs
      mapped.name = normalizedRow['__empty_1'] || row['__EMPTY_1'] || ''; // שם
      mapped.ministry = normalizedRow['סטטוס קולות קוראים ליום 11/8/2025'] || row['סטטוס קולות קוראים ליום 11/8/2025'] || ''; // משרד מממן
      mapped.status = normalizedRow['__empty_6'] || row['__EMPTY_6'] || 'draft'; // סטטוס
      
      // Handle amount field - סך תקציב הקול קורא
      const amountValue = normalizedRow['__empty_7'] || row['__EMPTY_7'] || '0';
      mapped.amount = parseFloat(String(amountValue).replace(/,/g, '').trim()) || 0;
      
      // Add more fields from Excel structure
      mapped.project_description = normalizedRow['__empty_3'] || row['__EMPTY_3'] || ''; // נושא/פרוייקט
      mapped.responsible_person = normalizedRow['__empty_5'] || row['__EMPTY_5'] || ''; // אחראי
      mapped.submission_amount = parseFloat(String(normalizedRow['__empty_8'] || row['__EMPTY_8'] || '0').replace(/,/g, '').trim()) || 0; // סכום הגשה
      mapped.support_amount = parseFloat(String(normalizedRow['__empty_9'] || row['__EMPTY_9'] || '0').replace(/,/g, '').trim()) || 0; // סכות תמיכה
      mapped.approved_amount = parseFloat(String(normalizedRow['__empty_10'] || row['__EMPTY_10'] || '0').replace(/,/g, '').trim()) || 0; // סכום אושר
      mapped.municipality_participation = parseFloat(String(normalizedRow['__empty_11'] || row['__EMPTY_11'] || '0').replace(/,/g, '').trim()) || 0; // סכום השתתפות רשות
      mapped.notes = normalizedRow['__empty_12'] || row['__EMPTY_12'] || ''; // הערות
      
      // Map department from __EMPTY_4 (מחלקה)
      const deptValue = normalizedRow['__empty_4'] || row['__EMPTY_4'] || '';
      if (deptValue && deptValue.length > 0) {
        // Map department names to slugs
        switch(deptValue.toLowerCase()) {
          case 'ספרייה':
          case 'תרבות':
            mapped.department_slug = 'non-formal';
            break;
          case 'ספורט':
            mapped.department_slug = 'welfare'; 
            break;
          case 'שפ"ע':
          case 'חינוך':
            mapped.department_slug = 'education';
            break;
          case 'צעירים':
            mapped.department_slug = 'welfare';
            break;
          default:
            mapped.department_slug = 'finance';
        }
      } else {
        mapped.department_slug = 'finance';
      }
      
      // Skip empty rows or header rows
      if (!mapped.name || mapped.name.length < 2 || 
          mapped.name.includes('שם') || 
          mapped.name.includes("מס'")) {
        console.log('🚫 Skipping grants row:', mapped.name);
        return null;
      }
      
      break;
      
    case 'budget_authorizations':
      console.log('🐛 BUDGET_AUTHORIZATIONS MAPPING DEBUG:');
      console.log('🐛 All row keys:', Object.keys(row));
      console.log('🐛 Raw row values:', Object.values(row).slice(0, 10));
      
      // Get the first column (authorization number) - usually the first key
      const firstKey = Object.keys(row)[0];
      const authNumber = row[firstKey] || '';
      
      console.log('🐛 Authorization number from first column:', { firstKey, authNumber });
      
      // Skip header rows or empty rows - more comprehensive check
      if (!authNumber || 
          authNumber.toString().includes('מספר') || 
          authNumber.toString().includes('הרשאה') ||
          authNumber.toString().includes('הרשאות') ||
          authNumber.toString() === 'הרשאות' ||
          authNumber.toString().trim() === '' ||
          authNumber.toString().length < 1 ||
          // Check if this looks like a header row by examining multiple fields
          (row[Object.keys(row)[1]] && row[Object.keys(row)[1]].toString().includes('מס\' ההרשאה')) ||
          (row[Object.keys(row)[2]] && row[Object.keys(row)[2]].toString().includes('תיאור ההרשאה'))) {
        console.log('🚫 Skipping budget authorization header/empty row:', authNumber);
        return null;
      }
      
      mapped.authorization_number = authNumber.toString().trim();
      
      // Map other columns based on Excel structure
      const allKeys = Object.keys(row);
      console.log('🐛 All available keys for mapping:', allKeys);
      
      // Ministry from second column (but validate it's not empty or a header)
      const ministryRaw = row[allKeys[1]] || row['__EMPTY_1'] || '';
      mapped.ministry = ministryRaw && !ministryRaw.toString().includes('מס\' ההרשאה') ? ministryRaw.toString().trim() : '';
      
      // Program from third column (but validate it's not empty or a header)
      const programRaw = row[allKeys[2]] || row['__EMPTY_2'] || '';
      mapped.program = programRaw && !programRaw.toString().includes('תיאור ההרשאה') ? programRaw.toString().trim() : '';
      
      // Purpose/Tabar from fourth column
      const purposeRaw = row[allKeys[3]] || row['__EMPTY_3'] || '';
      mapped.purpose = purposeRaw && !purposeRaw.toString().includes('מס\' תב"ר') ? purposeRaw.toString().trim() : '';
      
      // Amount from fifth column
      const amountRaw = row[allKeys[4]] || row['__EMPTY_4'] || '0';
      mapped.amount = parseFloat(String(amountRaw).replace(/,/g, '').trim()) || 0;
      
      // Valid until date from sixth column - but validate it's actually a date
      const validUntilRaw = row[allKeys[5]] || row['__EMPTY_5'] || '';
      if (validUntilRaw && 
          typeof validUntilRaw === 'string' && 
          validUntilRaw.length > 0 && 
          !validUntilRaw.includes('תוקף ההרשאה') &&
          !validUntilRaw.includes('מחלקה') && 
          !validUntilRaw.includes('האנרגיה') &&
          (validUntilRaw.includes('.') || validUntilRaw.includes('/') || validUntilRaw.includes('-') || validUntilRaw.includes('20'))) {
        mapped.valid_until = validUntilRaw;
      }
      
      // Department from seventh column - map to appropriate slug
      const deptRaw = row[allKeys[6]] || row['__EMPTY_6'] || '';
      console.log('🐛 Department value:', deptRaw);
      
      if (deptRaw && !deptRaw.toString().includes('מחלקה מטפלת')) {
        const deptStr = deptRaw.toString().toLowerCase();
        if (deptStr.includes('הנדסה')) {
          mapped.department_slug = 'engineering';
        } else if (deptStr.includes('חינוך')) {
          mapped.department_slug = 'education';
        } else if (deptStr.includes('תרבות')) {
          mapped.department_slug = 'non-formal';
        } else if (deptStr.includes('ספורט') || deptStr.includes('רווחה')) {
          mapped.department_slug = 'welfare';
        } else {
          mapped.department_slug = 'finance';
        }
      } else {
        mapped.department_slug = 'finance';
      }
      
      // Debug: Log all keys and their values to understand the structure
      console.log('🐛 DETAILED ROW DEBUG:');
      allKeys.forEach((key, index) => {
        console.log(`🐛 Column ${index} (${key}):`, row[key]);
      });
      
      // Approved date from eighth column (H = index 7) - validate it's actually a date
      const approvedAtRaw = row[allKeys[7]] || row['__EMPTY_7'] || '';
      console.log('🐛 APPROVAL DATE DEBUG:', { 
        column: 'index 7 (column H)', 
        allKeysLength: allKeys.length,
        keyAtIndex7: allKeys[7],
        raw: approvedAtRaw, 
        type: typeof approvedAtRaw 
      });
      
      // Try multiple approaches to find the approval date
      let foundApprovalDate = null;
      
      // Approach 1: Check column H (index 7)
      if (approvedAtRaw && 
          approvedAtRaw.toString().trim().length > 0 && 
          !approvedAtRaw.toString().includes('תאריך אישור מליאה') &&
          !approvedAtRaw.toString().includes('תאריך אישור') &&
          !approvedAtRaw.toString().includes('מחלקה')) {
        
        const dateStr = approvedAtRaw.toString().trim();
        console.log('🐛 Processing date string from column H:', dateStr);
        foundApprovalDate = processDateString(dateStr);
      }
      
      // Approach 2: If not found, search all columns for a date pattern
      if (!foundApprovalDate) {
        console.log('🐛 Date not found in column H, searching all columns...');
        for (let i = 0; i < allKeys.length; i++) {
          const colValue = row[allKeys[i]];
          if (colValue && typeof colValue === 'string') {
            const trimmed = colValue.trim();
            // Look for date patterns
            if (trimmed.match(/^\d{1,2}\.\d{1,2}\.(\d{2}|\d{4})$/) || 
                trimmed.match(/^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/)) {
              console.log(`🐛 Found potential date in column ${i} (${allKeys[i]}):`, trimmed);
              foundApprovalDate = processDateString(trimmed);
              if (foundApprovalDate) break;
            }
          }
        }
      }
      
      if (foundApprovalDate) {
        mapped.approved_at = foundApprovalDate;
        console.log('🐛 Final approved date set:', foundApprovalDate);
      }
      
      // Helper function to process date strings
      function processDateString(dateStr) {
        try {
          if (dateStr.includes('.')) {
            // DD.MM.YYYY format
            const parts = dateStr.split('.');
            if (parts.length === 3) {
              let [day, month, year] = parts;
              if (year.length === 2) {
                year = '20' + year; // Convert 24 to 2024
              }
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              console.log('🐛 Converted date:', formattedDate);
              return formattedDate;
            }
          } else if (dateStr.includes('/')) {
            // DD/MM/YYYY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              let [day, month, year] = parts;
              if (year.length === 2) {
                year = '20' + year;
              }
              const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              console.log('🐛 Converted date:', formattedDate);
              return formattedDate;
            }
          } else if (dateStr.includes('-') && dateStr.includes('20')) {
            // Already in YYYY-MM-DD format
            console.log('🐛 Date already formatted:', dateStr);
            return dateStr;
          }
        } catch (error) {
          console.log('🐛 Error processing date:', error);
        }
        return null;
      }
      
      // Notes from tenth column (J = index 9)
      const notesRaw = row[allKeys[9]] || row['__EMPTY_9'] || '';
      mapped.notes = notesRaw && !notesRaw.toString().includes('הערות') ? notesRaw.toString().trim() : '';
      
      // Default status
      mapped.status = 'pending';
      
      console.log('🐛 Final budget authorization mapping:', mapped);
      
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
      const detection = detectDataType(headersArray, rowObjects.slice(0, 5), context);
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
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id || '33333333-3333-3333-3333-333333333333'; // Fallback to demo user
    
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
            user_id: currentUserId
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
          
          const mappedRow = mapRowToTable(detected.table, row, logs, headers);
          
          if (!mappedRow) {
            console.log(`🚫 Skipping row ${i + 1} - returned null from mapping`);
            skippedCount++;
            continue;
          }

          // Add user_id and other metadata
          mappedRow.user_id = currentUserId;

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
      
      // Auto-hide after successful upload (like tabarim)
      setTimeout(() => {
        setFile(null);
        setRows([]);
        setHeaders([]);
        setDetected({ table: null, reason: '' });
        setDebugLogs([]);
      }, 2000);

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