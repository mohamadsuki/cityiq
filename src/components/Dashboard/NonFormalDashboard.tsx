import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Users, Calendar, Trophy, UserCircle2 } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButtons } from "@/components/shared/ExportButtons";
import type { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import ActivitiesSection from "@/components/NonFormal/ActivitiesSection";
import { FileSpreadsheet } from "lucide-react";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";

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

type ActivityRow = {
  id: string;
  name: string;
  category: string;
  ageGroup: string;
  participants: number;
  status: string;
  lastUpdate: string;
};

const activityRows: ActivityRow[] = [
  { id: "NF-1001", name: "חוג רובוטיקה", category: "STEM", ageGroup: "חטיבה", participants: 210, status: "פעיל", lastUpdate: "2025-06-20" },
  { id: "NF-1022", name: "כדורגל שכונתי", category: "ספורט", ageGroup: "יסודי", participants: 260, status: "פעיל", lastUpdate: "2025-06-18" },
  { id: "NF-1035", name: "להקה עירונית", category: "תרבות ואמנות", ageGroup: "תיכון", participants: 120, status: "בהמתנה", lastUpdate: "2025-06-10" },
  { id: "NF-1040", name: "תוכנית מצויינות מדעית", category: "מצויינות", ageGroup: "תיכון", participants: 180, status: "נסגר", lastUpdate: "2025-05-30" },
];

const activityColumns: ColumnDef<ActivityRow>[] = [
  { accessorKey: "id", header: "מזהה" },
  { accessorKey: "name", header: "שם פעילות" },
  { accessorKey: "category", header: "קטגוריה" },
  { accessorKey: "ageGroup", header: "קבוצת גיל" },
  { accessorKey: "participants", header: "משתתפים" },
  { accessorKey: "status", header: "סטטוס" },
  { accessorKey: "lastUpdate", header: "עודכן" },
];

export default function NonFormalDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [category, setCategory] = useState<string>("all");
  const [ageGroup, setAgeGroup] = useState<string>("all");

  const categories = Array.from(new Set(activityRows.map((r) => r.category)));
  const ageGroups = Array.from(new Set(activityRows.map((r) => r.ageGroup)));

  const filteredData = activityRows.filter(
    (r) => (category === "all" || r.category === category) && (ageGroup === "all" || r.ageGroup === ageGroup)
  );
  const totalParticipants = filteredData.reduce((sum, r) => sum + r.participants, 0);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">חינוך בלתי פורמאלי</h1>
          <p className="text-muted-foreground text-lg">תוכניות, השתתפות וקידום נוער</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 ml-2" /> ייבוא נתונים
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ייבוא נתונים לחינוך בלתי פורמאלי</DialogTitle>
            </DialogHeader>
            <DataUploader context="non-formal" />
          </DialogContent>
        </Dialog>
      </header>

      <ExecutiveTasksBanner department="non-formal" />

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

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">קידום נוער</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg border bg-card"><p className="text-sm text-muted-foreground">משתתפים</p><p className="text-2xl font-bold">640</p></div>
              <div className="p-4 rounded-lg border bg-card"><p className="text-sm text-muted-foreground">מסלולים</p><p className="text-2xl font-bold">12</p></div>
              <div className="p-4 rounded-lg border bg-card"><p className="text-sm text-muted-foreground">ישיבות צוות</p><p className="text-2xl font-bold">8</p></div>
              <div className="p-4 rounded-lg border bg-card"><p className="text-sm text-muted-foreground">השתלמויות</p><p className="text-2xl font-bold">5</p></div>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="font-medium mb-2">פעילויות קרובות</p>
              <ul className="list-disc pr-5 space-y-1 text-sm text-muted-foreground">
                <li>12/09 · סדנת הכנה לבגרויות</li>
                <li>20/09 · יום סיירות קהילתי</li>
                <li>02/10 · ערב הורים בנושא מניעת נשירה</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <ActivitiesSection />
    </div>
  );
}
