import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import type { DepartmentSlug } from "@/lib/demoAccess";

// Task types as per DB
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "todo" | "in_progress" | "blocked" | "done" | "cancelled";

type Task = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  department_slug: DepartmentSlug;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_at: string | null;
  progress_percent: number | null;
  progress_notes: string | null;
  tags: string[] | null;
};

const ALL_DEPARTMENTS: DepartmentSlug[] = [
  "finance",
  "education",
  "engineering",
  "welfare",
  "non-formal",
  "business",
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "לביצוע",
  in_progress: "בתהליך",
  blocked: "חסום",
  done: "הושלם",
  cancelled: "בוטל",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "נמוכה",
  medium: "בינונית",
  high: "גבוהה",
  urgent: "דחוף",
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

function statusBadgeVariant(status: TaskStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "todo":
      return "secondary";
    case "in_progress":
      return "default";
    case "blocked":
      return "destructive";
    case "done":
      return "secondary";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

function priorityBadgeVariant(priority: TaskPriority): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "low":
      return "outline";
    case "medium":
      return "secondary";
    case "high":
      return "default";
    case "urgent":
      return "destructive";
    default:
      return "secondary";
  }
}

const DATE_TIME_FORMAT_OPTS: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" };

export default function TasksApp() {
  const { role, departments, user, session } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [department, setDepartment] = useState<"all" | DepartmentSlug>("all");

  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  // Form state
  const [form, setForm] = useState<Partial<Task>>({
    title: "",
    description: "",
    department_slug: (departments?.[0] ?? "finance") as DepartmentSlug,
    priority: "medium",
    status: "todo",
    due_at: "",
    progress_percent: 0,
    progress_notes: "",
  });

  const canCreate = role === "mayor" || role === "ceo";
  const canDelete = role === "mayor" || role === "ceo";
  const isDemo = !session;

  const visibleDepartments: DepartmentSlug[] = (role === "mayor" || role === "ceo") ? ALL_DEPARTMENTS : departments;

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (q && !(`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (department !== "all" && t.department_slug !== department) return false;
      return true;
    });
  }, [tasks, q, status, priority, department]);

  async function fetchTasks() {
    setLoading(true);
    if (isDemo) {
      try {
        const raw = localStorage.getItem("demo_tasks");
        const list = raw ? (JSON.parse(raw) as Task[]) : [];
        setTasks(list);
      } catch (e) {
        console.error("Failed to parse demo tasks", e);
        setTasks([]);
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("due_at", { ascending: true });
    if (error) {
      console.error("Failed to load tasks", error);
      toast({ title: "שגיאה בטעינת משימות", description: error.message, variant: "destructive" });
    } else {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      department_slug: (visibleDepartments?.[0] ?? "finance") as DepartmentSlug,
      priority: "medium",
      status: "todo",
      due_at: "",
      progress_percent: 0,
      progress_notes: "",
    });
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({ ...task });
    setOpen(true);
  }

  async function saveTask() {
    if (isDemo) {
      if (!(form.title && (form.department_slug as string))) {
        toast({ title: "שדות חסרים", description: "כותרת ומחלקה חובה", variant: "destructive" });
        return;
      }
      const now = new Date().toISOString();
      const payload: Task = {
        id: editing?.id ?? (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now())),
        title: form.title as string,
        description: (form.description as string) ?? "",
        created_by: "demo",
        updated_at: now,
        created_at: editing?.created_at ?? now,
        due_at: form.due_at || null,
        progress_percent: (form.progress_percent as number) ?? 0,
        progress_notes: (form.progress_notes as string) ?? "",
        department_slug: form.department_slug as DepartmentSlug,
        priority: (form.priority as TaskPriority) ?? "medium",
        status: (form.status as TaskStatus) ?? "todo",
        tags: (form.tags as string[]) ?? [],
      };

      let next = [] as Task[];
      try {
        const raw = localStorage.getItem("demo_tasks");
        const list = raw ? (JSON.parse(raw) as Task[]) : [];
        if (editing) {
          next = list.map((t) => (t.id === editing.id ? { ...payload } : t));
        } else {
          next = [{ ...payload }, ...list];
        }
      } catch {
        next = [payload];
      }
      localStorage.setItem("demo_tasks", JSON.stringify(next));
      setTasks(next);
      toast({ title: editing ? "עודכן" : "נוצר", description: "המשימה נשמרה (מצב הדגמה)" });
      setOpen(false);
      return;
    }

    if (!user?.id) {
      toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
      return;
    }

    const payload: any = {
      title: form.title,
      description: form.description,
      department_slug: form.department_slug,
      priority: form.priority,
      status: form.status,
      due_at: form.due_at || null,
      progress_percent: form.progress_percent ?? null,
      progress_notes: form.progress_notes ?? null,
      tags: form.tags ?? null,
    };

    let error;
    if (editing) {
      const resp = await supabase.from("tasks").update(payload).eq("id", editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase
        .from("tasks")
        .insert([{ ...payload, created_by: user.id }]);
      error = resp.error as any;
    }

    if (error) {
      console.error("Failed to save task", error);
      toast({ title: "שמירת משימה נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "הצלחה", description: "המשימה נשמרה בהצלחה" });
      setOpen(false);
      fetchTasks();
    }
  }

  async function deleteTask(task: Task) {
    if (!canDelete) return;
    if (!confirm("למחוק משימה זו?")) return;

    if (isDemo) {
      const next = tasks.filter((t) => t.id !== task.id);
      localStorage.setItem("demo_tasks", JSON.stringify(next));
      setTasks(next);
      toast({ title: "נמחק", description: "המשימה נמחקה (מצב הדגמה)" });
      return;
    }

    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) {
      toast({ title: "מחיקה נכשלה", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "נמחק", description: "המשימה נמחקה" });
      fetchTasks();
    }
  }

  const isManager = role === "manager";
  const managerEditable = (key: string) => {
    return ["status", "progress_percent", "progress_notes"].includes(key);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">משימות</h1>
          <p className="text-sm text-muted-foreground">ניהול משימות הנהלה לראשי המחלקות</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>משימה חדשה</Button>
        )}
      </header>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="q">חיפוש</Label>
            <Input id="q" placeholder="חיפוש לפי כותרת/תיאור" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="todo">לביצוע</SelectItem>
                <SelectItem value="in_progress">בתהליך</SelectItem>
                <SelectItem value="blocked">חסום</SelectItem>
                <SelectItem value="done">הושלם</SelectItem>
                <SelectItem value="cancelled">בוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>עדיפות</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
              <SelectTrigger><SelectValue placeholder="עדיפות" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="low">נמוכה</SelectItem>
                <SelectItem value="medium">בינונית</SelectItem>
                <SelectItem value="high">גבוהה</SelectItem>
                <SelectItem value="urgent">דחוף</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2">כותרת</th>
              <th className="py-2">מחלקה</th>
              <th className="py-2">עדיפות</th>
              <th className="py-2">סטטוס</th>
              <th className="py-2">דד-ליין</th>
              <th className="py-2">התקדמות</th>
              <th className="py-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="py-6" colSpan={7}>טוען…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td className="py-6" colSpan={7}>לא נמצאו משימות</td></tr>
            )}
            {!loading && filtered.map((t) => (
              <tr key={t.id} className="border-b border-border">
                <td className="py-3 font-medium">{t.title}</td>
                <td className="py-3">{DEPARTMENT_LABELS[t.department_slug]}</td>
                <td className="py-3">
                  <Badge variant={priorityBadgeVariant(t.priority)}>{PRIORITY_LABELS[t.priority]}</Badge>
                </td>
                <td className="py-3">
                  <Badge variant={statusBadgeVariant(t.status)}>{STATUS_LABELS[t.status]}</Badge>
                </td>
                <td className="py-3">{t.due_at ? new Date(t.due_at).toLocaleString('he-IL', DATE_TIME_FORMAT_OPTS) : "—"}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Progress value={t.progress_percent ?? 0} />
                    </div>
                    <span className="text-sm text-muted-foreground">{t.progress_percent ?? 0}%</span>
                  </div>
                </td>
                <td className="py-3 space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}>עריכה</Button>
                  {canDelete && (
                    <Button variant="destructive" size="sm" onClick={() => deleteTask(t)}>מחיקה</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">

          <DialogHeader>
            <DialogTitle>{editing ? "עריכת משימה" : "משימה חדשה"}</DialogTitle>
            <DialogDescription className="sr-only">טופס יצירה/עריכת משימה</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div className="md:col-span-2">
              <Label>כותרת</Label>
              <Input
                value={form.title as string}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                disabled={isManager && !managerEditable("title")}
              />
            </div>

            <div>
              <Label>{role === "mayor" ? "יעד" : "מחלקה"}</Label>
              <Select
                value={(form.department_slug as DepartmentSlug) ?? "finance"}
                onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}
              >
                <SelectTrigger disabled={isManager && !managerEditable("department_slug")}><SelectValue aria-label={role === "mayor" ? "יעד" : "מחלקה"} /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {(role === "mayor" ? (["ceo", ...ALL_DEPARTMENTS] as DepartmentSlug[]) : visibleDepartments).map((d) => (
                    <SelectItem key={d} value={d}>{DEPARTMENT_LABELS[d]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>עדיפות</Label>
              <Select
                value={(form.priority as TaskPriority) ?? "medium"}
                onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}
              >
                <SelectTrigger disabled={isManager && !managerEditable("priority")}><SelectValue aria-label="עדיפות" /></SelectTrigger>
                 <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                   <SelectItem value="low">נמוכה</SelectItem>
                   <SelectItem value="medium">בינונית</SelectItem>
                   <SelectItem value="high">גבוהה</SelectItem>
                   <SelectItem value="urgent">דחוף</SelectItem>
                 </SelectContent>
              </Select>
            </div>

            <div>
              <Label>סטטוס</Label>
              <Select
                value={(form.status as TaskStatus) ?? "todo"}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}
              >
                <SelectTrigger><SelectValue aria-label="סטטוס" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="todo">לביצוע</SelectItem>
                  <SelectItem value="in_progress">בתהליך</SelectItem>
                  <SelectItem value="blocked">חסום</SelectItem>
                  <SelectItem value="done">הושלם</SelectItem>
                  <SelectItem value="cancelled">בוטל</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>דד-ליין</Label>
              <Input
                type="datetime-local"
                value={form.due_at ? new Date(form.due_at).toISOString().slice(0,16) : ""}
                onChange={(e) => setForm((f) => ({ ...f, due_at: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                disabled={isManager && !managerEditable("due_at")}
              />
            </div>

            <div>
              <Label>התקדמות (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.progress_percent ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, progress_percent: Number(e.target.value) }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label>תיאור</Label>
              <Textarea
                value={form.description as string}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                disabled={isManager && !managerEditable("description")}
              />
            </div>

            <div className="md:col-span-2">
              <Label>עדכון/הערות</Label>
              <Textarea
                value={form.progress_notes as string}
                onChange={(e) => setForm((f) => ({ ...f, progress_notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={saveTask}>{editing ? "עדכון" : "יצירה"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
