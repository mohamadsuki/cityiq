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
import Fuse from 'fuse.js';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { validateRowData } from "@/validation";
import synonymsJson from "@/mappings/synonyms.json";

type ImportOption = {
  mode: 'replace' | 'append';
  confirmed: boolean;
};

type DataUploaderProps = {
  context?: string;
  onComplete?: () => void;
  onUploadSuccess?: () => void | Promise<void>;
  onAnalysisTriggered?: () => Promise<void>;
};

type DebugLog = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
  details?: any;
};

type HeaderMapping = {
  original: string;
  canonical: string | 'לא מזוהה';
  score?: number;
  manualOverride?: string;
};

type DatasetScore = {
  dataset: string;
  score: number;
  matches: string[];
  total: number;
};

type PreviewData = {
  mappings: HeaderMapping[];
  sampleRows: Record<string, any>[];
  detectedTable: string | null;
  detectionScores?: DatasetScore[];
  needsManualSelection?: boolean;
  recommendation?: string;
};

type DatasetSelectionData = {
  scores: DatasetScore[];
  recommendation: string;
};

// Fuzzy matching threshold constant
const FUZZY_MATCH_THRESHOLD = 85;

// Dataset definitions with core canonical fields
const DATASET_DEFINITIONS = {
  'budget_authorizations': {
    name: 'הרשאות תקציביות',
    coreFields: ['authorization_number', 'ministry', 'amount', 'valid_until', 'program'],
    description: 'הרשאות תקציביות ממשרדי ממשלה'
  },
  'grants': {
    name: 'קולות קוראים וגרנטים',
    coreFields: ['grant_name', 'ministry', 'grant_amount', 'grant_status', 'submitted_at'],
    description: 'מענקים וקולות קוראים'
  },
  'tabarim': {
    name: 'תב"רים',
    coreFields: ['tabar_name', 'tabar_number', 'approved_budget', 'income_actual', 'expense_actual'],
    description: 'תקציב בלתי רגיל'
  },
  'regular_budget': {
    name: 'תקציב רגיל',
    coreFields: ['category_name', 'budget_amount', 'actual_amount', 'category_type'],
    description: 'תקציב רגיל לפי קטגוריות'
  },
  'collection_data': {
    name: 'נתוני גביה',
    coreFields: ['property_type', 'annual_budget', 'actual_collection', 'relative_budget'],
    description: 'נתוני גביית ארנונה ומסים'
  },
  'salary_data': {
    name: 'נתוני שכר',
    coreFields: ['quarter', 'general_salary', 'education_salary', 'welfare_salary'],
    description: 'משכורות עובדי הרשות'
  },
  'institutions': {
    name: 'מוסדות חינוך',
    coreFields: ['institution_name', 'address', 'institution_type', 'students'],
    description: 'מוסדות חינוך ברשות'
  },
  'business_licenses': {
    name: 'רישיונות עסק',
    coreFields: ['business_name', 'license_holder', 'license_number', 'license_type', 'status'],
    description: 'רישיונות עסק ופעילות'
  }
} as const;

const detectDataType = (headers: string[], rows: Record<string, any>[], context?: string): { 
  table: string | null; 
  reason: string; 
  scores?: DatasetScore[];
  needsManualSelection?: boolean;
  recommendation?: string;
} => {
  console.log('🔍 detectDataType called with headers:', headers, 'context:', context);
  
  if (!headers || headers.length === 0) {
    return { table: null, reason: 'לא נמצאו כותרות' };
  }
  
  // Score each dataset based on header matches
  const datasetScores: DatasetScore[] = [];
  
  Object.entries(DATASET_DEFINITIONS).forEach(([datasetKey, definition]) => {
    const coreFields = definition.coreFields;
    let matchCount = 0;
    const matches: string[] = [];
    
    headers.forEach(header => {
      const normalized = normalizeKey(header, undefined, datasetKey);
      
      // Check direct match
      if ([...coreFields].includes(normalized as any)) {
        matchCount++;
        matches.push(`${header} → ${normalized} (ישיר)`);
        return;
      }
      
      // Check fuzzy match
      const synonymsMap = buildSynonymsMap(datasetKey);
      const fuzzyMatch = resolveCanonicalHeader(header, synonymsMap, FUZZY_MATCH_THRESHOLD);
      if (fuzzyMatch && [...coreFields].includes(fuzzyMatch as any)) {
        matchCount++;
        matches.push(`${header} → ${fuzzyMatch} (מטושטש)`);
      }
    });
    
    const score = (matchCount / coreFields.length) * 100;
    datasetScores.push({
      dataset: datasetKey,
      score: Math.round(score),
      matches,
      total: coreFields.length
    });
  });
  
  // Sort by score descending
  datasetScores.sort((a, b) => b.score - a.score);
  
  console.log('📊 Dataset scores:', datasetScores);
  
  // Check if we have a clear winner
  if (datasetScores.length === 0 || datasetScores[0].score === 0) {
    return { 
      table: null, 
      reason: 'לא זוהה התאמה לאף סוג נתונים',
      scores: datasetScores
    };
  }
  
  const topScore = datasetScores[0];
  const secondScore = datasetScores[1];
  
  // Check if top two scores are too close (difference < 20 points)
  if (secondScore && Math.abs(topScore.score - secondScore.score) < 20 && topScore.score < 80) {
    return {
      table: null,
      reason: `זיהוי לא חד משמעי - נדרשת בחירה ידנית`,
      scores: datasetScores,
      needsManualSelection: true,
      recommendation: topScore.dataset
    };
  }
  
  // We have a clear winner
  const matchText = `${topScore.matches.length}/${topScore.total} התאמות`;
  return {
    table: topScore.dataset,
    reason: `זוהה כ-${DATASET_DEFINITIONS[topScore.dataset as keyof typeof DATASET_DEFINITIONS].name} (${matchText}, ${topScore.score}%)`,
    scores: datasetScores
  };
};

// Function to resolve canonical header using fuzzy matching
const resolveCanonicalHeader = (header: string, synonymsMap: Record<string, string[]>, threshold = FUZZY_MATCH_THRESHOLD): string | null => {
  // Create a flat list of all synonyms with their canonical fields
  const synonymsList: { canonical: string; synonym: string }[] = [];
  
  Object.entries(synonymsMap).forEach(([canonical, synonyms]) => {
    synonyms.forEach(synonym => {
      synonymsList.push({ canonical, synonym });
    });
  });

  // Use Fuse.js for fuzzy matching
  const fuse = new Fuse(synonymsList, {
    keys: ['synonym'],
    threshold: (100 - threshold) / 100, // Convert percentage to Fuse threshold (0-1, lower = more strict)
    includeScore: true
  });

  const results = fuse.search(header);
  
  if (results.length > 0 && results[0].score !== undefined) {
    const score = Math.round((1 - results[0].score) * 100); // Convert back to percentage
    const matched = results[0].item;
    
    console.debug('Fuzzy match', { 
      original: header, 
      matched: matched.synonym, 
      canonical: matched.canonical,
      score 
    });
    
    if (score >= threshold) {
      return matched.canonical;
    }
  }
  
  return null;
};

// Function to build synonyms map for a specific dataset
const buildSynonymsMap = (datasetKey: string): Record<string, string[]> => {
  try {
    const synonymsData = synonymsJson as any;
    const datasetSynonyms = synonymsData[datasetKey] || {};
    const commonSynonyms = synonymsData.common || {};
    
    // Merge dataset-specific synonyms with common ones
    return { ...commonSynonyms, ...datasetSynonyms };
  } catch (error) {
    console.warn('Failed to load synonyms, using fallback', error);
    return getFallbackSynonymsMap();
  }
};

// Fallback synonyms map for backward compatibility
const getFallbackSynonymsMap = (): Record<string, string[]> => {
  return {
    // Institution fields
    'institution_name': ['שם המוסד', 'שם מוסד', 'מוסד'],
    'address': ['כתובת', 'מען', 'כתובת המוסד'],
    'phone': ['טלפון', 'טל', 'מספר טלפון'],
    'institution_type': ['סוג המוסד', 'סוג מוסד', 'קטגוריה'],
    
    // Business license fields  
    'business_name': ['שם העסק', 'שם עסק', 'עסק'],
    'license_holder': ['בעל הרישיון', 'בעל רישיון', 'בעלים'],
    'license_number': ['מספר רישיון', 'מס רישיון', 'מס\' רישיון'],
    'license_type': ['סוג הרישיון', 'סוג רישיון', 'קטגוריית רישיון'],
    'issue_date': ['תאריך הנפקה', 'תאריך נפקה', 'הונפק ב'],
    'expiry_date': ['תאריך תפוגה', 'תפוגה', 'פוגה ב'],
    'status': ['סטטוס', 'מצב', 'סטאטוס'],
    
    // Budget fields
    'category_name': ['קטגוריה', 'שם קטגוריה', 'שם הקטגוריה'],
    'category_type': ['סוג', 'סוג קטגוריה', 'טיפוס'],
    'budget_amount': ['תקציב', 'סכום תקציב', 'תקציב מאושר'],
    'actual_amount': ['ביצוע', 'בפועל', 'ביצוע בפועל'],
    
    // Collection fields
    'property_type': ['סוג נכס', 'סוג הנכס', 'נכס'],
    'annual_budget': ['תקציב שנתי', 'תקציב לשנה', 'תקציב'],
    'relative_budget': ['תקציב יחסי', 'תקציב יחסי %', 'אחוז תקציב'],
    'actual_collection': ['גביה בפועל', 'גביה', 'גבייה בפועל'],
    
    // Tabarim fields
    'tabar_name': ['שם תב"ר', 'שם התב"ר', 'תב"ר'],
    'tabar_number': ['מספר תב"ר', 'מס תב"ר', 'מס\' תב"ר'],
    'domain': ['תחום', 'תחום פעילות', 'תחום עיסוק'],
    'funding_source1': ['מקור מימון', 'מקור מימון 1', 'מימון'],
    'approved_budget': ['תקציב מאושר', 'תקציב', 'אושר'],
    'income_actual': ['הכנסות בפועל', 'הכנסות', 'הכנסה בפועל'],
    'expense_actual': ['הוצאות בפועל', 'הוצאות', 'הוצאה בפועל'],
    
    // Grants fields
    'grant_name': ['שם הקול קורא', 'שם', 'קול קורא', 'שם גרנט'],
    'ministry': ['משרד', 'משרד ממשלתי', 'גוף מממן'],
    'grant_amount': ['סכום', 'תקציב גרנט', 'סכום גרנט'],
    'grant_status': ['סטטוס גרנט', 'מצב גרנט', 'סטטוס'],
    'submitted_at': ['תאריך הגשה', 'הוגש ב', 'תאריך הגשת הבקשה'],
    'decision_at': ['תאריך החלטה', 'החלטה ב', 'תאריך תשובה'],
    
    // Budget Authorization fields
    'authorization_number': ['מספר הרשאה', 'מס הרשאה', 'מס\' הרשאה'],
    'program': ['תוכנית', 'תכנית', 'פרוגרמה'],
    'purpose': ['מס\' תב"ר', 'מספר תב"ר', 'מטרה'],
    'amount': ['סכום ההרשאה', 'סכום', 'סכום מאושר'],
    'valid_until': ['תוקף ההרשאה', 'תוקף', 'בתוקף עד'],
    'department': ['מחלקה מטפלת', 'מחלקה', 'יחידה מטפלת'],
    'approved_at': ['תאריך אישור מליאה', 'אושר ב', 'תאריך אישור'],
    'notes': ['הערות', 'הערה', 'הארות'],
    'quarter': ['רבעון', 'רבע', 'ק'],
    'general_salary': ['משכורת כללית', 'שכר כללי', 'כללי'],
    'education_salary': ['משכורת חינוך', 'שכר חינוך', 'חינוך'],
    'welfare_salary': ['משכורת רווחה', 'שכר רווחה', 'רווחה'],
    'students': ['תלמידים', 'מספר תלמידים', 'כמות תלמידים']
  };
};

const normalizeKey = (k: string, debugLogs?: DebugLog[], datasetKey?: string) => {
  const original = k;
  let normalized = k.toLowerCase().trim();
  
  // Get synonyms map - use dataset-specific if available, otherwise fallback
  const synonymsMap = datasetKey ? buildSynonymsMap(datasetKey) : getFallbackSynonymsMap();

  // First, try direct exact match in synonyms
  for (const [canonical, synonyms] of Object.entries(synonymsMap)) {
    if (synonyms.includes(original)) {
      normalized = canonical;
      if (debugLogs) {
        debugLogs.push({
          id: Math.random().toString(),
          type: 'info',
          message: `מיפוי ישיר: "${original}" → "${normalized}"`,
          timestamp: new Date()
        });
      }
      return normalized;
    }
  }

  // If no direct match, try fuzzy matching
  const fuzzyMatch = resolveCanonicalHeader(original, synonymsMap, FUZZY_MATCH_THRESHOLD);
  if (fuzzyMatch) {
    normalized = fuzzyMatch;
    if (debugLogs) {
      debugLogs.push({
        id: Math.random().toString(),
        type: 'info',
        message: `מיפוי מטושטש: "${original}" → "${normalized}"`,
        timestamp: new Date()
      });
    }
    return normalized;
  }

  // If still no match, mark as unrecognized
  if (debugLogs) {
    debugLogs.push({
      id: Math.random().toString(),
      type: 'warning',
      message: `כותרת לא מזוהה: "${original}" - נדרש מיפוי ידני`,
      timestamp: new Date()
    });
  }
  
  return normalized;
};

function DataUploader({ context, onComplete, onUploadSuccess, onAnalysisTriggered }: DataUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [detected, setDetected] = useState<{ table: string | null; reason: string }>({ table: null, reason: '' });
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDatasetSelection, setShowDatasetSelection] = useState(false);
  const [datasetSelectionData, setDatasetSelectionData] = useState<DatasetSelectionData | null>(null);
  const [importOption, setImportOption] = useState<ImportOption>({ mode: 'replace', confirmed: false });
  const { toast } = useToast();

  // Get all canonical field names for manual mapping
  const getAllCanonicalFields = () => {
    const synonymsMap: Record<string, string[]> = {
      'institution_name': ['שם המוסד', 'שם מוסד', 'מוסד'],
      'address': ['כתובת', 'מען', 'כתובת המוסד'],
      'phone': ['טלפון', 'טל', 'מספר טלפון'],
      'institution_type': ['סוג המוסד', 'סוג מוסד', 'קטגוריה'],
      'business_name': ['שם העסק', 'שם עסק', 'עסק'],
      'license_holder': ['בעל הרישיון', 'בעל רישיון', 'בעלים'],
      'license_number': ['מספר רישיון', 'מס רישיון', 'מס\' רישיון'],
      'license_type': ['סוג הרישיון', 'סוג רישיון', 'קטגוריית רישיון'],
      'issue_date': ['תאריך הנפקה', 'תאריך נפקה', 'הונפק ב'],
      'expiry_date': ['תאריך תפוגה', 'תפוגה', 'פוגה ב'],
      'status': ['סטטוס', 'מצב', 'סטאטוס'],
      'category_name': ['קטגוריה', 'שם קטגוריה', 'שם הקטגוריה'],
      'category_type': ['סוג', 'סוג קטגוריה', 'טיפוס'],
      'budget_amount': ['תקציב', 'סכום תקציב', 'תקציב מאושר'],
      'actual_amount': ['ביצוע', 'בפועל', 'ביצוע בפועל'],
      'property_type': ['סוג נכס', 'סוג הנכס', 'נכס'],
      'annual_budget': ['תקציב שנתי', 'תקציב לשנה', 'תקציב'],
      'relative_budget': ['תקציב יחסי', 'תקציב יחסי %', 'אחוז תקציב'],
      'actual_collection': ['גביה בפועל', 'גביה', 'גבייה בפועל'],
      'tabar_name': ['שם תב"ר', 'שם התב"ר', 'תב"ר'],
      'tabar_number': ['מספר תב"ר', 'מס תב"ר', 'מס\' תב"ר'],
      'domain': ['תחום', 'תחום פעילות', 'תחום עיסוק'],
      'funding_source1': ['מקור מימון', 'מקור מימון 1', 'מימון'],
      'approved_budget': ['תקציב מאושר', 'תקציב', 'אושר'],
      'income_actual': ['הכנסות בפועל', 'הכנסות', 'הכנסה בפועל'],
      'expense_actual': ['הוצאות בפועל', 'הוצאות', 'הוצאה בפועל'],
      'grant_name': ['שם הקול קורא', 'שם', 'קול קורא', 'שם גרנט'],
      'ministry': ['משרד', 'משרד ממשלתי', 'גוף מממן'],
      'grant_amount': ['סכום', 'תקציב גרנט', 'סכום גרנט'],
      'grant_status': ['סטטוס גרנט', 'מצב גרנט', 'סטטוס'],
      'submitted_at': ['תאריך הגשה', 'הוגש ב', 'תאריך הגשת הבקשה'],
      'decision_at': ['תאריך החלטה', 'החלטה ב', 'תאריך תשובה'],
      'authorization_number': ['מספר הרשאה', 'מס הרשאה', 'מס\' הרשאה'],
      'program': ['תוכנית', 'תכנית', 'פרוגרמה'],
      'purpose': ['מס\' תב"ר', 'מספר תב"ר', 'מטרה'],
      'amount': ['סכום ההרשאה', 'סכום', 'סכום מאושר'],
      'valid_until': ['תוקף ההרשאה', 'תוקף', 'בתוקף עד'],
      'department': ['מחלקה מטפלת', 'מחלקה', 'יחידה מטפלת'],
      'approved_at': ['תאריך אישור מליאה', 'אושר ב', 'תאריך אישור'],
      'notes': ['הערות', 'הערה', 'הארות']
    };
    return Object.keys(synonymsMap);
  };

  const buildHeaderMappings = (headers: string[]): HeaderMapping[] => {
    return headers.map(header => {
      const debugLogs: DebugLog[] = [];
      const normalized = normalizeKey(header, debugLogs);
      
      // Check if it was successfully mapped
      if (normalized === header.toLowerCase().trim()) {
        // Not mapped, try fuzzy matching
        const synonymsMap: Record<string, string[]> = {
          'institution_name': ['שם המוסד', 'שם מוסד', 'מוסד'],
          'address': ['כתובת', 'מען', 'כתובת המוסד'],
          'phone': ['טלפון', 'טל', 'מספר טלפון'],
          'institution_type': ['סוג המוסד', 'סוג מוסד', 'קטגוריה'],
          'business_name': ['שם העסק', 'שם עסק', 'עסק'],
          'license_holder': ['בעל הרישיון', 'בעל רישיון', 'בעלים'],
          'license_number': ['מספר רישיון', 'מס רישיון', 'מס\' רישיון'],
          'license_type': ['סוג הרישיון', 'סוג רישיון', 'קטגוריית רישיון'],
          'issue_date': ['תאריך הנפקה', 'תאריך נפקה', 'הונפק ב'],
          'expiry_date': ['תאריך תפוגה', 'תפוגה', 'פוגה ב'],
          'status': ['סטטוס', 'מצב', 'סטאטוס'],
          'category_name': ['קטגוריה', 'שם קטגוריה', 'שם הקטגוריה'],
          'category_type': ['סוג', 'סוג קטגוריה', 'טיפוס'],
          'budget_amount': ['תקציב', 'סכום תקציב', 'תקציב מאושר'],
          'actual_amount': ['ביצוע', 'בפועל', 'ביצוע בפועל'],
          'property_type': ['סוג נכס', 'סוג הנכס', 'נכס'],
          'annual_budget': ['תקציב שנתי', 'תקציב לשנה', 'תקציב'],
          'relative_budget': ['תקציב יחסי', 'תקציב יחסי %', 'אחוז תקציב'],
          'actual_collection': ['גביה בפועל', 'גביה', 'גבייה בפועל'],
          'tabar_name': ['שם תב"ר', 'שם התב"ר', 'תב"ר'],
          'tabar_number': ['מספר תב"ר', 'מס תב"ר', 'מס\' תב"ר'],
          'domain': ['תחום', 'תחום פעילות', 'תחום עיסוק'],
          'funding_source1': ['מקור מימון', 'מקור מימון 1', 'מימון'],
          'approved_budget': ['תקציב מאושר', 'תקציב', 'אושר'],
          'income_actual': ['הכנסות בפועל', 'הכנסות', 'הכנסה בפועל'],
          'expense_actual': ['הוצאות בפועל', 'הוצאות', 'הוצאה בפועל'],
          'grant_name': ['שם הקול קורא', 'שם', 'קול קורא', 'שם גרנט'],
          'ministry': ['משרד', 'משרד ממשלתי', 'גוף מממן'],
          'grant_amount': ['סכום', 'תקציב גרנט', 'סכום גרנט'],
          'grant_status': ['סטטוס גרנט', 'מצב גרנט', 'סטטוס'],
          'submitted_at': ['תאריך הגשה', 'הוגש ב', 'תאריך הגשת הבקשה'],
          'decision_at': ['תאריך החלטה', 'החלטה ב', 'תאריך תשובה'],
          'authorization_number': ['מספר הרשאה', 'מס הרשאה', 'מס\' הרשאה'],
          'program': ['תוכנית', 'תכנית', 'פרוגרמה'],
          'purpose': ['מס\' תב"ר', 'מספר תב"ר', 'מטרה'],
          'amount': ['סכום ההרשאה', 'סכום', 'סכום מאושר'],
          'valid_until': ['תוקף ההרשאה', 'תוקף', 'בתוקף עד'],
          'department': ['מחלקה מטפלת', 'מחלקה', 'יחידה מטפלת'],
          'approved_at': ['תאריך אישור מליאה', 'אושר ב', 'תאריך אישור'],
          'notes': ['הערות', 'הערה', 'הארות']
        };
        const fuzzyMatch = resolveCanonicalHeader(header, synonymsMap, FUZZY_MATCH_THRESHOLD);
        if (fuzzyMatch) {
          // Extract score from console.debug call
          const synonymsList: { canonical: string; synonym: string }[] = [];
          Object.entries(synonymsMap).forEach(([canonical, synonyms]) => {
            synonyms.forEach(synonym => {
              synonymsList.push({ canonical, synonym });
            });
          });
          const fuse = new Fuse(synonymsList, {
            keys: ['synonym'],
            threshold: (100 - FUZZY_MATCH_THRESHOLD) / 100,
            includeScore: true
          });
          const results = fuse.search(header);
          const score = results.length > 0 && results[0].score !== undefined ? 
            Math.round((1 - results[0].score) * 100) : 0;
          
          return {
            original: header,
            canonical: fuzzyMatch,
            score
          };
        } else {
          return {
            original: header,
            canonical: 'לא מזוהה' as const
          };
        }
      } else {
        return {
          original: header,
          canonical: normalized,
          score: 100 // Exact match
        };
      }
    });
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    
    console.log('🔥 onFile called with file:', f.name, 'context:', context);
    setFile(f);
    setDebugLogs([]);
    
    const addLog = (type: DebugLog['type'], message: string, details?: any) => {
      console.log(`📋 [${type}] ${message}`, details || '');
      setDebugLogs(prev => [...prev, {
        id: Math.random().toString(),
        type,
        message,
        timestamp: new Date(),
        details
      }]);
    };

    try {
      addLog('info', `מתחיל לקרוא קובץ: ${f.name}`);
      
      const arrayBuffer = await f.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (workbook.SheetNames.length === 0) {
        addLog('error', 'הקובץ לא מכיל גליונות');
        return;
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        addLog('error', 'לא ניתן לקרוא את הגליון הראשון');
        return;
      }
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (jsonData.length === 0) {
        addLog('error', 'הקובץ ריק');
        return;
      }
      
      // Find the first row with actual field headers (not title rows)
      let headerRowIndex = 0;
      let headersArray: string[] = [];
      
      // Look for the row that contains the most meaningful field headers
      for (let i = 0; i < Math.min(jsonData.length, 10); i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;
        
        // Convert to strings and clean
        const potentialHeaders = row.map(h => String(h || '').trim()).filter(h => h);
        
        if (potentialHeaders.length === 0) continue;
        
        // Skip obvious title rows (single cell or very generic content)
        if (potentialHeaders.length === 1) {
          addLog('info', `מדלג על שורת כותרת: "${potentialHeaders[0]}"`);
          continue;
        }
        
        // Check if this looks like a header row by testing synonyms matching
        let matchCount = 0;
        const synonymsMap = buildSynonymsMap(context || '');
        
        for (const header of potentialHeaders) {
          // Check if header matches any known field
          for (const [canonical, synonyms] of Object.entries(synonymsMap)) {
            if (synonyms.some(syn => syn.includes(header) || header.includes(syn))) {
              matchCount++;
              break;
            }
          }
        }
        
        // If we found some matches, this is likely our header row
        if (matchCount > 0 || i > 3) { // After row 3, take what we get
          headersArray = potentialHeaders;
          headerRowIndex = i;
          addLog('info', `מצא שורת כותרות בשורה ${i + 1}: ${headersArray.join(', ')}`);
          break;
        }
      }
      
      if (headersArray.length === 0) {
        addLog('error', 'לא נמצאה שורת כותרות תקינה');
        return;
      }
      
      const dataRows = jsonData.slice(headerRowIndex + 1) as any[];
      
      addLog('info', `נמצאו ${headersArray.length} כותרות ו-${dataRows.length} שורות נתונים`);
      
      // Convert to objects
      const rowObjects = dataRows.map((row: any[], index: number) => {
        const obj: Record<string, any> = {};
        headersArray.forEach((header: string, colIndex: number) => {
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
      
      if (detection.needsManualSelection && detection.scores) {
        // Show dataset selection dialog
        setDatasetSelectionData({
          scores: detection.scores,
          recommendation: detection.recommendation || detection.scores[0].dataset
        });
        setShowDatasetSelection(true);
        addLog('warning', detection.reason);
        return;
      }
      
      setDetected(detection);
      
      if (detection.table) {
        addLog('success', detection.reason);
        
        // Build header mappings and show preview dialog
        const mappings = buildHeaderMappings(headersArray);
        const sampleRows = rowObjects.slice(0, 10);
        
        setPreviewData({
          mappings,
          sampleRows,
          detectedTable: detection.table,
          detectionScores: detection.scores,
          needsManualSelection: detection.needsManualSelection,
          recommendation: detection.recommendation
        });
        
        setShowPreviewDialog(true);
      } else {
        addLog('warning', detection.reason);
      }
      
    } catch (error) {
      console.error('Error reading file:', error);
      addLog('error', `שגיאה בקריאת הקובץ: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    }
  };

  const selectDatasetAndProceed = (selectedDataset: string) => {
    setDetected({ 
      table: selectedDataset, 
      reason: `נבחר ידנית: ${DATASET_DEFINITIONS[selectedDataset as keyof typeof DATASET_DEFINITIONS].name}` 
    });
    setShowDatasetSelection(false);
    
    // Continue with preview
    if (headers.length > 0) {
      const mappings = buildHeaderMappings(headers);
      const sampleRows = rows.slice(0, 10);
      
      setPreviewData({
        mappings,
        sampleRows,
        detectedTable: selectedDataset,
        detectionScores: datasetSelectionData?.scores
      });
      
      setShowPreviewDialog(true);
    }
  };

  const confirmPreviewAndProceed = () => {
    if (!previewData?.detectedTable) return;
    
    setDetected({ 
      table: previewData.detectedTable, 
      reason: `זוהה כ: ${previewData.detectedTable}` 
    });
    setShowPreviewDialog(false);
    setShowImportDialog(true);
  };

  const updateManualMapping = (originalHeader: string, newCanonical: string) => {
    if (!previewData) return;
    
    const updatedMappings = previewData.mappings.map(mapping => 
      mapping.original === originalHeader 
        ? { ...mapping, canonical: newCanonical, manualOverride: newCanonical }
        : mapping
    );
    
    setPreviewData({
      ...previewData,
      mappings: updatedMappings
    });
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
    
    // Reset cancellation flag and progress
    setIsCancelled(false);
    setProgressStatus('מתחיל...');
    setProcessedRows(0);
    setTotalRows(rows.length);
    setUploadProgress(0);
    
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

      // Check for cancellation
      if (isCancelled) {
        addLog('warning', 'העליה בוטלה על ידי המשתמש');
        return;
      }

      // Upload file to storage first
      setProgressStatus('מעלה קובץ...');
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

      addLog('success', 'קובץ הועלה בהצלחה');

      // Create ingestion log entry
      const { data: logEntry } = await supabase
        .from('ingestion_logs')
        .insert({
          user_id: currentUserId,
          table_name: detected.table,
          source_file: file.name,
          rows: rows.length,
          status: 'processing',
          context,
          file_path: filePath,
          detected_table: detected.table,
          file_name: file.name
        })
        .select()
        .single();

      // Clear existing data if replace mode
      if (importOption.mode === 'replace') {
        addLog('info', `מוחק נתונים קיימים מטבלה: ${detected.table}`);
        const { error: deleteError } = await supabase
          .from(detected.table as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except non-existent record

        if (deleteError) {
          console.error('Error clearing existing data:', deleteError);
          addLog('warning', `שגיאה במחיקת נתונים קיימים: ${deleteError.message}`);
        } else {
          addLog('success', 'נתונים קיימים נמחקו בהצלחה');
        }
      }

      // Process and insert data with batch processing
      let insertedCount = 0;
      let errorCount = 0;
      
      // Helper function to create SHA-256 hash
      const createRowHash = async (row: Record<string, any>, canonicalFields: string[]): Promise<string> => {
        const values = canonicalFields
          .map(field => String(row[field] || '').trim())
          .filter(value => value.length > 0)
          .join('|');
        
        const encoder = new TextEncoder();
        const data = encoder.encode(values);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };

      // Get canonical fields for the detected table
      const datasetDef = DATASET_DEFINITIONS[detected.table as keyof typeof DATASET_DEFINITIONS];
      const canonicalFields = datasetDef ? [...datasetDef.coreFields] : [];

      // Prepare all rows first
      setProgressStatus('ממפה נתונים...');
      setUploadProgress(10);
      const allMappedRows: Record<string, any>[] = [];
      
      addLog('info', 'מכין נתונים למיפוי...');
      
      // Check for cancellation
      if (isCancelled) {
        addLog('warning', 'העליה בוטלה על ידי המשתמש');
        return;
      }
      for (const row of rows) {
        const normalizedRow: Record<string, any> = {
          user_id: currentUserId
        };

        // Map headers using the preview mappings if available
        if (previewData?.mappings) {
          previewData.mappings.forEach(mapping => {
            const value = row[mapping.original];
            const targetField = mapping.manualOverride || mapping.canonical;
            
            if (targetField !== 'לא מזוהה' && value !== undefined && value !== null && value !== '') {
              normalizedRow[targetField] = value;
            }
          });
        } else {
          // Fallback to old mapping logic
          Object.entries(row).forEach(([key, value]) => {
            if (key === '__rowNum__') return;
            
            const normalizedKey = normalizeKey(key, undefined, detected.table!);
            if (value !== undefined && value !== null && value !== '') {
              normalizedRow[normalizedKey] = value;
            }
          });
        }
        
        allMappedRows.push(normalizedRow);
      }

      // Remove duplicates based on canonical fields hash and validate rows
      setProgressStatus('בודק כפילויות ומוודא תקינות...');
      setUploadProgress(20);
      addLog('info', 'בודק כפילויות ומוודא תקינות...');
      const hashSet = new Set<string>();
      const mappedRows: Record<string, any>[] = [];
      let skippedDuplicates = 0;
      let validationFailures = 0;

      for (const row of allMappedRows) {
        // Validate row first
        const validation = validateRowData(row, detected.table!);
        if (!validation.isValid) {
          validationFailures++;
          addLog('warning', `שורה נפסלה בולידציה: ${validation.error}`);
          continue;
        }

        const hash = await createRowHash(row, canonicalFields);
        
        if (hashSet.has(hash)) {
          skippedDuplicates++;
          continue;
        }
        
        hashSet.add(hash);
        mappedRows.push(row);
      }

      if (skippedDuplicates > 0) {
        addLog('info', `נמצאו ${skippedDuplicates} כפילויות, ${mappedRows.length} שורות ייחודיות נותרו`);
      }
      
      if (validationFailures > 0) {
        addLog('info', `שורות שנפסלו ע"י ולידציה: ${validationFailures}`);
      }

      // Process in batches with binary backoff
      setProgressStatus('מכניס נתונים...');
      setUploadProgress(30);
      const BATCH_SIZE = 500;
      const FALLBACK_BATCH_SIZE = 50;
      const totalBatches = Math.ceil(mappedRows.length / BATCH_SIZE);
      
      addLog('info', `מעבד ${totalBatches} אצוות של ${BATCH_SIZE} שורות...`);

      for (let i = 0; i < mappedRows.length; i += BATCH_SIZE) {
        // Check for cancellation before each batch
        if (isCancelled) {
          addLog('warning', 'העליה בוטלה על ידי המשתמש');
          return;
        }

        const batch = mappedRows.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        setProgressStatus(`מכניס נתונים (אצווה ${batchNumber}/${totalBatches})...`);
        setProcessedRows(i);
        
        try {
          // Try large batch first (without .select() to reduce server response)
          const { error: batchError } = await supabase
            .from(detected.table as any)
            .insert(batch);

          if (batchError) {
            throw batchError;
          }
          
          insertedCount += batch.length;
          addLog('info', `אצווה ${batchNumber}/${totalBatches} הושלמה (${batch.length} שורות)`);
          
        } catch (batchError) {
          console.warn(`Batch ${batchNumber} failed, trying smaller batches:`, batchError);
          addLog('warning', `אצווה ${batchNumber} נכשלה, מנסה אצוות קטנות יותר...`);
          
          // Binary backoff: split to smaller batches
          for (let j = 0; j < batch.length; j += FALLBACK_BATCH_SIZE) {
            const smallBatch = batch.slice(j, j + FALLBACK_BATCH_SIZE);
            
            try {
              const { error: smallBatchError } = await supabase
                .from(detected.table as any)
                .insert(smallBatch);

              if (smallBatchError) {
                console.error(`Small batch error:`, smallBatchError);
                errorCount += smallBatch.length;
              } else {
                insertedCount += smallBatch.length;
              }
            } catch (error) {
              console.error('Small batch processing error:', error);
              errorCount += smallBatch.length;
            }
          }
        }
        
         // Update progress after batch completion
         const progressPercent = 30 + ((i + batch.length) / mappedRows.length) * 60; // 30-90% for data insertion
         setUploadProgress(Math.round(progressPercent));
         setProcessedRows(i + batch.length);
      }

      // Final progress update
      setProgressStatus('מסיים עיבוד...');
      setUploadProgress(95);
      setProcessedRows(mappedRows.length);

      // Update ingestion log
      if (logEntry) {
        await supabase
          .from('ingestion_logs')
          .update({
            status: errorCount === 0 ? 'completed' : 'completed_with_errors',
            inserted_rows: insertedCount,
            error_rows: errorCount
          })
          .eq('id', logEntry.id);
      }

      if (insertedCount > 0) {
        setProgressStatus('הושלם בהצלחה!');
        setUploadProgress(100);
        const successMessage = `הטענה הושלמה בהצלחה: ${insertedCount} שורות נטענו${skippedDuplicates > 0 ? `. נמנעו כפילויות: ${skippedDuplicates}` : ''}${validationFailures > 0 ? `. שורות שנפסלו ע"י ולידציה: ${validationFailures}` : ''}`;
        addLog('success', successMessage);
        if (errorCount > 0) {
          addLog('warning', `${errorCount} שורות לא נטענו בגלל שגיאות`);
        }
        
        toast({
          title: "הטענה הושלמה",
          description: `${insertedCount} שורות נטענו בהצלחה${skippedDuplicates > 0 ? `. נמנעו כפילויות: ${skippedDuplicates}` : ''}${validationFailures > 0 ? `. שורות שנפסלו ע"י ולידציה: ${validationFailures}` : ''}${errorCount > 0 ? ` (${errorCount} שגיאות)` : ''}`,
        });
        
        onComplete?.();
        onUploadSuccess?.();
      } else {
        throw new Error('לא נטענו נתונים');
      }

    } catch (error) {
      console.error('Upload and ingestion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      addLog('error', `שגיאה בהטענה: ${errorMessage}`);
      
      toast({
        variant: "destructive",
        title: "שגיאה בהטענה",
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
      setProgressStatus('');
      setUploadProgress(0);
      setProcessedRows(0);
      setTotalRows(0);
    }
  }, [file, detected.table, rows, debugLogs, importOption, context, toast, onComplete, onUploadSuccess, previewData]);

  const handleCancelUpload = () => {
    setIsCancelled(true);
    toast({
      title: "ביטול העליה",
      description: "העליה תבוטל לאחר השלמת האצווה הנוכחית",
    });
  };

  const handleConfirmImport = async (mode: 'replace' | 'append') => {
    setImportOption({ mode, confirmed: true });
    setShowImportDialog(false);
    
    // Continue with the upload process
    await uploadAndIngest();
  };

  const clearData = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setDetected({ table: null, reason: '' });
    setDebugLogs([]);
    setImportOption({ mode: 'replace', confirmed: false });
    setIsUploading(false);
    setIsCancelled(false);
    setUploadProgress(0);
    setProgressStatus('');
    setProcessedRows(0);
    setTotalRows(0);
    setPreviewData(null);
    setShowPreviewDialog(false);
    setShowDatasetSelection(false);
    setDatasetSelectionData(null);
  };

  const renderDatasetSelectionDialog = () => {
    if (!datasetSelectionData) return null;

    return (
      <Dialog open={showDatasetSelection} onOpenChange={setShowDatasetSelection}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>בחירת סוג נתונים</DialogTitle>
            <DialogDescription>
              זוהו מספר אפשרויות לסוג הנתונים. בחר את הסוג המתאים ביותר:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {datasetSelectionData.scores.filter(s => s.score > 0).map((scoreData, index) => {
              const definition = DATASET_DEFINITIONS[scoreData.dataset as keyof typeof DATASET_DEFINITIONS];
              const isRecommended = scoreData.dataset === datasetSelectionData.recommendation;
              
              return (
                <div key={scoreData.dataset} className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-colors",
                  isRecommended && "border-primary bg-primary/5",
                  "hover:bg-muted/50"
                )} onClick={() => selectDatasetAndProceed(scoreData.dataset)}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {definition.name}
                        {isRecommended && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            מומלץ
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {definition.description}
                      </p>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-primary">
                        {scoreData.score}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scoreData.matches.length}/{scoreData.total} התאמות
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm font-medium">התאמות שנמצאו:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {scoreData.matches.map((match, idx) => (
                        <div key={idx} className="text-muted-foreground font-mono">
                          {match}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setShowDatasetSelection(false)}>
              ביטול
            </Button>
            <Button onClick={() => selectDatasetAndProceed(datasetSelectionData.recommendation)}>
              בחר מומלץ: {DATASET_DEFINITIONS[datasetSelectionData.recommendation as keyof typeof DATASET_DEFINITIONS].name}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderPreview = () => {
    if (rows.length === 0) return null;

    const previewRows = rows.slice(0, 3);
    
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">תצוגה מקדימה:</h3>
        <div className="border rounded-lg overflow-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-3 py-2 text-right font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {previewRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/50">
                  {headers.map((header, colIndex) => (
                    <td key={colIndex} className="px-3 py-2 text-right">
                      {String(row[header] || '')}
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

  const renderPreviewDialog = () => {
    if (!previewData) return null;

    const unrecognizedCount = previewData.mappings.filter(m => m.canonical === 'לא מזוהה').length;
    const canonicalFields = getAllCanonicalFields();

    return (
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה - מיפוי כותרות</DialogTitle>
            <DialogDescription>
              בדוק את מיפוי הכותרות לפני טעינת הנתונים. 
              {unrecognizedCount > 0 && (
                <span className="text-warning font-medium">
                  {" "}נמצאו {unrecognizedCount} כותרות לא מזוהות - נדרש מיפוי ידני.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Header Mappings Table */}
            <div>
              <h3 className="text-lg font-medium mb-3">מיפוי כותרות</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 grid grid-cols-4 gap-4 font-medium text-sm">
                  <div>כותרת מקורית</div>
                  <div>שדה יעד</div>
                  <div>ציון התאמה</div>
                  <div>פעולה</div>
                </div>
                <div className="divide-y max-h-64 overflow-auto">
                  {previewData.mappings.map((mapping, index) => (
                    <div key={index} className="px-4 py-3 grid grid-cols-4 gap-4 items-center text-sm">
                      <div className="font-mono">{mapping.original}</div>
                      <div className={cn(
                        "font-mono",
                        mapping.canonical === 'לא מזוהה' && "text-warning"
                      )}>
                        {mapping.canonical}
                      </div>
                      <div>
                        {mapping.score !== undefined ? (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs",
                            mapping.score === 100 && "bg-success/20 text-success",
                            mapping.score >= 85 && mapping.score < 100 && "bg-warning/20 text-warning",
                            mapping.score < 85 && "bg-destructive/20 text-destructive"
                          )}>
                            {mapping.score}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                      <div>
                        {mapping.canonical === 'לא מזוהה' && (
                          <select
                            className="text-xs border rounded px-2 py-1 w-full"
                            onChange={(e) => updateManualMapping(mapping.original, e.target.value)}
                            value={mapping.manualOverride || ''}
                          >
                            <option value="">בחר שדה...</option>
                            {canonicalFields.map(field => (
                              <option key={field} value={field}>{field}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Data Preview */}
            <div>
              <h3 className="text-lg font-medium mb-3">תצוגה מקדימה של הנתונים (10 שורות ראשונות)</h3>
              <div className="border rounded-lg overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {previewData.mappings.map((mapping, index) => (
                        <th key={index} className="px-3 py-2 text-right font-medium">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">{mapping.original}</div>
                            <div className={cn(
                              "font-mono text-xs",
                              mapping.canonical === 'לא מזוהה' && "text-warning"
                            )}>
                              {mapping.manualOverride || mapping.canonical}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.sampleRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-muted/50">
                        {previewData.mappings.map((mapping, colIndex) => (
                          <td key={colIndex} className="px-3 py-2 text-right">
                            {String(row[mapping.original] || '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPreviewDialog(false)}
            >
              ביטול
            </Button>
            <Button 
              onClick={confirmPreviewAndProceed}
              disabled={unrecognizedCount > 0 && previewData.mappings.some(m => m.canonical === 'לא מזוהה')}
            >
              אישור טעינה
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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

          {isUploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>{progressStatus}</span>
                <span>{processedRows.toLocaleString()} / {totalRows.toLocaleString()} שורות</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>התקדמות:</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelUpload}
                  disabled={isCancelled}
                >
                  {isCancelled ? 'מבטל...' : 'ביטול'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={() => setShowPreviewDialog(true)}
              disabled={!file || !headers.length || isUploading}
              variant="outline"
              className="flex-1"
            >
              <FileUp className="w-4 h-4 mr-2" />
              תצוגה מקדימה
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderPreviewDialog()}
      {renderDatasetSelectionDialog()}

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

export { DataUploader };
export default DataUploader;