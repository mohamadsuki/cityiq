import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { ListTodo, CheckCircle2, Timer, AlertTriangle, Gauge } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import React from "react";

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskRow = { id: string; status: TaskStatus; due_at: string | null; progress_percent: number | null };

interface Props {
  tasks: TaskRow[];
  isLoading?: boolean;
}

const statusLabel: Record<TaskStatus, string> = {
  todo: 'לביצוע',
  in_progress: 'בתהליך',
  blocked: 'חסום',
  done: 'הושלם',
  cancelled: 'בוטל',
};

const statusColor: Record<TaskStatus, string> = {
  todo: 'hsl(var(--muted-foreground))',
  in_progress: 'hsl(var(--primary))',
  blocked: 'hsl(var(--destructive))',
  done: 'hsl(var(--success))',
  cancelled: 'hsl(var(--secondary))',
};

export default function TasksOverviewCard({ tasks, isLoading }: Props) {
  const now = new Date();
  const totalTasks = tasks.length;
  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    done: tasks.filter(t => t.status === 'done').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
  } satisfies Record<TaskStatus, number>;

  const overdue = tasks.filter(
    t => t.due_at && new Date(t.due_at) < now && t.status !== 'done' && t.status !== 'cancelled'
  ).length;

  const avgProgress = totalTasks
    ? Math.round(tasks.reduce((acc, t) => acc + (t.progress_percent ?? 0), 0) / totalTasks)
    : 0;

  const chartData = (Object.keys(statusCounts) as TaskStatus[]).map((k) => ({
    key: k,
    name: statusLabel[k],
    value: statusCounts[k],
    color: statusColor[k],
  }));

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-muted-foreground" />
          סקירת משימות
        </CardTitle>
        <Link to="/tasks" aria-label="נווט אל משימות">
          <Button variant="outline" size="sm">לצפייה בכל המשימות</Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ListTodo className="h-4 w-4" /> סה״כ משימות
              </div>
              <div className="text-2xl font-bold">{isLoading ? '—' : totalTasks}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" /> הושלמו
              </div>
              <div className="text-2xl font-bold">{isLoading ? '—' : statusCounts.done}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-4 w-4" /> בעיכוב
              </div>
              <div className="text-2xl font-bold">{isLoading ? '—' : overdue}</div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Gauge className="h-4 w-4" /> התקדמות ממוצעת
              </div>
              <div className="text-2xl font-bold">{isLoading ? '—' : `${avgProgress}%`}</div>
            </div>
          </div>

          {/* Donut chart */}
          <div className="lg:col-span-2">
            <ChartContainer
              config={{ value: { label: 'כמות' } }}
              className="aspect-[16/9]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {chartData.map((s) => (
                <div key={s.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  <span className="text-muted-foreground">{s.name}:</span>
                  <span className="font-medium">{isLoading ? '—' : s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
