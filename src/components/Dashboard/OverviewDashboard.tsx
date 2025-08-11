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
  AlertTriangle,
  ListTodo,
  Megaphone,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demoAccess";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import TasksOverviewCard from "@/components/Tasks/TasksOverviewCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
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
  status, 
  budget, 
  utilization, 
  icon: Icon,
  to
}: { 
  name: string; 
  status: string; 
  budget: string; 
  utilization: number; 
  icon: any;
  to: string;
}) => (
  <Link to={to} aria-label={`נווט אל ${name}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
    <Card className="shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">סטטוס</span>
          <Badge variant={status === 'פעיל' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">תקציב מנוצל</span>
            <span className="font-medium">{utilization}%</span>
          </div>
          <Progress value={utilization} className="h-2" />
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">תקציב שנתי: </span>
          <span className="font-semibold">{budget}</span>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function OverviewDashboard() {
  const { user, role, departments } = useAuth();

  type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
  type TaskRow = { id: string; status: TaskStatus; due_at: string | null; progress_percent: number | null };

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
    queryKey: ['exec-daily'],
    enabled: role === 'mayor' || role === 'ceo',
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [pNew, pUpd, tDone, gNew, tAck] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('projects').select('id', { count: 'exact', head: true }).gte('updated_at', since),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('status', 'done').gte('updated_at', since),
        supabase.from('grants').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('task_acknowledgements').select('id', { count: 'exact', head: true }).gte('created_at', since),
      ]);
      return {
        projectsNew: pNew.count || 0,
        projectsUpdated: pUpd.count || 0,
        tasksDone: tDone.count || 0,
        grantsNew: gNew.count || 0,
        acknowledgements: tAck.count || 0,
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

      {user && (
        <Card className="shadow-card">
          <CardContent className="p-6 flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={"/placeholder.svg"} alt="תמונת משתמש" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold text-foreground">{user.email}</div>
              <div className="text-sm text-muted-foreground">תפקיד: <span className="font-medium">{role === 'mayor' ? 'ראש העיר' : role === 'ceo' ? 'מנכ״ל' : role === 'manager' ? 'מנהל/ת מחלקה' : 'משתמש'}</span></div>
            </div>
          </CardContent>
        </Card>
      )}

      { (role === 'mayor' || role === 'ceo') && execStats && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התראות יומיות למנהלים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">פרויקטים חדשים</div>
                <div className="text-2xl font-bold">{execStats.projectsNew}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">פרויקטים שהתעדכנו</div>
                <div className="text-2xl font-bold">{execStats.projectsUpdated}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">משימות שהושלמו</div>
                <div className="text-2xl font-bold">{execStats.tasksDone}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">קולות קוראים חדשים</div>
                <div className="text-2xl font-bold">{execStats.grantsNew}</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">אישורי צפייה ממשתמשים</div>
                <div className="text-2xl font-bold">{execStats.acknowledgements}</div>
              </div>
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
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">מחלקות עיקריות</h2>
          <Badge variant="outline" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            3 התראות פעילות
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DepartmentCard
            name="מחלקת פיננסים"
            status="פעיל"
            budget="₪2.4B"
            utilization={73}
            icon={BarChart3}
            to="/finance"
          />
          <DepartmentCard
            name="מחלקת חינוך"
            status="פעיל"
            budget="₪890M"
            utilization={81}
            icon={GraduationCap}
            to="/education"
          />
          <DepartmentCard
            name="מחלקת הנדסה"
            status="פעיל"
            budget="₪650M"
            utilization={67}
            icon={Building2}
            to="/engineering"
          />
          <DepartmentCard
            name="מחלקת רווחה"
            status="פעיל"
            budget="₪320M"
            utilization={89}
            icon={Users}
            to="/welfare"
          />
          <DepartmentCard
            name="חינוך בלתי פורמאלי"
            status="פעיל"
            budget="₪45M"
            utilization={76}
            icon={Activity}
            to="/non-formal"
          />
          <DepartmentCard
            name="רישוי עסקים"
            status="פעיל"
            budget="₪12M"
            utilization={92}
            icon={Store}
            to="/business"
          />
          <DepartmentCard
            name="קולות קוראים"
            status="פעיל"
            budget="₪35M"
            utilization={58}
            icon={Megaphone}
            to="/grants"
          />
          <DepartmentCard
            name="ניהול משימות"
            status="פעיל"
            budget="—"
            utilization={70}
            icon={ListTodo}
            to="/tasks"
          />
          <DepartmentCard
            name="פרויקטים"
            status="פעיל"
            budget="—"
            utilization={64}
            icon={Building2}
            to="/projects"
          />
        </div>
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