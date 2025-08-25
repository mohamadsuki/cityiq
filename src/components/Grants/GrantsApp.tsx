import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DataUploader } from "@/components/shared/DataUploader";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { FileText, TrendingUp, CheckCircle, Clock, AlertCircle, DollarSign, Upload, Edit, Trash2 } from "lucide-react";

// Enhanced 3D color palette for charts - vibrant, non-black colors
const CHART_COLORS = [
  'hsl(220, 91%, 55%)', // bright blue
  'hsl(142, 76%, 36%)', // emerald green
  'hsl(271, 81%, 56%)', // vibrant purple
  'hsl(47, 96%, 53%)', // golden yellow
  'hsl(346, 87%, 43%)', // rose red
  'hsl(199, 89%, 48%)', // sky blue
  'hsl(32, 95%, 44%)', // orange
  'hsl(302, 84%, 61%)', // pink
  'hsl(168, 76%, 42%)', // teal
  'hsl(262, 83%, 58%)', // indigo
  'hsl(120, 60%, 50%)', // lime green
  'hsl(14, 100%, 57%)', // coral
  'hsl(280, 100%, 70%)', // magenta
  'hsl(39, 100%, 50%)', // amber
  'hsl(210, 100%, 60%)', // light blue
];

// Grant types aligned with DB
export type GrantStatus = 'הוגש' | 'אושר' | 'נדחה' | 'לא רלוונטי';

type Grant = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: DepartmentSlug | null;
  name: string | null;
  ministry: string | null;
  amount: number | null;
  status: string | null; // free text in DB, we use labels above
  submitted_at: string | null; // date
  decision_at: string | null; // date
  project_description?: string | null;
  responsible_person?: string | null;
  submission_amount?: number | null;
  approved_amount?: number | null;
  support_amount?: number | null;
  municipality_participation?: number | null;
  notes?: string | null;
  rejection_reason?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  'הוגש': 'הוגש',
  'אושר': 'אושר',
  'נדחה': 'נדחה',
  'לא רלוונטי': 'לא רלוונטי',
  // Map English statuses to Hebrew
  'SUBMITTED': 'הוגש',
  'APPROVED': 'אושר',
  'REJECTED': 'נדחה',
  'NOT_RELEVANT': 'לא רלוונטי',
  'submitted': 'הוגש',
  'approved': 'אושר',
  'rejected': 'נדחה',
  'not_relevant': 'לא רלוונטי',
};

const statusVariant = (s: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const hebrewStatus = s ? STATUS_LABELS[s] || s : null;
  switch (hebrewStatus) {
    case 'אושר': return 'default';
    case 'נדחה': return 'destructive';
    case 'הוגש': return 'secondary';
    case 'לא רלוונטי': return 'outline';
    default: return 'outline';
  }
};

export default function GrantsApp() {
  const { role, departments, user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [showUploader, setShowUploader] = useState(false);
  
  const canCreate = role === 'mayor' || role === 'ceo' || role === 'manager';
  const visibleDepartments: DepartmentSlug[] = (role === 'mayor' || role === 'ceo') ?
    ['finance','education','engineering','welfare','non-formal','business'] : departments;

  // Rejection reasons for when status is "נדחה" or "לא רלוונטי"
  const rejectionReasons = [
    "אי-עמידה בתנאי סף",
    "חוסר תקצוב", 
    "החלטת עירייה",
    "אחר"
  ];

  const [loading, setLoading] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<'all' | GrantStatus>('all');
  const [department, setDepartment] = useState<'all' | DepartmentSlug>('all');
  const [ministry, setMinistry] = useState<'all' | string>('all');
  
  // Active segment states for exploded pie charts
  const [activeMinistryIndex, setActiveMinistryIndex] = useState<number | null>(null);
  const [activeDepartmentIndex, setActiveDepartmentIndex] = useState<number | null>(null);

  // Handle filtering from "What's New" section
  const filter = searchParams.get("filter");
  const period = searchParams.get("period");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      const text = `${g.name ?? ''} ${g.ministry ?? ''}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (status !== 'all' && g.status !== status) return false;
      if (role === 'manager' && departments && !departments.includes((g.department_slug as DepartmentSlug))) return false;
      if (department !== 'all' && g.department_slug !== department) return false;
      if (ministry !== 'all' && g.ministry !== ministry) return false;
      
      // Apply filter from "What's New" section
      if (filter === 'new' && period) {
        const now = new Date();
        let from: Date, to: Date;
        
        if (period === 'custom' && fromParam && toParam) {
          from = new Date(fromParam);
          to = new Date(toParam);
        } else {
          // Calculate date range based on period
          to = now;
          switch (period) {
            case 'week':
              from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default: // day
              from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
        }
        
        // Show only grants created in the time range
        const createdAt = new Date(g.created_at);
        if (createdAt < from || createdAt > to) return false;
      }
      
      return true;
    });
  }, [grants, q, status, department, ministry, role, departments, filter, period, fromParam, toParam]);

  type SortKey = 'name' | 'ministry' | 'amount' | 'status' | 'submitted_at' | 'decision_at';
  const [sortBy, setSortBy] = useState<SortKey>('decision_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const compare = (a: any, b: any) => {
      const getVal = (obj: any, key: SortKey) => obj?.[key];
      if (sortBy.includes('_at')) {
        const ta = getVal(a, sortBy) ? new Date(getVal(a, sortBy)).getTime() : 0;
        const tb = getVal(b, sortBy) ? new Date(getVal(b, sortBy)).getTime() : 0;
        return sortDir === 'asc' ? ta - tb : tb - ta;
      }
      const va = getVal(a, sortBy);
      const vb = getVal(b, sortBy);
      if (typeof va === 'number' || typeof vb === 'number') {
        const diff = Number(va || 0) - Number(vb || 0);
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = String(va || '').localeCompare(String(vb || ''), 'he');
      return sortDir === 'asc' ? diff : -diff;
    };
    arr.sort(compare);
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      } else {
        setSortDir('asc');
        return key;
      }
    });
  };

  async function fetchGrants() {
    setLoading(true);
    
    let query = supabase.from('grants').select('*').order('created_at', { ascending: false });
    if (department !== 'all') query = query.eq('department_slug', department as any);
    const { data, error } = await query;
    if (error) {
      console.error('Failed to load grants', error);
      toast({ title: 'שגיאה בטעינת קולות קוראים', description: error.message, variant: 'destructive' });
      setGrants([]);
    } else {
      setGrants((data || []) as Grant[]);
    }
    setLoading(false);
  }

  const updateGrantStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('grants')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setGrants(prev => 
        prev.map(grant => 
          grant.id === id ? { ...grant, status: newStatus } : grant
        )
      );

      toast({
        title: "הצלחה",
        description: "הסטטוס עודכן בהצלחה",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUploader(false);
    fetchGrants();
    toast({
      title: "הצלחה",
      description: "הקובץ הועלה בהצלחה והנתונים נשמרו",
    });
  };

  useEffect(() => { fetchGrants(); }, []);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Grant | null>(null);
  const [form, setForm] = useState<Partial<Grant>>({
    name: '',
    ministry: '',
    amount: null,
    status: 'הוגש',
    department_slug: (visibleDepartments?.[0] ?? 'finance') as DepartmentSlug,
    submitted_at: '',
    decision_at: '',
  });

  function openCreate() {
    setEditing(null);
    setForm({
      name: '', ministry: '', amount: null, status: 'הוגש',
      department_slug: (visibleDepartments?.[0] ?? 'finance') as DepartmentSlug,
      submitted_at: '', decision_at: ''
    });
    setOpen(true);
  }
  function openEdit(g: Grant) { setEditing(g); setForm({ ...g }); setOpen(true); }

  async function saveGrant() {
    if (!form.name || !form.department_slug) {
      toast({ title: 'שדות חסרים', description: 'שם ומחלקה הינם חובה', variant: 'destructive' });
      return;
    }

    if (!user?.id) {
      toast({ title: 'נדרש להתחבר', description: 'יש להתחבר כדי לשמור', variant: 'destructive' });
      return;
    }

    const payload: any = {
      name: form.name,
      ministry: form.ministry,
      amount: form.amount,
      status: form.status,
      department_slug: form.department_slug,
      submitted_at: form.submitted_at || null,
      decision_at: form.decision_at || null,
      rejection_reason: (form.status === 'נדחה' || form.status === 'לא רלוונטי') ? form.rejection_reason : null,
      user_id: user.id,
    };
    let error;
    if (editing) {
      const resp = await supabase.from('grants').update(payload).eq('id', editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase.from('grants').insert([payload]);
      error = resp.error as any;
    }
    if (error) {
      toast({ title: 'שמירה נכשלה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'הצלחה', description: 'הקול הקורא נשמר בהצלחה' });
      setOpen(false);
      fetchGrants();
    }
  }

  async function deleteGrant(g: Grant) {
    if (!confirm('למחוק רשומת קול קורא זו?')) return;
    const { error } = await supabase.from('grants').delete().eq('id', g.id);
    if (error) toast({ title: 'מחיקה נכשלה', description: error.message, variant: 'destructive' });
    else { toast({ title: 'נמחק', description: 'נמחק בהצלחה' }); fetchGrants(); }
  }

  const daysLeft = (g: Grant) => {
    if (!g.decision_at) return null;
    const today = new Date();
    const due = new Date(g.decision_at);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000*60*60*24));
    return diff;
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const total = grants.length;
    const approved = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'אושר';
    }).length;
    const submitted = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'הוגש';
    }).length;
    const rejected = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'נדחה';
    }).length;
    const notRelevant = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'לא רלוונטי';
    }).length;
    const totalAmount = grants.reduce((sum, g) => sum + (g.amount || 0), 0);
    const approvedAmount = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'אושר';
    }).reduce((sum, g) => sum + (g.approved_amount || 0), 0);
    const submittedAmount = grants.filter(g => {
      const hebrewStatus = g.status ? STATUS_LABELS[g.status] || g.status : null;
      return hebrewStatus === 'הוגש';
    }).reduce((sum, g) => sum + (g.amount || 0), 0);
    
    return {
      total,
      approved,
      submitted,
      rejected,
      notRelevant,
      totalAmount,
      approvedAmount,
      submittedAmount,
      successRate: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  }, [grants]);

  // Data for charts
  const statusChartData = [
    { name: 'מאושרים', value: stats.approved, color: '#22c55e' },
    { name: 'הוגשו', value: stats.submitted, color: '#f59e0b' },
    { name: 'נדחים', value: stats.rejected, color: '#ef4444' },
    { name: 'לא רלוונטי', value: stats.notRelevant, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Ministry data for pie chart
  const ministryData = useMemo(() => {
    const ministryCounts: Record<string, number> = {};
    const ministryAmounts: Record<string, number> = {};
    
    grants.forEach(g => {
      const ministry = g.ministry || 'לא צוין';
      ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
      ministryAmounts[ministry] = (ministryAmounts[ministry] || 0) + (g.approved_amount || 0);
    });

    return Object.keys(ministryCounts).map(ministry => ({
      name: ministry,
      count: ministryCounts[ministry],
      amount: ministryAmounts[ministry]
    }));
  }, [grants]);

  // Department data for pie chart  
  const departmentData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    const deptAmounts: Record<string, number> = {};
    
    grants.forEach(g => {
      const dept = g.department_slug || 'אחר';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      deptAmounts[dept] = (deptAmounts[dept] || 0) + (g.approved_amount || 0);
    });

    return Object.keys(deptCounts).map(dept => ({
      name: deptLabel(dept as DepartmentSlug),
      count: deptCounts[dept],
      amount: deptAmounts[dept]
    }));
  }, [grants]);

  // Get unique ministries for filter
  const availableMinistries = useMemo(() => {
    const ministries = new Set<string>();
    grants.forEach(g => {
      if (g.ministry && g.ministry.trim()) {
        ministries.add(g.ministry);
      }
    });
    return Array.from(ministries).sort();
  }, [grants]);

  // Custom tooltip for 3D effect
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 animate-fade-in">
          <p className="font-semibold text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            מספר: <span className="text-foreground font-medium">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            סכום: <span className="text-foreground font-medium">₪{data.amount.toLocaleString('he-IL')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.value}</span>
            <span className="text-muted-foreground text-xs">
              ({entry.payload.count})
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">קולות קוראים</h1>
          <p className="text-sm text-muted-foreground">הוספה/עריכה, סטטוס ולו"ז</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUploader(true)}
          >
            <Upload className="h-4 w-4 ml-2" />
            העלה קובץ אקסל
          </Button>
          {canCreate && (
            <Button onClick={openCreate}>קול קורא חדש</Button>
          )}
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">סה"כ קולות קוראים</CardTitle>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">מאושרים</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</div>
            <p className="text-xs text-green-700 dark:text-green-300">
              {stats.successRate}% שיעור הצלחה
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">הוגשו וטרם אושרו</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">סכום כולל</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₪{stats.totalAmount.toLocaleString('he-IL')}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              מאושר: ₪{stats.approvedAmount.toLocaleString('he-IL')}
            </p>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              הוגש: ₪{stats.submittedAmount.toLocaleString('he-IL')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts with side legends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי משרד מממן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 h-96">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {CHART_COLORS.map((color, index) => (
                        <linearGradient key={index} id={`gradient-ministry-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={ministryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      innerRadius={20}
                      fill="#8884d8"
                      dataKey="count"
                      onMouseEnter={(_, index) => setActiveMinistryIndex(index)}
                      onMouseLeave={() => setActiveMinistryIndex(null)}
                      animationBegin={0}
                      animationDuration={800}
                      className="animate-fade-in drop-shadow-lg"
                    >
                      {ministryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#gradient-ministry-${index % CHART_COLORS.length})`}
                          className="hover:brightness-110 transition-all duration-300 cursor-pointer filter drop-shadow-md"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          style={{
                            filter: activeMinistryIndex === index 
                              ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4)) brightness(1.2)' 
                              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            transform: activeMinistryIndex === index ? 'scale(1.15)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-56 border-r border-border pr-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">משרדים מממנים</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {ministryData.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                        activeMinistryIndex === index 
                          ? 'bg-primary/10 border-primary/30 shadow-md scale-105' 
                          : 'hover:bg-muted/50 border-transparent'
                      }`}
                      onMouseEnter={() => setActiveMinistryIndex(index)}
                      onMouseLeave={() => setActiveMinistryIndex(null)}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm border-2 border-background/50 flex-shrink-0" 
                        style={{ 
                          background: `linear-gradient(135deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}cc)` 
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium truncate text-sm">{entry.name}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          <div>{entry.count} קולות קוראים</div>
                          <div className="font-medium">₪{entry.amount.toLocaleString('he-IL')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי מחלקה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 h-96">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {CHART_COLORS.map((color, index) => (
                        <linearGradient key={index} id={`gradient-dept-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={color} stopOpacity={1} />
                          <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      innerRadius={20}
                      fill="#8884d8"
                      dataKey="count"
                      onMouseEnter={(_, index) => setActiveDepartmentIndex(index)}
                      onMouseLeave={() => setActiveDepartmentIndex(null)}
                      animationBegin={200}
                      animationDuration={800}
                      className="animate-fade-in drop-shadow-lg"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#gradient-dept-${(index + 5) % CHART_COLORS.length})`}
                          className="hover:brightness-110 transition-all duration-300 cursor-pointer filter drop-shadow-md"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                          style={{
                            filter: activeDepartmentIndex === index 
                              ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4)) brightness(1.2)' 
                              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            transform: activeDepartmentIndex === index ? 'scale(1.15)' : 'scale(1)',
                            transformOrigin: 'center'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-56 border-r border-border pr-4">
                <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">מחלקות</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {departmentData.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                        activeDepartmentIndex === index 
                          ? 'bg-primary/10 border-primary/30 shadow-md scale-105' 
                          : 'hover:bg-muted/50 border-transparent'
                      }`}
                      onMouseEnter={() => setActiveDepartmentIndex(index)}
                      onMouseLeave={() => setActiveDepartmentIndex(null)}
                    >
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm border-2 border-background/50 flex-shrink-0" 
                        style={{ 
                          background: `linear-gradient(135deg, ${CHART_COLORS[(index + 5) % CHART_COLORS.length]}, ${CHART_COLORS[(index + 5) % CHART_COLORS.length]}cc)` 
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium truncate text-sm">{entry.name}</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          <div>{entry.count} קולות קוראים</div>
                          <div className="font-medium">₪{entry.amount.toLocaleString('he-IL')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Label htmlFor="q">חיפוש</Label>
            <Input id="q" placeholder="שם/משרד" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="הוגש">הוגש</SelectItem>
                <SelectItem value="אושר">אושר</SelectItem>
                <SelectItem value="נדחה">נדחה</SelectItem>
                <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>משרד מממן</Label>
            <Select value={ministry} onValueChange={(v) => setMinistry(v as any)}>
              <SelectTrigger><SelectValue placeholder="משרד" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                {availableMinistries.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>מחלקה</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as any)}>
              <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                {visibleDepartments.map((d) => (
                  <SelectItem key={d} value={d}>{deptLabel(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 text-right cursor-pointer select-none" onClick={() => toggleSort('name')}>
                שם {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('ministry')}>
                משרד {sortBy === 'ministry' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none">
                מחלקה
              </th>
              <th className="py-2 cursor-pointer select-none">
                פרויקט/נושא
              </th>
              <th className="py-2 cursor-pointer select-none">
                אחראי
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                תקציב קול קורא {sortBy === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none">
                סכום הגשה
              </th>
              <th className="py-2 cursor-pointer select-none">
                סכום אושר
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                סטטוס {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="py-6" colSpan={10}>טוען…</td></tr>)}
            {!loading && sorted.length === 0 && (<tr><td className="py-6" colSpan={10}>אין נתונים</td></tr>)}
            {!loading && sorted.map((g: any) => (
              <tr key={g.id} className="border-b border-border">
                <td className="py-3 font-medium">{g.name}</td>
                <td className="py-3">{g.ministry || '—'}</td>
                <td className="py-3">{deptLabel(g.department_slug as DepartmentSlug) || '—'}</td>
                <td className="py-3">{g.project_description || '—'}</td>
                <td className="py-3">{g.responsible_person || '—'}</td>
                <td className="py-3">{g.amount ? g.amount.toLocaleString('he-IL') : '—'}</td>
                <td className="py-3">{g.submission_amount ? g.submission_amount.toLocaleString('he-IL') : '—'}</td>
                <td className="py-3">{g.approved_amount ? g.approved_amount.toLocaleString('he-IL') : '—'}</td>
                <td className="py-3">
                  <div className="space-y-1">
                    <Badge variant={statusVariant(g.status)}>
                      {labelForStatus(g.status)}
                    </Badge>
                    {(g.status === 'נדחה' || g.status === 'לא רלוונטי') && g.rejection_reason && (
                      <div className="text-xs text-muted-foreground">{g.rejection_reason}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 space-x-1 space-x-reverse">
                  <Button size="sm" variant="outline" onClick={() => openEdit(g)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteGrant(g)} className="h-8 w-8 p-0">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת קול קורא' : 'קול קורא חדש'}</DialogTitle>
            <DialogDescription className="sr-only">אשף יצירה/עריכה</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div className="md:col-span-2">
              <Label>שם</Label>
              <Input value={form.name as string} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>משרד</Label>
              <Input value={form.ministry as string} onChange={(e) => setForm((f) => ({ ...f, ministry: e.target.value }))} />
            </div>
            <div>
              <Label>סכום</Label>
              <Input type="number" value={(form.amount as number | null) ?? 0} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select value={(form.status as string) || 'הוגש'} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="הוגש">הוגש</SelectItem>
                  <SelectItem value="אושר">אושר</SelectItem>
                  <SelectItem value="נדחה">נדחה</SelectItem>
                  <SelectItem value="לא רלוונטי">לא רלוונטי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {((form.status === 'נדחה' || form.status === 'לא רלוונטי')) && (
              <div>
                <Label>סיבת הדחייה</Label>
                <Select value={(form.rejection_reason as string) || ''} onValueChange={(v) => setForm((f) => ({ ...f, rejection_reason: v }))}>
                  <SelectTrigger><SelectValue placeholder="בחר סיבה" /></SelectTrigger>
                  <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                    {rejectionReasons.map((reason) => (
                      <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>מחלקה</Label>
              <Select value={(form.department_slug as DepartmentSlug) ?? 'finance'} onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}>
                <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {visibleDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{deptLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך הגשה</Label>
              <Input type="date" value={form.submitted_at as string} onChange={(e) => setForm((f) => ({ ...f, submitted_at: e.target.value }))} />
            </div>
            <div>
              <Label>תאריך החלטה</Label>
              <Input type="date" value={form.decision_at as string} onChange={(e) => setForm((f) => ({ ...f, decision_at: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={saveGrant}>{editing ? 'שמירה' : 'יצירה'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      {showUploader && (
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent dir="rtl" className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ייבוא קולות קוראים מקובץ אקסל</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DataUploader 
                context="grants"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ אקסל עם קולות קוראים. הקובץ צריך להכיל עמודות: שם, משרד, תיאור פרויקט, אחראי, תקציב קול קורא, סכום הגשה, סכום אושר, סטטוס.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function deptLabel(d: DepartmentSlug) {
  const map: Record<DepartmentSlug, string> = {
    finance: 'כספים', education: 'חינוך', engineering: 'הנדסה', welfare: 'רווחה', 'non-formal': 'חינוך בלתי פורמלי', business: 'עסקים', ceo: 'מנכ"ל'
  } as any;
  return map[d] || d;
}

function labelForStatus(s: string | null) {
  if (!s) return '—';
  return STATUS_LABELS[s] || s;
}

function formatDays(diff: number | null) {
  if (diff === null) return '—';
  if (diff < 0) return `${Math.abs(diff)} ימים עברו`;
  if (diff === 0) return 'היום';
  return `עוד ${diff} ימים`;
}
