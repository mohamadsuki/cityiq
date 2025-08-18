import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Megaphone, ArrowLeft } from "lucide-react";

interface Props {
  department: DepartmentSlug;
}

export default function ExecutiveTasksBanner({ department }: Props) {
  const { role, user, session, departments } = useAuth();
  const navigate = useNavigate();
  const isManager = role === 'manager';
  const canSee = (
    (isManager && !!user?.id && !!session && departments?.includes(department)) ||
    (role === 'ceo' && !!user?.id && !!session && department === 'ceo') ||
    // Allow demo mode access
    (isManager && !!user?.id && !session && departments?.includes(department)) ||
    (role === 'ceo' && !!user?.id && !session && department === 'ceo')
  );

  const [tasks, setTasks] = useState<any[]>([]);
  const [ackIds, setAckIds] = useState<string[]>([]);
  const isDemo = !session;

  useEffect(() => {
    if (!canSee) return;
    let active = true;
    
    async function load() {
      console.log("Executive banner loading - canSee:", canSee, "isDemo:", isDemo, "department:", department);
      
      if (isDemo) {
        // Demo mode: read from localStorage
        try {
          const raw = localStorage.getItem("demo_tasks");
          console.log("Executive banner - demo tasks raw:", raw);
          const list = raw ? (JSON.parse(raw) as any[]) : [];
          console.log("Executive banner - demo tasks parsed:", list);
          
          const filtered = list.filter(t => {
            const matches = t.department_slug === department &&
              ['mayor', 'ceo'].includes(t.assigned_by_role) &&
              !['done', 'cancelled'].includes(t.status);
            console.log(`Task ${t.title} - dept: ${t.department_slug}, assigned_by: ${t.assigned_by_role}, status: ${t.status}, matches: ${matches}`);
            return matches;
          });
          console.log("Executive banner - filtered tasks:", filtered);
          
          if (!active) return;
          setTasks(filtered);
          
          // For demo mode, acknowledgements are also in localStorage
          const ackRaw = localStorage.getItem("demo_task_acknowledgements");
          const ackList = ackRaw ? (JSON.parse(ackRaw) as any[]) : [];
          const userAcks = ackList.filter(a => a.manager_user_id === user!.id);
          setAckIds(userAcks.map(a => a.task_id));
        } catch (e) {
          console.error("Failed to parse demo tasks", e);
          if (!active) return;
          setTasks([]);
          setAckIds([]);
        }
      } else {
        // Real mode: read from Supabase
        const [{ data: t }, { data: a }] = await Promise.all([
          supabase
            .from('tasks')
            .select('id,title,department_slug,status,due_at,assigned_by_role,created_at')
            .eq('department_slug', department)
            .in('assigned_by_role', ['mayor','ceo'])
            .not('status', 'in', '(\"done\",\"cancelled\")')
            .order('created_at', { ascending: false }),
          supabase
            .from('task_acknowledgements')
            .select('task_id')
            .eq('manager_user_id', user!.id)
        ]);
        if (!active) return;
        setTasks((t as any[]) || []);
        setAckIds(((a as { task_id: string }[]) || []).map(x => x.task_id));
      }
    }
    
    load();
    return () => { active = false; };
  }, [canSee, department, user?.id, isDemo]);

  const pending = useMemo(() => tasks.filter(t => !ackIds.includes(t.id)), [tasks, ackIds]);

  const acknowledge = async (taskId: string) => {
    if (!user?.id) return;
    
    if (isDemo) {
      // Demo mode: save to localStorage
      try {
        const ackRaw = localStorage.getItem("demo_task_acknowledgements");
        const ackList = ackRaw ? (JSON.parse(ackRaw) as any[]) : [];
        const newAck = { task_id: taskId, manager_user_id: user.id };
        const updated = [...ackList, newAck];
        localStorage.setItem("demo_task_acknowledgements", JSON.stringify(updated));
        setAckIds(prev => [...prev, taskId]);
      } catch (e) {
        console.error("Failed to save demo acknowledgement", e);
      }
    } else {
      // Real mode: save to Supabase
      const { error } = await supabase.from('task_acknowledgements').insert({ task_id: taskId, manager_user_id: user.id });
      if (!error) setAckIds(prev => [...prev, taskId]);
    }
  };

  const viewTaskDetails = (taskId: string) => {
    navigate(`/tasks?taskId=${taskId}`);
  };

  if (!canSee || pending.length === 0) return null;

  return (
    <Card className="shadow-card border-warning/40 bg-warning/8">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-warning" />
          משימות מההנהלה למחלקה
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.slice(0, 5).map((t) => (
          <div key={t.id} className="rounded-md border border-warning p-3 bg-warning/12 cursor-pointer hover:bg-warning/16 transition-colors" onClick={() => viewTaskDetails(t.id)}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate text-warning-foreground" title={t.title}>{t.title}</div>
                <div className="text-xs text-muted-foreground mt-1">דד-ליין: {t.due_at ? new Date(t.due_at).toLocaleDateString('he-IL') : '—'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-warning text-warning">{departmentLabel(department)}</Badge>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    viewTaskDetails(t.id);
                  }} 
                  className="gap-1 border-warning text-warning hover:bg-warning/10"
                >
                  <ArrowLeft className="h-4 w-4" /> פרטים
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    acknowledge(t.id);
                  }} 
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" /> אישור צפייה
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function departmentLabel(d: DepartmentSlug): string {
  const map: Record<DepartmentSlug, string> = {
    finance: 'כספים',
    education: 'חינוך',
    engineering: 'הנדסה',
    welfare: 'רווחה',
    'non-formal': 'חינוך בלתי פורמלי',
    business: 'עסקים',
    // Treat ceo as label when appears
    ceo: 'מנכ"ל',
  } as any;
  return (map as any)[d] || (d as any);
}
