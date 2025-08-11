import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Building2, MapPin, Layers, CheckCircle2, Clock, Wrench, FileSpreadsheet } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import MapboxMap from "@/components/shared/Map/MapboxMap";
import { MapboxTokenField } from "@/components/shared/Map/MapboxTokenField";
import { DateRange } from "react-day-picker";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import { Button } from "@/components/ui/button";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";
import AddPlanDialog from "@/components/Engineering/AddPlanDialog";


const statusData = [
  { status: "בהכנה", value: 12 },
  { status: "בהליך אישור", value: 8 },
  { status: "אושרה", value: 5 },
  { status: "בביצוע", value: 3 },
  { status: "הושלמה", value: 2 },
];

const landUseData = [
  { use: "מגורים", area: 420 },
  { use: "מסחר", area: 180 },
  { use: "תעשייה", area: 120 },
  { use: "ציבור", area: 90 },
  { use: "שטח פתוח", area: 260 },
];

type Plan = {
  id: string;
  name: string;
  area: string;
  status: string;
  use: string;
  updatedAt: string;
};

const plans: Plan[] = [
  { id: "תב\"ע-101", name: "שכונת נווה צפון", area: "רמת גן", status: "בהליך אישור", use: "מגורים", updatedAt: "2025-06-21" },
  { id: "תב\"ע-205", name: "פארק תעשייה מזרח", area: "אזור תעשייה", status: "בביצוע", use: "תעשייה", updatedAt: "2025-06-15" },
  { id: "תב\"ע-317", name: "מרכז עירוני חדש", area: "מרכז", status: "אושרה", use: "מסחר", updatedAt: "2025-05-28" },
  { id: "תב\"ע-402", name: "הרחבת שכונת גנים", area: "דרום", status: "בהכנה", use: "מגורים", updatedAt: "2025-05-02" },
  { id: "תב\"ע-509", name: "קריית חינוך", area: "מערב", status: "הושלמה", use: "ציבור", updatedAt: "2025-04-19" },
];

const planColumns: ColumnDef<Plan>[] = [
  { accessorKey: "id", header: "מספר תוכנית" },
  { accessorKey: "name", header: "שם תוכנית" },
  { accessorKey: "area", header: "אזור" },
  { accessorKey: "use", header: "ייעוד" },
  { accessorKey: "status", header: "סטטוס" },
  { accessorKey: "updatedAt", header: "עודכן" },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--warning))"];

export default function EngineeringDashboard() {
  const totalPlans = statusData.reduce((s, i) => s + i.value, 0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">מחלקת הנדסה</h1>
          <p className="text-muted-foreground text-lg">תכנון, סטטוסים וייעודי קרקע</p>
        </div>
        <div className="flex items-center gap-2">
          <AddPlanDialog />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 ml-2" /> ייבוא נתונים
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ייבוא נתונים למחלקת הנדסה</DialogTitle>
              </DialogHeader>
              <DataUploader context="engineering" />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <ExecutiveTasksBanner department="engineering" />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">סה"כ תוכניות</p>
                <p className="text-3xl font-bold text-foreground">{totalPlans}</p>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">בתהליך אישור</p>
                <p className="text-3xl font-bold text-foreground">{statusData[1].value}</p>
              </div>
              <div className="h-12 w-12 bg-warning rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">אושרו השנה</p>
                <p className="text-3xl font-bold text-foreground">{statusData[2].value}</p>
              </div>
              <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">שטח בתכנון (דונם)</p>
                <p className="text-3xl font-bold text-foreground">{landUseData.reduce((s,i)=>s+i.area,0)}</p>
              </div>
              <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center">
                <Layers className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">סטטוס תוכניות (דונאט)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">ייעודי קרקע (מוערם)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={landUseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="use" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="area" name="שטח" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">מפת תוכניות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <MapboxTokenField />
              <MapboxMap height={360} />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">טבלת תוכניות מפורטת</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <ExportButtons data={plans} fileBaseName="engineering-plans" />
            </div>
            <DataTable columns={planColumns} data={plans} searchPlaceholder="חיפוש תוכניות..." />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
