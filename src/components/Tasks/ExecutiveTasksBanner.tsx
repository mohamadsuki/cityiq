import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Props {
  department: DepartmentSlug;
}

export default function ExecutiveTasksBanner({ department }: Props) {
  const { role, user, session, departments } = useAuth();
  const isManager = role === 'manager';
  const canSee = isManager && !!user?.id && !!session && departments?.includes(department);

  const [tasks, setTasks] = useState<any[]>([]);
  const [ackIds, setAckIds] = useState<string[]>([]);

  useEffect(() => {
    if (!canSee) return;
    let active = true;
    async function load() {
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
    load();
    return () => { active = false; };
  }, [canSee, department, user?.id]);

  const pending = useMemo(() => tasks.filter(t => !ackIds.includes(t.id)), [tasks, ackIds]);

  const acknowledge = async (taskId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('task_acknowledgements').insert({ task_id: taskId, manager_user_id: user.id });
    if (!error) setAckIds(prev => [...prev, taskId]);
  };

  if (!canSee || pending.length === 0) return null;

  return (
    <Card className="shadow-card border-warning/40" style={{ backgroundColor: 'hsl(var(--warning) / 0.08)' }}>
      <CardHeader>
        <CardTitle className="text-lg">משימות מההנהלה למחלקה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pending.slice(0, 5).map((t) => (
          <div key={t.id} className="rounded-md border p-3 flex items-center justify-between gap-3" style={{ borderColor: 'hsl(var(--warning))' }}>
            <div className="min-w-0">
              <div className="font-medium truncate" title={t.title}>{t.title}</div>
              <div className="text-xs text-muted-foreground mt-1">דד-ליין: {t.due_at ? new Date(t.due_at).toLocaleDateString('he-IL') : '—'}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{departmentLabel(department)}</Badge>
              <Button size="sm" variant="secondary" onClick={() => acknowledge(t.id)} className="gap-1">
                <Eye className="h-4 w-4" /> אישור צפייה
              </Button>
            </div>
          </div>
        ))
        }
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
