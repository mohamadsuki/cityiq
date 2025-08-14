import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  Building2,
  GraduationCap,
  TrendingUp,
  Activity,
  Store,
  ListTodo,
  Megaphone,
  Eye,
  Calculator,
  BookOpen,
  HardHat,
  Heart,
  GamepadIcon,
  Briefcase
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demoAccess";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TasksOverviewCard from "@/components/Tasks/TasksOverviewCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { DateRange } from "react-day-picker";
const KPICard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  change: string; 
  icon: any; 
  trend: 'up' | 'down' | 'stable';
}) => (
  <Card className="shadow-card hover:shadow-elevated transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <div className="flex items-center space-x-2 space-x-reverse">
            <TrendingUp className={`h-4 w-4 ${
              trend === 'up' ? 'text-success' : 
              trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            }`} />
            <span className={`text-sm ${
              trend === 'up' ? 'text-success' : 
              trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
            }`}>
              {change}
            </span>
          </div>
        </div>
        <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const DepartmentCard = ({ 
  name, 
  description, 
  components, 
  icon: Icon,
  to
}: { 
  name: string; 
  description: string; 
  components: string[]; 
  icon: any;
  to: string;
}) => (
  <Link to={to} aria-label={`נווט אל ${name}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
    <Card className="shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="text-muted-foreground font-medium">רכיבים במחלקה:</span>
          <div className="mt-2 flex flex-wrap gap-1">
            {components.map((component, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {component}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function OverviewDashboard() {
  const { user, role, departments } = useAuth();

  type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  type TaskRow = { id: string; status: TaskStatus; due_at: string | null; progress_percent: number | null };

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Load tasks with creator role marker for filtering
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id,title,department_slug,status,due_at,progress_percent,assigned_by_role,created_at');
      if (error) return [] as TaskRow[];
      return (data || []) as any[];
    },
  });

  // Manager acknowledgements (which tasks already viewed)
  const { data: acks = [] } = useQuery({
    queryKey: ['task-acks', user?.id],
    enabled: !!user && role === 'manager',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_acknowledgements')
        .select('task_id')
        .eq('manager_user_id', user!.id);
      if (error) return [] as { task_id: string }[];
      return (data || []) as { task_id: string }[];
    }
  });
  const [ackIds, setAckIds] = useState<string[]>([]);
  useEffect(() => {
    setAckIds((acks as { task_id: string }[]).map((a) => a.task_id));
  }, [acks]);

  const queryClient = useQueryClient();
  useEffect(() => {
    const ch1 = supabase
      .channel('rt-tasks-overview')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tasks-overview'] });
      })
      .subscribe();

    const ch2 = supabase
      .channel('rt-task-acks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_acknowledgements' }, () => {
        if (user?.id) queryClient.invalidateQueries({ queryKey: ['task-acks', user.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch1);
      supabase.removeChannel(ch2);
    };
  }, [queryClient, user?.id]);

  type TaskRowFull = TaskRow & { title: string; department_slug: string; assigned_by_role?: 'mayor' | 'ceo' | 'manager' | null; created_at?: string };
  const tasksFull = tasks as unknown as TaskRowFull[];
  const tasksBasic: TaskRow[] = tasksFull.map((t) => ({ id: t.id, status: t.status, due_at: t.due_at, progress_percent: t.progress_percent }));

  const executiveTasks = (role === 'manager')
    ? tasksFull
        .filter((t) =>
          (t.assigned_by_role === 'mayor' || t.assigned_by_role === 'ceo') &&
          t.status !== 'done' && t.status !== 'cancelled' &&
          departments.includes(t.department_slug as any) &&
          !ackIds.includes(t.id)
        )
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 5)
    : [];

  const DEPT_LABELS: Record<string, string> = { finance: 'כספים', education: 'חינוך', engineering: 'הנדסה', welfare: 'רווחה', 'non-formal': 'חינוך בלתי פורמאלי', business: 'עסקים', ceo: 'מנכ"ל' };

  const { data: execStats } = useQuery({
    queryKey: ['exec-new', period, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    enabled: role === 'mayor' || role === 'ceo',
    queryFn: async () => {
      const now = new Date();
      const from = (() => {
        if (period === 'custom' && dateRange?.from) return dateRange.from;
        if (period === 'week') return new Date(now.getTime() - 7*24*60*60*1000);
        if (period === 'month') return new Date(now.getTime() - 30*24*60*60*1000);
        if (period === 'year') return new Date(now.getTime() - 365*24*60*60*1000);
        return new Date(now.getTime() - 24*60*60*1000);
      })();
      const to = (period === 'custom' && dateRange?.to) ? dateRange.to : now;
      const fromIso = from.toISOString();
      const toIso = to.toISOString();

      const bounded = (q: any, col: string) => q.gte(col, fromIso).lte(col, toIso);

      const [pNew, pUpd, tDone, gNew] = await Promise.all([
        bounded(supabase.from('projects').select('id', { count: 'exact', head: true }), 'created_at'),
        // For updated projects, exclude newly created ones by checking updated_at != created_at
        supabase.from('projects')
          .select('id', { count: 'exact', head: true })
          .gte('updated_at', fromIso)
          .lte('updated_at', toIso)
          .neq('updated_at', 'created_at'),
        bounded(supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'done'), 'updated_at'),
        bounded(supabase.from('grants').select('id', { count: 'exact', head: true }), 'created_at'),
      ]);
      return {
        projectsNew: pNew.count || 0,
        projectsUpdated: pUpd.count || 0,
        tasksDone: tDone.count || 0,
        grantsNew: gNew.count || 0,
      };
    }
  });

  const handleAcknowledge = async (taskId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('task_acknowledgements').insert({ task_id: taskId, manager_user_id: user.id });
    if (!error) setAckIds((prev) => [...prev, taskId]);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">סקירה כללית</h1>
        <p className="text-muted-foreground text-lg">
          תמונת מצב כוללת של המערכות העירוניות
        </p>
      </div>

      {role === 'manager' && executiveTasks.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">משימות מההנהלה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {executiveTasks.map((t) => (
              <div key={t.id} className="rounded-md border p-3" style={{ backgroundColor: 'hsl(var(--warning) / 0.12)', borderColor: 'hsl(var(--warning))' }}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate" title={t.title}>{t.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">דד-ליין: {t.due_at ? new Date(t.due_at).toLocaleDateString('he-IL') : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{DEPT_LABELS[t.department_slug] || t.department_slug}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(t.id)} className="gap-1">
                      <Eye className="h-4 w-4" /> אישור צפייה
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}


      { (role === 'mayor' || role === 'ceo') && execStats && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">מה חדש?</CardTitle>
              <div className="flex items-center gap-2">
                {(['day','week','month','year','custom'] as const).map((p) => (
                  <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
                    {p === 'day' ? 'יום' : p === 'week' ? 'שבוע' : p === 'month' ? 'חודש' : p === 'year' ? 'שנה' : 'טווח'}
                  </Button>
                ))}
                {period === 'custom' && (
                  <DateRangePicker value={dateRange} onChange={setDateRange} />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to={`/projects?filter=new&from=${period === 'custom' && dateRange?.from ? dateRange.from.toISOString() : ''}&to=${period === 'custom' && dateRange?.to ? dateRange.to.toISOString() : ''}&period=${period}`} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors block">
                <div className="text-sm text-muted-foreground">פרויקטים חדשים</div>
                <div className="text-2xl font-bold">{execStats.projectsNew}</div>
              </Link>
              <Link to={`/projects?filter=updated&from=${period === 'custom' && dateRange?.from ? dateRange.from.toISOString() : ''}&to=${period === 'custom' && dateRange?.to ? dateRange.to.toISOString() : ''}&period=${period}`} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors block">
                <div className="text-sm text-muted-foreground">פרויקטים שהתעדכנו</div>
                <div className="text-2xl font-bold">{execStats.projectsUpdated}</div>
              </Link>
              <Link to={`/tasks?filter=completed&from=${period === 'custom' && dateRange?.from ? dateRange.from.toISOString() : ''}&to=${period === 'custom' && dateRange?.to ? dateRange.to.toISOString() : ''}&period=${period}`} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors block">
                <div className="text-sm text-muted-foreground">משימות שהושלמו</div>
                <div className="text-2xl font-bold">{execStats.tasksDone}</div>
              </Link>
              <Link to={`/grants?filter=new&from=${period === 'custom' && dateRange?.from ? dateRange.from.toISOString() : ''}&to=${period === 'custom' && dateRange?.to ? dateRange.to.toISOString() : ''}&period=${period}`} className="p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors block">
                <div className="text-sm text-muted-foreground">קולות קוראים חדשים</div>
                <div className="text-2xl font-bold">{execStats.grantsNew}</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!user && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">משתמשי דמו להתחברות מהירה</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">התחבר/י עם אחד ממשתמשי הדמו הבאים (מומלץ להתחיל עם "ראש העיר"):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {DEMO_USERS.map(u => (
                <div key={u.email} className="text-sm p-3 rounded-md bg-muted">
                  <div className="font-medium">{u.displayName}</div>
                  <div className="text-muted-foreground">דוא"ל: {u.email}</div>
                  <div className="text-muted-foreground">סיסמה: {u.password}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-sm">
              עבור התחברות/הרשמה, נווט/י אל <Link to="/auth" className="underline">דף האימות</Link>.
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="סה״כ תקציב עירוני"
          value="₪2.4B"
          change="+8.2% מהשנה שעברה"
          icon={BarChart3}
          trend="up"
        />
        <KPICard
          title="אוכלוסיית העיר"
          value="342,857"
          change="+2.1% גידול שנתי"
          icon={Users}
          trend="up"
        />
        <KPICard
          title="פרויקטים פעילים"
          value="127"
          change="15 פרויקטים חדשים"
          icon={Building2}
          trend="up"
        />
        <KPICard
          title="מוסדות חינוך"
          value="89"
          change="יציב"
          icon={GraduationCap}
          trend="stable"
        />
      </div>

      {/* Department Overview */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">מחלקות עיקריות</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DepartmentCard
            name="מחלקת פיננסים"
            description="ניהול תקציב עירוני, מעקב הוצאות והכנסות"
            components={["תקציב", "פרויקטים", "קולות קוראים", "דוחות כספיים", "מפה"]}
            icon={Calculator}
            to="/finance"
          />
          <DepartmentCard
            name="מחלקת חינוך"
            description="ניהול מוסדות חינוך וסטטיסטיקות לימודים"
            components={["סטטיסטיקות תלמידים", "מוסדות חינוך", "פרויקטים", "מפה", "התראות תפוסה"]}
            icon={BookOpen}
            to="/education"
          />
          <DepartmentCard
            name="מחלקת הנדסה"
            description="תכנון ופיתוח עירוני, תוכניות בנייה"
            components={["תוכניות", "סטטוס אישורים", "שימושי קרקע", "מפה", "טבלת נתונים"]}
            icon={HardHat}
            to="/engineering"
          />
          <DepartmentCard
            name="מחלקת רווחה"
            description="שירותי רווחה וטיפול באוכלוסיות מיוחדות"
            components={["שירותי רווחה", "סטטיסטיקות", "טבלאות נתונים", "דוחות", "מעקב מקרים"]}
            icon={Heart}
            to="/welfare"
          />
          <DepartmentCard
            name="חינוך בלתי פורמאלי"
            description="פעילויות חינוכיות מחוץ למערכת הפורמאלית"
            components={["פעילויות", "סטטיסטיקות השתתפות", "תוכניות", "מדריכים", "קידום נוער"]}
            icon={GamepadIcon}
            to="/non-formal"
          />
          <DepartmentCard
            name="רישוי עסקים"
            description="ניהול רישיונות עסקיים ומעקב תוקפם"
            components={["רישיונות עסקיים", "סטטוס רישיונות", "סוגי עסקים", "מפה", "התראות"]}
            icon={Briefcase}
            to="/business"
          />
        </div>
      </div>

      <TasksOverviewCard tasks={tasksBasic} isLoading={tasksLoading} />

      {/* Quick Actions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">דוחות חודשיים</h3>
              <p className="text-sm text-muted-foreground mb-3">
                גישה מהירה לדוחות המחלקות השונות
              </p>
              <Badge>זמין</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">ניהול תקציבים</h3>
              <p className="text-sm text-muted-foreground mb-3">
                מעקב ועדכון תקציבים בזמן אמת
              </p>
              <Badge variant="secondary">בעדכון</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">מערכת התראות</h3>
              <p className="text-sm text-muted-foreground mb-3">
                ניהול התראות ואישורים דרושים
              </p>
              <Badge>3 התראות</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}