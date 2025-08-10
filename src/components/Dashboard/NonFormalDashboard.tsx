import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Users, Calendar, Trophy, UserCircle2 } from "lucide-react";

const kpi = {
  participants: 2140,
  programs: 36,
  instructors: 58,
  participationRate: 72,
};

const participationTrend = [
  { month: "1/24", rate: 58 },
  { month: "3/24", rate: 63 },
  { month: "5/24", rate: 67 },
  { month: "7/24", rate: 70 },
  { month: "9/24", rate: 71 },
  { month: "11/24", rate: 72 },
];

const programs = [
  { name: "תוכנית מצויינות מדעית", participants: 180 },
  { name: "להקה עירונית", participants: 120 },
  { name: "חוג רובוטיקה", participants: 210 },
  { name: "כדורגל שכונתי", participants: 260 },
];

export default function NonFormalDashboard() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">חינוך בלתי פורמאלי</h1>
        <p className="text-muted-foreground text-lg">תוכניות, השתתפות וקידום נוער</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">משתתפים פעילים</p><p className="text-3xl font-bold">{kpi.participants.toLocaleString()}</p></div><Users className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">תוכניות פעילות</p><p className="text-3xl font-bold">{kpi.programs}</p></div><Calendar className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">מדריכים</p><p className="text-3xl font-bold">{kpi.instructors}</p></div><UserCircle2 className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">שיעור השתתפות</p><p className="text-3xl font-bold">{kpi.participationRate}%</p></div><Trophy className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">מגמת השתתפות</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={participationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">תוכניות ופעילויות</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={programs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participants" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
