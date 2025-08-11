import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
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
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Partial<Project>>({
    name: "",
    code: "",
    department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
    domain: "",
    status: "בתהליך",
    funding_source: "",
    budget_approved: null,
    budget_executed: null,
    progress: 0,
  });

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      code: "",
      department_slug: (department !== "all" ? department : (visibleDepartments?.[0] ?? "finance")) as DepartmentSlug,
      domain: "",
      status: "בתהליך",
      funding_source: "",
      budget_approved: null,
      budget_executed: null,
      progress: 0,
    });
    setOpen(true);
  }

  function openEdit(p: Project) {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  }

  async function saveProject() {
    if (!form.name || !form.department_slug) {
      toast({ title: "שדות חסרים", description: "שם ומחלקה הינם שדות חובה", variant: "destructive" });
      return;
    }

    if (isDemo) {
      const now = new Date().toISOString();
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
      setOpen(false);
      return;
    }

    if (!user?.id) {
      toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
      return;
    }

    const payload: any = {
      department_slug: form.department_slug,
      code: form.code ?? null,
      name: form.name ?? null,
      domain: form.domain ?? null,
      status: form.status ?? null,
      funding_source: form.funding_source ?? null,
      budget_approved: form.budget_approved ?? null,
      budget_executed: form.budget_executed ?? null,
      progress: form.progress ?? null,
    };

    let error;
    if (editing) {
      const resp = await supabase.from("projects").update(payload).eq("id", editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase.from("projects").insert([{ ...payload, user_id: user.id }]);
      error = resp.error as any;
    }

    if (error) {
      console.error("Failed to save project", error);
      toast({ title: "שמירת פרויקט נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הצלחה", description: "הפרויקט נשמר בהצלחה" });
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
                <SelectItem value="מתוכנן">מתוכנן</SelectItem>
                <SelectItem value="בתהליך">בתהליך</SelectItem>
                <SelectItem value="הושלם">הושלם</SelectItem>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
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
              <Input value={(form.status as string) || ""} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} placeholder="מתוכנן / בתהליך / הושלם" />
            </div>

            <div>
              <Label>מקור מימון</Label>
              <Input value={(form.funding_source as string) || ""} onChange={(e) => setForm((f) => ({ ...f, funding_source: e.target.value }))} />
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
