import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Target, ListChecks, BarChart3, CheckCircle } from "lucide-react";
import type { DepartmentSlug } from "@/lib/demoAccess";

// Project row type aligned with DB
export type ProjectStatus = string; // free text in DB
export type ProjectDomain = string; // free text in DB (e.g., "מבני ציבור", "תשתיות", "חינוך")

type Project = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: DepartmentSlug | null;
  code: string | null;
  name: string | null;
  department: string | null; // optional free text in DB
  domain: ProjectDomain | null;
  funding_source: string | null;
  status: ProjectStatus | null;
  budget_approved: number | null;
  budget_executed: number | null;
  progress: number | null; // 0-100
  notes: string | null;
  image_urls: string[] | null; // storage paths or data URLs in demo
};

const DEPARTMENT_LABELS: Record<DepartmentSlug, string> = {
  finance: "כספים",
  education: "חינוך",
  engineering: "הנדסה",
  welfare: "רווחה",
  "non-formal": "חינוך בלתי פורמלי",
  business: "עסקים",
  ceo: "מנכ\"ל",
};

const ALL_DEPARTMENTS: DepartmentSlug[] = [
  "finance",
  "education",
  "engineering",
  "welfare",
  "non-formal",
  "business",
];

export default function ProjectsApp() {
  const { role, departments, user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isDemo = !session;
  const canCreate = role === "mayor" || role === "ceo" || role === "manager";
  const canDelete = role === "mayor" || role === "ceo";

  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [department, setDepartment] = useState<"all" | DepartmentSlug>(
    (searchParams.get("department") as DepartmentSlug) || "all"
  );
  const [status, setStatus] = useState<string>("all");
  const [domain, setDomain] = useState<string>("all");

  const visibleDepartments: DepartmentSlug[] = (role === "mayor" || role === "ceo") ? ALL_DEPARTMENTS : departments;

  useEffect(() => {
    if (department === "all") {
      searchParams.delete("department");
    } else {
      searchParams.set("department", department);
    }
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  async function fetchProjects() {
    setLoading(true);
    if (isDemo) {
      try {
        const raw = localStorage.getItem("demo_projects");
        const list = raw ? (JSON.parse(raw) as Project[]) : [];
        setProjects(list);
      } catch {
        setProjects([]);
      }
      setLoading(false);
      return;
    }

    let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (department !== "all") {
      query = query.eq("department_slug", department);
    }
    const { data, error } = await query;
    if (error) {
      console.error("Failed to load projects", error);
      toast({ title: "שגיאה בטעינת פרויקטים", description: error.message, variant: "destructive" });
      setProjects([]);
    } else {
      setProjects((data || []) as Project[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (q && !(`${p.name ?? ""} ${p.code ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (department !== "all" && p.department_slug !== department) return false;
      if (status !== "all" && (p.status ?? "").toLowerCase() !== status.toLowerCase()) return false;
      if (domain !== "all" && (p.domain ?? "").toLowerCase() !== domain.toLowerCase()) return false;
      return true;
    });
  }, [projects, q, department, status, domain]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewing, setViewing] = useState<Project | null>(null);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [editing, setEditing] = useState<Project | null>(null);
const [form, setForm] = useState<Partial<Project>>({
  name: "",
  code: "",
  department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
  domain: "",
  status: "תכנון",
  funding_source: "",
  budget_approved: null,
  budget_executed: null,
  progress: 0,
  notes: "",
  image_urls: [],
});

  const [files, setFiles] = useState<File[]>([]);

function openCreate() {
  setEditing(null);
  setForm({
    name: "",
    code: "",
    department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
    domain: "",
    status: "תכנון",
    funding_source: "",
    budget_approved: null,
    budget_executed: null,
    progress: 0,
    notes: "",
    image_urls: [],
  });
  setFiles([]);
  setOpen(true);
}

function openEdit(p: Project) {
  setEditing(p);
  setForm({ ...p });
  setFiles([]);
  setOpen(true);
}

  function openView(p: Project) {
    setViewing(p);
    setResolvedImages([]);
    setViewOpen(true);
    const paths = p.image_urls || [];
    if (!paths.length) return;
    if (isDemo) {
      setResolvedImages(paths);
      return;
    }
    Promise.all(paths.map(async (path) => {
      const { data, error } = await supabase.storage.from('uploads').createSignedUrl(path, 3600);
      if (error) return null;
      return data?.signedUrl || null;
    })).then((urls) => setResolvedImages(urls.filter(Boolean) as string[]));
  }

  async function saveProject() {
  if (!form.name || !form.department_slug) {
    toast({ title: "שדות חסרים", description: "שם ומחלקה הינם שדות חובה", variant: "destructive" });
    return;
  }

  if (isDemo) {
    const now = new Date().toISOString();
    const toDataURL = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const newImageUrls = files.length ? await Promise.all(files.map(toDataURL)) : [];
    const payload: Project = {
      id: editing?.id ?? (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())),
      created_at: editing?.created_at ?? now,
      updated_at: now,
      user_id: "demo",
      department_slug: form.department_slug ?? null,
      code: (form.code as string) || null,
      name: (form.name as string) || null,
      department: null,
      domain: (form.domain as string) || null,
      funding_source: (form.funding_source as string) || null,
      status: (form.status as string) || null,
      budget_approved: form.budget_approved ?? null,
      budget_executed: form.budget_executed ?? null,
      progress: form.progress ?? 0,
      notes: (form.notes as string) || null,
      image_urls: [ ...(editing?.image_urls || []), ...newImageUrls ],
    };

    let next: Project[] = [];
    try {
      const raw = localStorage.getItem("demo_projects");
      const list = raw ? (JSON.parse(raw) as Project[]) : [];
      next = editing ? list.map((x) => (x.id === editing.id ? payload : x)) : [payload, ...list];
    } catch {
      next = [payload];
    }
    localStorage.setItem("demo_projects", JSON.stringify(next));
    setProjects(next);
    toast({ title: editing ? "עודכן" : "נוצר", description: "הפרויקט נשמר (מצב הדגמה)" });
    setFiles([]);
    setOpen(false);
    return;
  }

  if (!user?.id) {
    toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
    return;
  }

  const basePayload: any = {
    department_slug: form.department_slug,
    code: form.code ?? null,
    name: form.name ?? null,
    domain: form.domain ?? null,
    status: form.status ?? null,
    funding_source: form.funding_source ?? null,
    budget_approved: form.budget_approved ?? null,
    budget_executed: form.budget_executed ?? null,
    progress: form.progress ?? null,
    notes: form.notes ?? null,
  };

  if (editing) {
    // Upload any new images for existing project
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const path = `projects/${editing.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('Upload failed', upErr);
      } else {
        uploadedPaths.push(path);
      }
    }
    const combined = [ ...(editing.image_urls || []), ...uploadedPaths ];
    const resp = await supabase.from("projects").update({ ...basePayload, image_urls: combined }).eq("id", editing.id);
    const error = resp.error as any;
    if (error) {
      console.error("Failed to save project", error);
      toast({ title: "שמירת פרויקט נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הצלחה", description: "הפרויקט נשמר בהצלחה" });
      setFiles([]);
      setOpen(false);
      fetchProjects();
    }
  } else {
    // Create project first to get ID
    const createResp = await supabase.from("projects").insert([{ ...basePayload, user_id: user.id }]).select().single();
    if (createResp.error) {
      console.error("Failed to create project", createResp.error);
      toast({ title: "שמירת פרויקט נכשלה", description: createResp.error.message, variant: "destructive" });
      return;
    }
    const created = createResp.data as Project;

    // Upload images if any
    const uploadedPaths: string[] = [];
    for (const file of files) {
      const path = `projects/${created.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
      if (upErr) {
        console.error('Upload failed', upErr);
      } else {
        uploadedPaths.push(path);
      }
    }
    if (uploadedPaths.length > 0) {
      const updResp = await supabase.from("projects").update({ image_urls: uploadedPaths }).eq("id", created.id);
      if (updResp.error) {
        console.error("Failed to attach images", updResp.error);
        toast({ title: "שגיאה בהעלאת תמונות", description: updResp.error.message, variant: "destructive" });
      }
    }
    toast({ title: "הצלחה", description: "הפרויקט נשמר בהצלחה" });
    setFiles([]);
    setOpen(false);
    fetchProjects();
  }
}

  async function deleteProject(p: Project) {
    if (!canDelete) return;
    if (!confirm("למחוק פרויקט זה?")) return;

    if (isDemo) {
      const next = projects.filter((x) => x.id !== p.id);
      localStorage.setItem("demo_projects", JSON.stringify(next));
      setProjects(next);
      toast({ title: "נמחק", description: "הפרויקט נמחק (מצב הדגמה)" });
      return;
    }

    const { error } = await supabase.from("projects").delete().eq("id", p.id);
    if (error) {
      toast({ title: "מחיקה נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נמחק", description: "הפרויקט נמחק" });
      fetchProjects();
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פרויקטים</h1>
          <p className="text-sm text-muted-foreground">ניהול פרויקטים עירוניים לפי מחלקות</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>פרויקט חדש</Button>
        )}
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-red-700">12</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-red-800">פרויקטים בעיכוב</div>
              <div className="text-sm text-red-600">התקדמות פחות מ-10% כבר יותר מחודש</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ListChecks className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold text-blue-700">85</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-blue-800">פרויקטים בביצוע ותכנון</div>
              <div className="text-sm text-blue-600">45 בביצוע, 40 בתכנון</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-green-700">₪180M</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-green-800">התפלגות לפי מחלקות</div>
              <div className="text-sm text-green-600">הנדסה: ₪120M, חינוך: ₪35M, רווחה: ₪25M</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="text-3xl font-bold text-purple-700">127</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-purple-800">סה״כ פרויקטים פעילים</div>
              <div className="text-sm text-purple-600">פרויקטים פעילים בכל המחלקות</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="q">חיפוש</Label>
            <Input id="q" placeholder="חיפוש לפי שם/קוד" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label>מחלקה</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as any)}>
              <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                {visibleDepartments.map((d) => (
                  <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>סטטוס</Label>
<Select value={status} onValueChange={(v) => setStatus(v)}>
  <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
  <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
    <SelectItem value="all">הכל</SelectItem>
    <SelectItem value="תכנון">תכנון</SelectItem>
    <SelectItem value="ביצוע">ביצוע</SelectItem>
    <SelectItem value="סיום">סיום</SelectItem>
    <SelectItem value="תקוע">תקוע</SelectItem>
  </SelectContent>
</Select>
          </div>
          <div>
            <Label>תחום</Label>
            <Select value={domain} onValueChange={(v) => setDomain(v)}>
              <SelectTrigger><SelectValue placeholder="תחום" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="מבני ציבור">מבני ציבור</SelectItem>
                <SelectItem value="תשתיות">תשתיות</SelectItem>
                <SelectItem value="חינוך">חינוך</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2">שם</th>
              <th className="py-2">קוד</th>
              <th className="py-2">מחלקה</th>
              <th className="py-2">תחום</th>
              <th className="py-2">סטטוס</th>
              <th className="py-2">תקציב מאושר</th>
              <th className="py-2">תקציב מבוצע</th>
              <th className="py-2">התקדמות</th>
              <th className="py-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="py-6" colSpan={9}>טוען…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="py-6" colSpan={9}>לא נמצאו פרויקטים</td></tr>
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-3 font-medium">{p.name || "—"}</td>
                <td className="py-3">{p.code || "—"}</td>
                <td className="py-3">{p.department_slug ? DEPARTMENT_LABELS[p.department_slug] : "—"}</td>
                <td className="py-3">{p.domain || "—"}</td>
                <td className="py-3">
                  {p.status ? <Badge>{p.status}</Badge> : "—"}
                </td>
                <td className="py-3">{p.budget_approved != null ? `₪${Number(p.budget_approved).toLocaleString()}` : "—"}</td>
                <td className="py-3">{p.budget_executed != null ? `₪${Number(p.budget_executed).toLocaleString()}` : "—"}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24"><Progress value={p.progress ?? 0} /></div>
                    <span className="text-sm text-muted-foreground">{p.progress ?? 0}%</span>
                  </div>
                </td>
                <td className="py-3 space-x-2 space-x-reverse">
                  <Button variant="secondary" size="sm" onClick={() => openView(p)}>צפייה</Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(p)}>עריכה</Button>
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => deleteProject(p)}>מחיקה</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי פרויקט</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>שם</Label>
                  <div>{viewing.name || "—"}</div>
                </div>
                <div>
                  <Label>קוד</Label>
                  <div>{viewing.code || "—"}</div>
                </div>
                <div>
                  <Label>מחלקה</Label>
                  <div>{viewing.department_slug ? DEPARTMENT_LABELS[viewing.department_slug] : "—"}</div>
                </div>
                <div>
                  <Label>סטטוס</Label>
                  <div>{viewing.status || "—"}</div>
                </div>
                <div>
                  <Label>תחום</Label>
                  <div>{viewing.domain || "—"}</div>
                </div>
                <div>
                  <Label>מקור מימון</Label>
                  <div>{viewing.funding_source || "—"}</div>
                </div>
                <div>
                  <Label>תקציב מאושר</Label>
                  <div>{viewing.budget_approved != null ? `₪${Number(viewing.budget_approved).toLocaleString()}` : "—"}</div>
                </div>
                <div>
                  <Label>תקציב מבוצע</Label>
                  <div>{viewing.budget_executed != null ? `₪${Number(viewing.budget_executed).toLocaleString()}` : "—"}</div>
                </div>
                <div className="md:col-span-2">
                  <Label>הערות</Label>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{viewing.notes || "—"}</div>
                </div>
              </div>
              <div>
                <Label>תמונות</Label>
                {resolvedImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {resolvedImages.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`תמונה לפרויקט ${viewing.name || ""}`} className="w-full h-40 object-cover rounded-md border border-border" loading="lazy" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">אין תמונות</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "עריכת פרויקט" : "פרויקט חדש"}</DialogTitle>
            <DialogDescription className="sr-only">טופס יצירה/עריכת פרויקט</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>שם הפרויקט</Label>
              <Input value={(form.name as string) || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>

            <div>
              <Label>קוד</Label>
              <Input value={(form.code as string) || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
            </div>

            <div>
              <Label>מחלקה</Label>
              <Select value={(form.department_slug as DepartmentSlug) ?? "finance"} onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}>
                <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {visibleDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>תחום</Label>
              <Input value={(form.domain as string) || ""} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} placeholder="לדוגמה: מבני ציבור / תשתיות / חינוך" />
            </div>

<div>
  <Label>סטטוס</Label>
  <Select value={(form.status as string) || "תכנון"} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
    <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
    <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
      <SelectItem value="תכנון">תכנון</SelectItem>
      <SelectItem value="ביצוע">ביצוע</SelectItem>
      <SelectItem value="סיום">סיום</SelectItem>
      <SelectItem value="תקוע">תקוע</SelectItem>
    </SelectContent>
  </Select>
</div>

<div>
  <Label>מקור מימון</Label>
  <Input value={(form.funding_source as string) || ""} onChange={(e) => setForm((f) => ({ ...f, funding_source: e.target.value }))} />
</div>

<div className="md:col-span-2">
  <Label>הערות</Label>
  <Textarea value={(form.notes as string) || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="הוספת הערות כלליות על הפרויקט" />
</div>

            <div>
              <Label>תקציב מאושר (₪)</Label>
              <Input type="number" value={(form.budget_approved as number | null) ?? ""} onChange={(e) => setForm((f) => ({ ...f, budget_approved: e.target.value ? Number(e.target.value) : null }))} />
            </div>

            <div>
              <Label>תקציב מבוצע (₪)</Label>
              <Input type="number" value={(form.budget_executed as number | null) ?? ""} onChange={(e) => setForm((f) => ({ ...f, budget_executed: e.target.value ? Number(e.target.value) : null }))} />
            </div>

<div>
  <Label>התקדמות (%)</Label>
  <Input type="number" min={0} max={100} value={(form.progress as number | null) ?? 0} onChange={(e) => setForm((f) => ({ ...f, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) }))} />
</div>

<div className="md:col-span-2">
  <Label>תמונות פרויקט</Label>
  <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
  <p className="text-xs text-muted-foreground mt-1">
    נבחרו {files.length} קבצים. {editing?.image_urls?.length ? `(${editing.image_urls.length} תמונות קיימות)` : ""}
  </p>
</div>
</div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={saveProject}>{editing ? "שמירה" : "יצירה"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
