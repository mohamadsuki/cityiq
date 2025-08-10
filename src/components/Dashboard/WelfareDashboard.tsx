import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Users, AlertTriangle, HeartPulse, Baby } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButtons } from "@/components/shared/ExportButtons";
import type { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { useState } from "react";

const kpi = {
  recipients: 3280,
  families: 1120,
  disabilities: 460,
  riskChildren: 180,
};

const servicesPie = [
  { name: "מוגבלות", value: 460 },
  { name: "עוני", value: 820 },
  { name: "ילדים בסיכון", value: 180 },
  { name: "קשישים", value: 740 },
  { name: "אחר", value: 1080 },
];

const trend = [
  { month: "1/24", recipients: 2900 },
  { month: "3/24", recipients: 3020 },
  { month: "5/24", recipients: 3150 },
  { month: "7/24", recipients: 3210 },
  { month: "9/24", recipients: 3270 },
  { month: "11/24", recipients: 3280 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];

export default function WelfareDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  type CaseRow = {
    id: string;
    name: string;
    service: string;
    status: string;
    lastUpdate: string;
  };

  const cases: CaseRow[] = [
    { id: "C-2001", name: "יוסי כהן", service: "עוני", status: "פעיל", lastUpdate: "2025-06-20" },
    { id: "C-2012", name: "נועה לוי", service: "מוגבלות", status: "בהמתנה", lastUpdate: "2025-06-18" },
    { id: "C-2033", name: "רות ישראלי", service: "קשישים", status: "נסגר", lastUpdate: "2025-05-30" },
    { id: "C-2050", name: "אייל בן-דוד", service: "ילדים בסיכון", status: "פעיל", lastUpdate: "2025-06-22" },
  ];

  const caseColumns: ColumnDef<CaseRow>[] = [
    { accessorKey: "id", header: "מזהה תיק" },
    { accessorKey: "name", header: "שם" },
    { accessorKey: "service", header: "שירות" },
    { accessorKey: "status", header: "סטטוס" },
    { accessorKey: "lastUpdate", header: "עודכן" },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">מחלקת רווחה</h1>
        <p className="text-muted-foreground text-lg">מעקב מקבלי שירות, שירותים ומגמות</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">סה"כ מקבלי שירות</p><p className="text-3xl font-bold">{kpi.recipients.toLocaleString()}</p></div><Users className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">משפחות</p><p className="text-3xl font-bold">{kpi.families.toLocaleString()}</p></div><HeartPulse className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">אנשים עם מוגבלות</p><p className="text-3xl font-bold">{kpi.disabilities.toLocaleString()}</p></div><AlertTriangle className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">ילדים בסיכון</p><p className="text-3xl font-bold">{kpi.riskChildren.toLocaleString()}</p></div><Baby className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">התפלגות שירותים</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={servicesPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {servicesPie.map((e,i)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">מגמת מקבלי שירות</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="recipients" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">רשימת תיקים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButtons data={cases} fileBaseName="welfare-cases" />
            </div>
            <DataTable
              columns={caseColumns}
              data={cases}
              searchPlaceholder="חיפוש תיקים..."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
