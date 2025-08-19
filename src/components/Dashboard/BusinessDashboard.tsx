import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { Store, Bell, FileSpreadsheet, Timer, AlertTriangle } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButtons } from "@/components/shared/ExportButtons";
import type { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import { Button } from "@/components/ui/button";
import MapboxMap from "@/components/shared/Map/MapboxMap";
import { MapboxTokenField } from "@/components/shared/Map/MapboxTokenField";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";
import { supabase } from "@/integrations/supabase/client";
import AddLicenseDialog from "@/components/Business/AddLicenseDialog";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const kpi = {
  registered: 1840,
  active: 1630,
  expiringThisMonth: 42,
  newRequests: 28,
};

// נתוני תרשימים יחושבו דינמית לפי סינון הרשימה

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--muted-foreground))"];

type LicenseRow = {
  id: string;
  business_name: string | null;
  type: string | null;
  status: string | null;
  license_number: string | null;
  expires_at: string | null;
};

export default function BusinessDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { user, session } = useAuth();
  const isUuid = (v?: string | null) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  const isDemo = !session || !isUuid(user?.id);

  // Licenses list (DB for auth users)
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const reloadLicenses = async () => {
    try {
      const { data } = await supabase
        .from('licenses')
        .select('id,business_name,type,status,license_number,expires_at')
        .order('created_at', { ascending: false });
      if (data) setLicenses(data as any);
    } catch {}
  };

  useEffect(() => {
    reloadLicenses();
    const channel = supabase
      .channel('public:licenses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'licenses' }, () => {
        reloadLicenses();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Reasons for no license (aggregated from DB, fallback to sample)
  const [reasonData, setReasonData] = useState<{ name: string; value: number }[]>([]);
  useEffect(() => {
    let cancelled = false;
    async function loadReasons() {
      try {
        const { data, error } = await supabase.from('licenses').select('reason_no_license');
        if (error || !data) {
          if (!cancelled) setReasonData([{ name: 'ממתין להשלמות', value: 12 }, { name: 'נדחה', value: 7 }, { name: 'אחר', value: 5 }]);
          return;
        }
        const counts: Record<string, number> = {};
        for (const row of data as any[]) {
          const key = row.reason_no_license || 'לא צוין';
          counts[key] = (counts[key] || 0) + 1;
        }
        if (!cancelled) setReasonData(Object.entries(counts).map(([name, value]) => ({ name, value: value as number })));
      } catch {
        if (!cancelled) setReasonData([{ name: 'ממתין להשלמות', value: 12 }, { name: 'נדחה', value: 7 }, { name: 'אחר', value: 5 }]);
      }
    }
    loadReasons();
    return () => { cancelled = true; };
  }, []);

const licenseColumns: ColumnDef<LicenseRow>[] = [
    { accessorKey: "license_number", header: "מספר רישיון" },
    { accessorKey: "business_name", header: "שם עסק" },
    { accessorKey: "type", header: "סוג" },
    { accessorKey: "status", header: "סטטוס" },
    { accessorKey: "expires_at", header: "תוקף עד" },
  ];

  // Filters and derived datasets
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [soonFilter, setSoonFilter] = useState<number>(0); // 0 = no filter, else days

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return Infinity;
    const today = new Date();
    const target = new Date(dateStr);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredLicenses = licenses.filter((l) => {
    const sOk = statusFilter === 'all' || l.status === statusFilter;
    const tOk = typeFilter === 'all' || l.type === typeFilter;
    const soonOk = soonFilter === 0 || (() => { const d = daysUntil(l.expires_at); return d >= 0 && d <= soonFilter; })();
    return sOk && tOk && soonOk;
  });

  const licenseStatusData = Object.entries(
    filteredLicenses.reduce((acc, l) => {
      const key = l.status || 'לא צוין';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const businessTypesData = Object.entries(
    filteredLicenses.reduce((acc, l) => {
      const key = l.type || 'אחר';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  const expiredCount = licenses.reduce((acc, l) => acc + (l.status === 'פג תוקף' ? 1 : 0), 0);
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
        <div className="flex items-center gap-2">
          <AddLicenseDialog onSaved={reloadLicenses} />
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
        </div>
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
                <Pie data={licenseStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {licenseStatusData.map((e,i)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
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
              <BarChart data={businessTypesData}>
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

      <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">סיבות ללא רישוי</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={reasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {reasonData.map((e,i)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">מפת עסקים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">הזן/י טוקן Mapbox ציבורי כדי להציג את המפה.</p>
              <MapboxTokenField />
            </div>
            <MapboxMap height={360} />
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
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <Select value={statusFilter} onValueChange={(v)=>setStatusFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="סטטוס" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="פעיל">פעיל</SelectItem>
                  <SelectItem value="מבוטל">מבוטל</SelectItem>
                  <SelectItem value="זמני">זמני</SelectItem>
                  <SelectItem value="מתחדש">מתחדש</SelectItem>
                  <SelectItem value="פג תוקף">פג תוקף</SelectItem>
                  <SelectItem value="ללא רישוי">ללא רישוי</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(v)=>setTypeFilter(v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="סוג עסק" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  <SelectItem value="מסחר">מסחר</SelectItem>
                  <SelectItem value="שירותים">שירותים</SelectItem>
                  <SelectItem value="מזון">מזון</SelectItem>
                  <SelectItem value="תעשייה קלה">תעשייה קלה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>

              <Select value={String(soonFilter)} onValueChange={(v)=>setSoonFilter(Number(v))}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="פג תוקף בקרוב" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="0">ללא סינון תוקף</SelectItem>
                  <SelectItem value="30">פחות מ-30 יום</SelectItem>
                  <SelectItem value="60">פחות מ-60 יום</SelectItem>
                  <SelectItem value="90">פחות מ-90 יום</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <Button variant="outline" size="sm" onClick={()=>{setStatusFilter('all'); setTypeFilter('all'); setSoonFilter(0);}}>איפוס</Button>
              <ExportButtons data={filteredLicenses} fileBaseName="business-licenses" />
            </div>
            <DataTable
              columns={licenseColumns}
              data={filteredLicenses}
              searchPlaceholder="חיפוש עסקים..."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
