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
import { EditLicenseDialog } from "@/components/Business/EditLicenseDialog";
import { ViewLicenseDialog } from "@/components/Business/ViewLicenseDialog";
import { useAuth } from "@/context/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Eye, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


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
  owner: string | null;
  type: string | null;
  status: string | null;
  license_number: string | null;
  expires_at: string | null;
  address: string | null;
  reason_no_license: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  validity: string | null;
  business_nature: string | null;
  request_date: string | null;
  expiry_date: string | null;
  request_type: string | null;
  group_category: string | null;
  reported_area: number | null;
  lat: number | null;
  lng: number | null;
};

export default function BusinessDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { user, session } = useAuth();
  const { toast } = useToast();
  const isUuid = (v?: string | null) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<any>(null);

  // Licenses list (DB for auth users, localStorage for demo)
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [totalBusinessesInCity, setTotalBusinessesInCity] = useState<number | null>(null);
  
  // Load total businesses from city settings
  useEffect(() => {
    const loadCitySettings = async () => {
      try {
        const { data } = await supabase
          .from('city_settings')
          .select('total_businesses_in_city')
          .eq('id', 'global')
          .maybeSingle();
        
        if (data) {
          setTotalBusinessesInCity(data.total_businesses_in_city);
        }
      } catch (error) {
        console.error('Error loading city settings:', error);
      }
    };
    
    loadCitySettings();
    
    // Listen for real-time updates
    const channel = supabase
      .channel('city-settings-business-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'city_settings',
        filter: 'id=eq.global'
      }, (payload) => {
        const row: any = payload.new || payload.old;
        if (row) {
          setTotalBusinessesInCity(row.total_businesses_in_city || null);
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  const reloadLicenses = async () => {
    try {
      const { data, error } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
        setLicenses((data || []).map((r) => ({
          id: r.id,
          business_name: r.business_name ?? null,
          owner: r.owner ?? null,
          type: r.type ?? null,
          status: r.status ?? null,
          license_number: r.license_number ?? null,
          expires_at: r.expires_at ?? null,
          address: r.address ?? null,
          reason_no_license: r.reason_no_license ?? null,
          phone: (r as any).phone ?? null,
          mobile: (r as any).mobile ?? null,
          email: (r as any).email ?? null,
          validity: (r as any).validity ?? null,
          business_nature: (r as any).business_nature ?? null,
          request_date: (r as any).request_date ?? null,
          expiry_date: (r as any).expiry_date ?? null,
          request_type: (r as any).request_type ?? null,
          group_category: (r as any).group_category ?? null,
          reported_area: (r as any).reported_area ?? null,
          lat: r.lat ?? null,
          lng: r.lng ?? null,
        })));
    } catch {}
  };

  useEffect(() => {
    reloadLicenses();
    const channel = supabase
      .channel('public:licenses')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'licenses' }, () => {
        reloadLicenses();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'licenses' }, () => {
        reloadLicenses();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'licenses' }, () => {
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

  const handleEditLicense = (license: any) => {
    setSelectedLicense(license);
    setEditDialogOpen(true);
  };

  const handleViewLicense = (license: any) => {
    setSelectedLicense(license);
    setViewDialogOpen(true);
  };

  const handleDeleteLicense = async (licenseId: string) => {
    try {
      const { error } = await supabase.from('licenses').delete().eq('id', licenseId);
      if (error) throw error;
      
      toast({
        title: "רישיון נמחק בהצלחה",
        description: "הרישיון הוסר מהמערכת",
      });
      
      reloadLicenses();
    } catch (error: any) {
      toast({
        title: "שגיאה במחיקת הרישיון",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const licenseColumns: ColumnDef<LicenseRow>[] = [
    { accessorKey: "license_number", header: "מספר רישיון" },
    { accessorKey: "business_name", header: "שם עסק" },
    { accessorKey: "owner", header: "בעלים" },
    { 
      accessorKey: "validity", 
      header: "סטטוס",
      cell: ({ getValue }) => {
        const value = getValue() as string;
        // Remove leading numbers from the status
        return value ? value.toString().replace(/^\d+/, '').trim() : '';
      }
    },
    { accessorKey: "business_nature", header: "מהות עסק" },
    { 
      accessorKey: "request_date", 
      header: "תאריך בקשה",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? new Date(date).toLocaleDateString('he-IL') : '';
      }
    },
    { 
      accessorKey: "expires_at", 
      header: "תאריך פקיעה",
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return date ? new Date(date).toLocaleDateString('he-IL') : '';
      }
    },
    { accessorKey: "request_type", header: "סוג בקשה" },
    { accessorKey: "group_category", header: "קבוצה" },
    { 
      accessorKey: "reported_area", 
      header: "שטח מדווח",
      cell: ({ getValue }) => {
        const area = getValue() as number;
        return area ? `${area} מ"ר` : '';
      }
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleViewLicense(row.original)}
            title="צפיה ברישיון"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditLicense(row.original)}
            title="עריכת רישיון"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDeleteLicense(row.original.id)}
            title="מחיקת רישיון"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
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
    // Clean validity field for filtering comparison
    const cleanStatus = (l.validity || '').toString().replace(/^\d+/, '').trim();
    const sOk = statusFilter === 'all' || cleanStatus === statusFilter;
    const tOk = typeFilter === 'all' || l.type === typeFilter;
    const soonOk = soonFilter === 0 || (() => { const d = daysUntil(l.expires_at); return d >= 0 && d <= soonFilter; })();
    return sOk && tOk && soonOk;
  });

  // Create status chart data based on cleaned validity field
  const statusData = Object.entries(
    filteredLicenses.reduce((acc, l) => {
      // Clean the validity field by removing leading numbers
      const cleanStatus = (l.validity || 'לא צוין').toString().replace(/^\d+/, '').trim() || 'לא צוין';
      acc[cleanStatus] = (acc[cleanStatus] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const businessTypesData = Object.entries(
    filteredLicenses.reduce((acc, l) => {
      const key = l.group_category || 'אחר';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({ type, count }));

  // Calculate KPIs from actual data
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter(l => l.status === 'פעיל').length;
  const expiredCount = licenses.filter(l => l.status === 'פג תוקף').length;
  const expiringCount = licenses.filter(l => {
    if (!l.expires_at) return false;
    const days = daysUntil(l.expires_at);
    return days >= 0 && days <= 30;
  }).length;
  const newRequests = licenses.filter(l => l.status === 'חדש' || l.status === 'בקשה').length;

  const alerts = [
    { id: "AL-001", title: "רישיונות שפוקעים בחודש הקרוב", count: expiringCount, severity: "warning" as const, icon: Timer },
    { id: "AL-002", title: "בקשות הממתינות לטיפול", count: newRequests, severity: "default" as const, icon: Bell },
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
                <FileSpreadsheet className="h-4 w-4 ml-2" /> העלה קובץ אקסל
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ייבוא נתונים לרישוי עסקים</DialogTitle>
              </DialogHeader>
              <DataUploader context="business" onUploadSuccess={reloadLicenses} />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">סה"כ עסקים בעיר</p><p className="text-3xl font-bold">{totalBusinessesInCity?.toLocaleString() || 'לא הוגדר'}</p></div><Store className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">עסקים רשומים</p><p className="text-3xl font-bold">{totalLicenses.toLocaleString()}</p></div><Store className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">עסקים פעילים</p><p className="text-3xl font-bold">{activeLicenses.toLocaleString()}</p></div><Store className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">רישיונות פוקעים החודש</p><p className="text-3xl font-bold">{expiringCount}</p></div><Timer className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
        <Card className="shadow-card"><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">בקשות חדשות</p><p className="text-3xl font-bold">{newRequests}</p></div><Bell className="h-6 w-6 text-muted-foreground"/></CardContent></Card>
      </section>

       <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="shadow-card">
           <CardHeader><CardTitle className="text-xl">סטטוס עסקים</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={statusData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                  >
                    {statusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'מספר עסקים']}
                    labelFormatter={(label) => `סטטוס: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="flex flex-col justify-center space-y-2">
                {statusData.map((item, index) => {
                  const total = statusData.reduce((sum, s) => sum + s.value, 0);
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          aria-hidden
                        />
                        <span className="text-muted-foreground text-xs">{item.name}:</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">{item.value}</div>
                        <div className="text-xs text-muted-foreground">{percentage}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
           </CardContent>
         </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">התפלגות קבוצות עסקים</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart 
                data={businessTypesData}
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="type" 
                  angle={-90}
                  textAnchor="start"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 10, fontWeight: 'bold', dy: 5, dx: -5 }}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'מספר עסקים']}
                  labelFormatter={(label) => `קבוצה: ${label}`}
                />
                <Bar 
                  dataKey="count" 
                  radius={[2, 2, 0, 0]}
                  maxBarSize={40}
                >
                  {businessTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
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
                  <SelectItem value="מתחדש">מתחדש</SelectItem>
                  <SelectItem value="בתהליך רישוי">בתהליך רישוי</SelectItem>
                  <SelectItem value="מבוטל">מבוטל</SelectItem>
                  <SelectItem value="זמני">זמני</SelectItem>
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

      <EditLicenseDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={reloadLicenses}
        license={selectedLicense}
      />

      <ViewLicenseDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        license={selectedLicense}
      />
    </div>
  );
}
