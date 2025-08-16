import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
}

// Very lightweight header-based classifier
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

  // Finance regular budget
  if (
    ctx === "regular_budget" ||
    hasWords("קטגוריה", "category") ||
    hasWords("תקציב מאושר", "budget_amount") ||
    hasWords("ביצוע בפועל", "actual_amount") ||
    hasWords("הכנסה", "income", "הוצאה", "expense")
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

  // Finance projects / grants
  if (
    ctx === "finance" ||
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

function normalizeKey(k: string): string {
  const key = k.trim().toLowerCase();
  const map: Record<string, string> = {
    // Common Hebrew -> English
    "מספר רישיון": "license_number",
    "שם עסק": "business_name",
    "בעל העסק": "owner",
    "כתובת": "address",
    "סוג": "type",
    "סטטוס": "status",
    "תוקף": "expires_at",
    "תאריך פקיעה": "expires_at",

    // Regular budget mapping
    "קטגוריה": "category_name",
    "שם קטגוריה": "category_name",
    "סוג קטגוריה": "category_type",
    "הכנסה": "income",
    "הוצאה": "expense",
    "תקציב מאושר": "budget_amount",
    "תקציב": "budget_amount",
    "ביצוע בפועל": "actual_amount",
    "ביצוע": "actual_amount",
    "תא באקסל": "excel_cell_ref",
    "תא": "excel_cell_ref",
    "שנה": "year",

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
  return map[key] || key.replace(/\s+/g, "_");
}

function mapRowToTable(table: string, row: Record<string, any>) {
  // Normalize keys
  const norm: Record<string, any> = {};
  Object.keys(row).forEach((k) => {
    const nk = normalizeKey(String(k));
    norm[nk] = row[k];
  });

  switch (table) {
    case "regular_budget":
      return {
        category_type: norm.category_type || 
          (norm.income ? 'income' : norm.expense ? 'expense' : 
           (String(norm.category_name || '').includes('הכנסה') || 
            String(norm.category_name || '').includes('ארנונה') || 
            String(norm.category_name || '').includes('אגרת') ||
            String(norm.category_name || '').includes('היטל') ||
            String(norm.category_name || '').includes('קנס') ||
            String(norm.category_name || '').includes('רישיון')) ? 'income' : 'expense'),
        category_name: norm.category_name || norm.name,
        budget_amount: norm.budget_amount ? Number(norm.budget_amount) : null,
        actual_amount: norm.actual_amount ? Number(norm.actual_amount) : null,
        excel_cell_ref: norm.excel_cell_ref,
        year: norm.year ? Number(norm.year) : new Date().getFullYear(),
      };
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

export function DataUploader({ context = "global" }: DataUploaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [detected, setDetected] = useState<{ table: string | null; reason: string }>({ table: null, reason: "" });
  const [busy, setBusy] = useState(false);

  const onFile = async (f: File) => {
    setFile(f);
    try {
      const ab = await f.arrayBuffer();
      const wb = XLSX.read(ab, { type: "array" });
      const first = wb.SheetNames[0];
      const sheet = wb.Sheets[first];
      const data: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
      setRows(data);
      const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] as string[];
      const d = detectTarget(headers || Object.keys(data[0] || {}), context);
      setDetected(d);
      toast({ title: "קובץ נטען", description: `${data.length} שורות. ${d.reason}` });
    } catch (e: any) {
      console.error(e);
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
          title: "נדרש חיבור משתמש",
          description: "התחבר/י כדי להעלות ולשבץ נתונים לבסיס הנתונים",
          variant: "destructive",
        });
        setBusy(false);
        return;
      }

      // Check if user is demo user  
      const isDemoUser = userId.startsWith('11111111-') || userId.startsWith('22222222-') || userId.startsWith('33333333-') || 
                        userId.startsWith('44444444-') || userId.startsWith('55555555-') || userId.startsWith('66666666-') ||
                        userId.startsWith('77777777-') || userId.startsWith('88888888-') || userId.startsWith('demo-');
      
      if (isDemoUser) {
        toast({
          title: "העלאה הושלמה בהצלחה",
          description: `עובד עם ${detected.table} - הנתונים זמינים בדף הרלוונטי`,
          variant: "default",
        });
        setBusy(false);
        return;
      }

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
      const mapped = rows.map((r) => ({ 
        ...mapRowToTable(detected.table!, r), 
        user_id: userId,
        ...(deptSlug ? { department_slug: deptSlug } : {})
      }));
      // Filter out completely empty objects
      const filtered = mapped.filter((obj) => Object.values(obj).some((v) => v !== null && v !== undefined && v !== ""));

      if (filtered.length === 0) {
        toast({ title: "אין נתונים לשיבוץ", description: "בדוק/י את הקובץ והכותרות", variant: "destructive" });
        setBusy(false);
        return;
      }

      const tableName = detected.table as 'regular_budget' | 'tabarim' | 'licenses' | 'plans' | 'institutions' | 'projects' | 'grants' | 'welfare_services' | 'activities';
      const { error } = await supabase.from(tableName).insert(filtered as any);
      if (error) throw error;

      await supabase.from("ingestion_logs").insert({
        user_id: userId,
        source_file: path,
        table_name: detected.table,
        rows: filtered.length,
        status: "success",
      });

      toast({ title: "הנתונים נקלטו בהצלחה", description: `${filtered.length} שורות אל הטבלה ${detected.table}` });
      setFile(null);
      setRows([]);
      setDetected({ table: null, reason: "" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "שגיאה בקליטת נתונים", description: e.message || "", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, .xlsx"
          onChange={(e) => e.target.files && onFile(e.target.files[0])}
        />
        {file && <Badge variant="secondary">{file.name}</Badge>}
      </div>
      {detected.table && (
        <p className="text-sm text-muted-foreground">
          יעד מזוהה: <span className="font-medium">{detected.table}</span> · {detected.reason}
        </p>
      )}
      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">תצוגה מקדימה: {rows.length} שורות</p>
      )}
      <div className="flex justify-end">
        <Button onClick={uploadAndIngest} disabled={busy || !file}>
          {busy ? "מייבא..." : "ייבוא ושיבוץ"}
        </Button>
      </div>
    </div>
  );
}
