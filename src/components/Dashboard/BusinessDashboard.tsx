import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Store, Bell, FileSpreadsheet, Timer, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButtons } from "@/components/shared/ExportButtons";
import type { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import { Button } from "@/components/ui/button";

const kpi = {
  registered: 1840,
  active: 1630,
  expiringThisMonth: 42,
  newRequests: 28,
};

const licenseStatus = [
  { name: "פעיל", value: 1630 },
  { name: "מבוטל", value: 60 },
  { name: "זמני", value: 80 },
  { name: "מתחדש", value: 50 },
  { name: "פג תוקף", value: 20 },
];

const businessTypes = [
  { type: "מסחר", count: 620 },
  { type: "שירותים", count: 480 },
  { type: "מזון", count: 260 },
  { type: "תעשייה קלה", count: 140 },
  { type: "אחר", count: 340 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];

export default function BusinessDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  type LicenseRow = {
    id: string;
    name: string;
    type: string;
    status: string;
    expiresAt: string;
  };

  const licenses: LicenseRow[] = [
    { id: "RL-1001", name: "קפה מרכזי", type: "מזון", status: "פעיל", expiresAt: "2025-12-31" },
    { id: "RL-1023", name: "חנות ספרים השדרה", type: "מסחר", status: "מתחדש", expiresAt: "2025-09-15" },
    { id: "RL-1077", name: "מכון כושר PRO", type: "שירותים", status: "זמני", expiresAt: "2025-10-01" },
    { id: "RL-1112", name: "מאפיית האופה", type: "מזון", status: "פג תוקף", expiresAt: "2025-06-30" },
  ];

  const licenseColumns: ColumnDef<LicenseRow>[] = [
    { accessorKey: "id", header: "מספר רישיון" },
    { accessorKey: "name", header: "שם עסק" },
    { accessorKey: "type", header: "סוג" },
    { accessorKey: "status", header: "סטטוס" },
    { accessorKey: "expiresAt", header: "תוקף עד" },
  ];

  const expiredCount = licenseStatus.find((s) => s.name === "פג תוקף")?.value ?? 0;
  const alerts = [
    { id: "AL-001", title: "רישיונות שפוקעים בחודש הקרוב", count: kpi.expiringThisMonth, severity: "warning" as const, icon: Timer },
    { id: "AL-002", title: "בקשות הממתינות לטיפול", count: 12, severity: "default" as const, icon: Bell },
    { id: "AL-003", title: "עסקים ללא רישיון תקף", count: expiredCount, severity: "destructive" as const, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">רישוי עסקים</h1>
          <p className="text-muted-foreground text-lg">סטטוס רישיונות, סוגי עסקים והתראות</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 ml-2" /> ייבוא נתונים
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ייבוא נתונים לרישוי עסקים</DialogTitle>
            </DialogHeader>
            <DataUploader context="business" />
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">עסקים רשומים</p><p className="text-3xl font-bold">{kpi.registered.toLocaleString()}</p></div><Store className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">עסקים פעילים</p><p className="text-3xl font-bold">{kpi.active.toLocaleString()}</p></div><Store className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">רישיונות פוקעים החודש</p><p className="text-3xl font-bold">{kpi.expiringThisMonth}</p></div><Timer className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">בקשות חדשות</p><p className="text-3xl font-bold">{kpi.newRequests}</p></div><Bell className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">סטטוס רישיונות</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={licenseStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {licenseStatus.map((e,i)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">סוגי עסקים</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={businessTypes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התראות ומעקב</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {alerts.map((a) => {
                const Icon = a.icon;
                const color = a.severity === 'warning' ? 'text-warning' : a.severity === 'destructive' ? 'text-destructive' : 'text-foreground';
                const badgeVariant = a.severity === 'warning' ? 'secondary' : a.severity === 'destructive' ? 'destructive' : 'outline';
                return (
                  <div key={a.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${color}`} />
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                      </div>
                      <Badge variant={badgeVariant as any}>{a.count}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">עודכן אוטומטית לפי נתונים אחרונים</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">רישיונות עסקים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButtons data={licenses} fileBaseName="business-licenses" />
            </div>
            <DataTable
              columns={licenseColumns}
              data={licenses}
              searchPlaceholder="חיפוש עסקים..."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
