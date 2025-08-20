import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Eye, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DepartmentSlug } from "@/lib/demoAccess";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";

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
  assigned_by_role?: 'mayor' | 'ceo' | 'manager';
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
  "city-improvement": "מחלקת שיפור פני העיר",
  enforcement: "אכיפה",
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
  const [searchParams] = useSearchParams();
  
  // Task detail modal for highlighted task from banner
  const taskId = searchParams.get("taskId");
  const [highlightedTask, setHighlightedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [department, setDepartment] = useState<"all" | DepartmentSlug>("all");

  // Handle filtering from "What's New" section
  const filter = searchParams.get("filter");
  const period = searchParams.get("period");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

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
  

  const visibleDepartments: DepartmentSlug[] = (role === "mayor" || role === "ceo") ? ALL_DEPARTMENTS : departments;

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (q && !(`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (role === "manager" && departments && !departments.includes(t.department_slug)) return false;
      if (department !== "all" && t.department_slug !== department) return false;
      
      // Apply filter from "What's New" section
      if (filter === 'completed' && period) {
        const now = new Date();
        let from: Date, to: Date;
        
        if (period === 'custom' && fromParam && toParam) {
          from = new Date(fromParam);
          to = new Date(toParam);
        } else {
          // Calculate date range based on period
          to = now;
          switch (period) {
            case 'week':
              from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default: // day
              from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
        }
        
        // Show only completed tasks in the time range
        if (t.status !== 'done') return false;
        const updatedAt = new Date(t.updated_at);
        if (updatedAt < from || updatedAt > to) return false;
      }
      
      return true;
    });
  }, [tasks, q, status, priority, department, role, departments, filter, period, fromParam, toParam]);

  async function fetchTasks() {
    setLoading(true);
    console.log("Fetching tasks - session:", !!session);
    
    const query = supabase
      .from("tasks")
      .select("*");
    const { data, error } = await (
      role === "manager"
        ? query.order("created_at", { ascending: false })
        : query.order("due_at", { ascending: true })
    );
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

  // Handle taskId from URL parameter (from banner click)
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setHighlightedTask(task);
        setTaskDetailOpen(true);
      }
    }
  }, [taskId, tasks]);

  // Realtime updates for tasks
  useEffect(() => {
    const ch = supabase
      .channel('rt-tasks-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Acknowledgements for exec visibility (mayor/ceo)
  const [ackIds, setAckIds] = useState<string[]>([]);
  const [acknowledgements, setAcknowledgements] = useState<any[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    async function loadAcks() {
      if (!(role === 'mayor' || role === 'ceo')) return;
      
      // Load from Supabase
      const { data, error } = await supabase
        .from('task_acknowledgements')
        .select('task_id, manager_user_id, created_at');
      if (!error && !cancelled) {
        setAckIds((data || []).map((d: any) => d.task_id));
        setAcknowledgements(data || []);
      }
    }
    
    loadAcks();
    
    const ch = supabase
      .channel('rt-task-acks-app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_acknowledgements' }, () => {
        loadAcks();
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [role]);

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
    if (!(form.title && (form.department_slug as string))) {
      toast({ title: "שדות חסרים", description: "כותרת ומחלקה חובה", variant: "destructive" });
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

  const acknowledgeTask = async (task: Task) => {
    if (!user?.id) return;
    
    // Save to Supabase
    const { error } = await supabase.from('task_acknowledgements').insert({ 
      task_id: task.id, 
      manager_user_id: user.id 
    });
    if (!error) {
      setAckIds(prev => [...prev, task.id]);
      
      // Dispatch custom event to notify banner
      window.dispatchEvent(new CustomEvent('taskAcknowledged', {
        detail: { taskId: task.id }
      }));
      
      // Close the modal if it's the highlighted task
      if (highlightedTask?.id === task.id) {
        setTaskDetailOpen(false);
      }
      
      toast({ title: "תודה", description: "המשימה אושרה כנצפתה" });
    } else {
      toast({ title: "שגיאה", description: "לא ניתן לאשר את המשימה", variant: "destructive" });
    }
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

      {/* Executive banners */}
      {role === 'manager' && departments?.map((d) => (
        <ExecutiveTasksBanner key={d} department={d} />
      ))}
      {role === 'ceo' && (
        <ExecutiveTasksBanner department={'ceo' as DepartmentSlug} />
      )}

      {/* Demo notice */}
      {(role === 'manager' || role === 'ceo') && (
        <Card className="p-4 border-info bg-info/5">
          <div className="text-sm text-muted-foreground">
            <strong>הדרכה:</strong> התראות למשימות חדשות מההנהלה יופיעו כאן ברקע צהוב כשראש העיר או המנכ"ל יוסיפו משימות חדשות למחלקה שלך.
          </div>
        </Card>
      )}

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
                <td className="py-3 font-medium">
                  {t.title}
                   {(role === 'mayor' || role === 'ceo') && ackIds.includes(t.id) && (
                     <div className="mt-1">
                       <TooltipProvider>
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <span className="inline-block">
                               <Badge variant="outline" className="text-green-600 border-green-600 text-xs cursor-default">
                                 ✓
                               </Badge>
                             </span>
                           </TooltipTrigger>
                           <TooltipContent>
                             המשימה נצפתה על ידי ראש המחלקה
                           </TooltipContent>
                         </Tooltip>
                       </TooltipProvider>
                     </div>
                   )}
                </td>
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
                placeholder="למשל: שדרוג מערכת למידה דיגיטלית"
              />
            </div>

            <div>
              <Label>{role === "mayor" ? "יעד" : "מחלקה"} *</Label>
              <Select
                value={(form.department_slug as DepartmentSlug) ?? "finance"}
                onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}
              >
                <SelectTrigger disabled={isManager && !managerEditable("department_slug")}>
                  <SelectValue aria-label={role === "mayor" ? "יעד" : "מחלקה"} placeholder="בחר מחלקה..." />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {(role === "mayor" ? (["ceo", ...ALL_DEPARTMENTS] as DepartmentSlug[]) : visibleDepartments).map((d) => (
                    <SelectItem key={d} value={d}>
                      <span className="font-medium">{DEPARTMENT_LABELS[d]}</span>
                    </SelectItem>
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
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !form.due_at && "text-muted-foreground"
                    )}
                    disabled={isManager && !managerEditable("due_at")}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {form.due_at ? format(new Date(form.due_at), "dd/MM/yyyy") : <span>בחר תאריך</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.due_at ? new Date(form.due_at) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setForm((f) => ({ ...f, due_at: date.toISOString() }));
                      } else {
                        setForm((f) => ({ ...f, due_at: "" }));
                      }
                      // Close popover automatically
                      setDatePickerOpen(false);
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {editing && (
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
            )}

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

      {/* Task Detail Modal */}
      <Dialog open={taskDetailOpen} onOpenChange={setTaskDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>פרטי המשימה</DialogTitle>
            <DialogDescription>משימה מההנהלה למחלקה</DialogDescription>
          </DialogHeader>

          {highlightedTask && (
            <div className="space-y-4">
              <div className="p-4 bg-warning/10 border border-warning/40 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-warning text-warning">
                    משימה מההנהלה
                  </Badge>
                  <Badge variant={priorityBadgeVariant(highlightedTask.priority)}>
                    {PRIORITY_LABELS[highlightedTask.priority]}
                  </Badge>
                  <Badge variant={statusBadgeVariant(highlightedTask.status)}>
                    {STATUS_LABELS[highlightedTask.status]}
                  </Badge>
                </div>
                <h3 className="font-bold text-lg mb-2">{highlightedTask.title}</h3>
                {highlightedTask.description && (
                  <p className="text-muted-foreground mb-3">{highlightedTask.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">מחלקה:</span> {DEPARTMENT_LABELS[highlightedTask.department_slug]}
                  </div>
                  <div>
                    <span className="font-medium">דד-ליין:</span>{" "}
                    {highlightedTask.due_at 
                      ? new Date(highlightedTask.due_at).toLocaleDateString('he-IL')
                      : '—'
                    }
                  </div>
                  <div>
                    <span className="font-medium">נוצרה:</span>{" "}
                    {new Date(highlightedTask.created_at).toLocaleDateString('he-IL')}
                  </div>
                </div>

                {highlightedTask.progress_notes && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">הערות התקדמות:</span>
                    <p className="text-sm text-muted-foreground mt-1">{highlightedTask.progress_notes}</p>
                  </div>
                )}

                {highlightedTask.tags && highlightedTask.tags.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-sm">תגיות:</span>
                    <div className="flex gap-1 mt-1">
                      {highlightedTask.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  לצפיה בכל המשימות, עבור לרשימת המשימות המלאה
                </div>
                <div className="flex gap-2">
                  {isManager && !ackIds.includes(highlightedTask.id) && (
                    <Button onClick={() => acknowledgeTask(highlightedTask)} variant="secondary">
                      <Eye className="h-4 w-4 ml-1" />
                      אישור צפייה
                    </Button>
                  )}
                  {ackIds.includes(highlightedTask.id) && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ✓ נצפתה
                    </Badge>
                  )}
                  <Button onClick={() => setTaskDetailOpen(false)} variant="outline">
                    סגירה
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
