import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileSpreadsheet,
  Calculator,
  Receipt,
  Users,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/shared/DataTable";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { ExportButtons } from "@/components/shared/ExportButtons";
import type { ColumnDef } from "@tanstack/react-table";
import { DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AddBudgetDialog from "@/components/Finance/AddBudgetDialog";
import AddProjectDialog from "@/components/Finance/AddProjectDialog";

const budgetData = [
  { name: "חינוך", approved: 890, actual: 720, percentage: 81 },
  { name: "הנדסה", approved: 650, actual: 435, percentage: 67 },
  { name: "רווחה", approved: 320, actual: 285, percentage: 89 },
  { name: "תרבות", approved: 180, actual: 137, percentage: 76 },
  { name: "ביטחון", approved: 240, actual: 221, percentage: 92 },
];

// Projects data will be loaded dynamically from Supabase or demo storage


const grantsData = [
  { ministry: "משרד החינוך", amount: "45M", status: "approved" },
  { ministry: "משרד הפנים", amount: "32M", status: "pending" },
  { ministry: "משרד הבריאות", status: "rejected", amount: "12M" },
  { ministry: "משרד התחבורה", amount: "67M", status: "approved" },
];

const incomeSources = [
  { name: "ארנונה", value: 980 },
  { name: "אגרות", value: 240 },
  { name: "קנסות", value: 120 },
  { name: "אחר", value: 160 },
];

const collectionsTrend = [
  { month: "1/24", collected: 180 },
  { month: "3/24", collected: 195 },
  { month: "5/24", collected: 205 },
  { month: "7/24", collected: 215 },
  { month: "9/24", collected: 228 },
  { month: "11/24", collected: 236 },
];

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-success text-success-foreground';
    case 'pending': return 'bg-warning text-warning-foreground';
    case 'rejected': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return 'אושר';
    case 'pending': return 'בהמתנה';
    case 'rejected': return 'נדחה';
    default: return 'לא ידוע';
  }
};

export default function FinanceDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [tabarimData, setTabarimData] = useState<any[]>([]);
  const [regularBudgetData, setRegularBudgetData] = useState<any[]>([]);
  const [financialSummary, setFinancialSummary] = useState({
    annualBudget: 0,
    periodicBudget: 0,
    incomeActual: 0,
    expenseActual: 0,
    surplus: 0,
    totalTabarimCount: 0,
    totalTabarimAmount: 0
  });

  type ProjectRow = {
    name: string;
    title: string;
    budget: string;
    spent: string;
    progress: number;
    status: string;
  };

  const [projectsRows, setProjectsRows] = useState<ProjectRow[]>([]);

  const isUuid = (v?: string | null) => !!v && /^[0-9a-fA-F-]{36}$/.test(v);
  const isDemo = !session || !isUuid(user?.id);

  const formatCurrency = (v: number | null | undefined) =>
    v != null && !Number.isNaN(Number(v)) ? `₪${Number(v).toLocaleString('he-IL')}` : "—";

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `₪${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `₪${(num / 1000000).toFixed(0)}M`;
    if (num >= 1000) return `₪${(num / 1000).toFixed(0)}K`;
    return `₪${num.toLocaleString('he-IL')}`;
  };

  const mapProjectToRow = (p: any): ProjectRow => ({
    name: p.code || p.name || '—',
    title: p.name || '—',
    budget: formatCurrency(p.budget_approved),
    spent: formatCurrency(p.budget_executed),
    progress: Math.round(Number(p.progress || 0)),
    status: p.status || '—',
  });

  async function loadProjects() {
    if (isDemo) {
      try {
        const raw = localStorage.getItem('demo_projects');
        const list = raw ? JSON.parse(raw) : [];
        setProjectsRows((list as any[]).map(mapProjectToRow));
      } catch {
        setProjectsRows([]);
      }
      return;
    }
    const { data, error } = await supabase
      .from('projects')
      .select('id, code, name, budget_approved, budget_executed, progress, status')
      .order('created_at', { ascending: false });
    if (!error && data) setProjectsRows(data.map(mapProjectToRow));
  }

  async function loadFinancialData() {
    if (isDemo) {
      // Demo data for financial summary
      setFinancialSummary({
        annualBudget: 2400000000, // 2.4B
        periodicBudget: 600000000, // 600M
        incomeActual: 1950000000, // 1.95B
        expenseActual: 1680000000, // 1.68B
        surplus: 270000000, // 270M
        totalTabarimCount: 47,
        totalTabarimAmount: 890000000 // 890M
      });
      return;
    }

    try {
      // Load tabarim data
      const { data: tabarimData, error: tabarimError } = await supabase
        .from('tabarim')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!tabarimError && tabarimData) {
        setTabarimData(tabarimData);
        const totalCount = tabarimData.length;
        const totalAmount = tabarimData.reduce((sum, item) => sum + (Number(item.approved_budget) || 0), 0);
        
        setFinancialSummary(prev => ({
          ...prev,
          totalTabarimCount: totalCount,
          totalTabarimAmount: totalAmount
        }));
      }

      // Load regular budget data
      const { data: budgetData, error: budgetError } = await supabase
        .from('regular_budget')  
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!budgetError && budgetData) {
        setRegularBudgetData(budgetData);
        
        const incomeItems = budgetData.filter(item => item.category_type === 'income');
        const expenseItems = budgetData.filter(item => item.category_type === 'expense');
        
        const totalIncome = incomeItems.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
        const totalExpense = expenseItems.reduce((sum, item) => sum + (Number(item.actual_amount) || 0), 0);
        const totalBudget = incomeItems.reduce((sum, item) => sum + (Number(item.budget_amount) || 0), 0);
        
        setFinancialSummary(prev => ({
          ...prev,
          annualBudget: totalBudget,
          incomeActual: totalIncome,
          expenseActual: totalExpense,
          surplus: totalIncome - totalExpense
        }));
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  }

  // Demo data for budget differences and trends
  const budgetDifferencesData = [
    { name: "תקציב רגיל", budgeted: 1200, actual: 980, difference: -220 },
    { name: "תב״רים", budgeted: 890, actual: 745, difference: -145 },
    { name: "הכנסות אחרות", budgeted: 340, actual: 425, difference: 85 },
  ];

  const trendData = [
    { month: "ינו", budget: 200, actual: 185 },
    { month: "פבר", budget: 200, actual: 195 },
    { month: "מרץ", budget: 200, actual: 205 },
    { month: "אפר", budget: 200, actual: 190 },
    { month: "מאי", budget: 200, actual: 215 },
    { month: "יונ", budget: 200, actual: 225 },
  ];

  useEffect(() => { 
    loadProjects();
    loadFinancialData();
  }, [session, user?.id]);


  const projectColumns: ColumnDef<ProjectRow>[] = [
    { accessorKey: "name", header: "מספר/שם תב\"ר" },
    { accessorKey: "title", header: "כותרת" },
    { accessorKey: "budget", header: "תקציב" },
    { accessorKey: "spent", header: "בוצע" },
    {
      accessorKey: "progress",
      header: "התקדמות",
      cell: ({ row }) => {
        const v = row.original.progress;
        return (
          <div className="flex items-center gap-2 w-[160px]">
            <Progress value={v} className="flex-1" />
            <span className="text-xs">{v}%</span>
          </div>
        );
      },
    },
    { accessorKey: "status", header: "סטטוס" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">מחלקת פיננסים</h1>
          <p className="text-muted-foreground text-lg">ניהול תקציב ומעקב פיננסי עירוני</p>
        </div>
        <div className="flex items-center gap-2">
          <AddBudgetDialog />
          <AddProjectDialog onSaved={loadProjects} />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="h-4 w-4 ml-2" /> ייבוא נתונים
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ייבוא נתונים למחלקת פיננסים</DialogTitle>
              </DialogHeader>
              <DataUploader context="finance" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Navigation to Sub-pages */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 hover:scale-105 border-2 border-transparent hover:border-orange-500/30 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-900/30 backdrop-blur-sm group"
          onClick={() => navigate('/finance/regular-budget')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-all duration-300 group-hover:scale-110">
              <Calculator className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300 group-hover:text-orange-800 dark:group-hover:text-orange-200">תקציב רגיל</h3>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-105 border-2 border-transparent hover:border-purple-500/30 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-900/30 backdrop-blur-sm group"
          onClick={() => navigate('/finance/tabarim')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-110">
              <FileText className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-lg font-bold text-purple-700 dark:text-purple-300 group-hover:text-purple-800 dark:group-hover:text-purple-200">תב״רים</h3>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:scale-105 border-2 border-transparent hover:border-green-500/30 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/30 backdrop-blur-sm group"
          onClick={() => navigate('/finance/collection')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/30 group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-110">
              <Receipt className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-lg font-bold text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200">גבייה</h3>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:scale-105 border-2 border-transparent hover:border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 backdrop-blur-sm group"
          onClick={() => navigate('/finance/salary')}
        >
          <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
              <Users className="h-8 w-8 text-white drop-shadow-sm" />
            </div>
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-200">שכר</h3>
          </CardContent>
        </Card>
      </div>

      <ExecutiveTasksBanner department="finance" />

      {/* Updated KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">תקציב שנתי</p>
                <p className="text-3xl font-bold text-foreground">{formatNumber(financialSummary.annualBudget)}</p>
                <p className="text-xs text-muted-foreground">מתא B50</p>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">ביצוע הכנסות/הוצאות</p>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-success">{formatNumber(financialSummary.incomeActual)}</p>
                  <p className="text-lg font-bold text-destructive">{formatNumber(financialSummary.expenseActual)}</p>
                </div>
                <p className="text-xs text-muted-foreground">F25/F50</p>
              </div>
              <div className="h-12 w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">עודף/גרעון</p>
                <p className={`text-3xl font-bold ${financialSummary.surplus >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatNumber(Math.abs(financialSummary.surplus))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {financialSummary.surplus >= 0 ? 'עודף' : 'גרעון'} - F52
                </p>
              </div>
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                financialSummary.surplus >= 0 ? 'bg-success' : 'bg-destructive'
              }`}>
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">סה״כ תב״רים</p>
                <p className="text-3xl font-bold text-foreground">{financialSummary.totalTabarimCount}</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{formatNumber(financialSummary.totalTabarimAmount)}</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Differences Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">הפרש תקציב מול ביצוע</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetDifferencesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `₪${value}M`, 
                    name === 'budgeted' ? 'מתוכנן' : name === 'actual' ? 'בפועל' : 'הפרש'
                  ]}
                />
                <Bar dataKey="budgeted" fill="hsl(var(--muted))" name="מתוכנן" />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="בפועל" />
                <Bar dataKey="difference" fill="hsl(var(--accent))" name="הפרש" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabarim Differences Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">גרף הפרש תב״רים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`₪${value}M`, name === 'budget' ? 'תקציב' : 'ביצוע']} />
                <Area type="monotone" dataKey="budget" stackId="1" stroke="hsl(var(--muted))" fill="hsl(var(--muted))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="actual" stackId="2" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.8} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Time Trends Chart */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">מגמות זמן - תקציב מול ביצוע</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`₪${value}M`, name === 'budget' ? 'תקציב' : 'ביצוע']} />
              <Line type="monotone" dataKey="budget" stroke="hsl(var(--muted))" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Execution Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">ביצוע תקציב לפי מחלקות</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `₪${value}M`, 
                    name === 'approved' ? 'מאושר' : 'בוצע'
                  ]}
                />
                <Bar dataKey="approved" fill="hsl(var(--muted))" name="מאושר" />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="בוצע" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Distribution Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התפלגות תקציב</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="actual"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₪${value}M`, 'תקציב']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* גביה והכנסות */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">גביה לאורך זמן</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={collectionsTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v)=>[`₪${v}M`, 'גובה']} />
                <Line type="monotone" dataKey="collected" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle className="text-xl">מקורות הכנסה</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={incomeSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                  {incomeSources.map((e,i)=> <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v, n)=>[`₪${v}M`, n]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">תב״רים ופרויקטים מיוחדים</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButtons data={projectsRows} fileBaseName="finance-projects" />
          </div>
          <DataTable
            columns={projectColumns}
            data={projectsRows}
            searchPlaceholder="חיפוש פרויקטים..."
          />
        </CardContent>
      </Card>

      {/* Grants and Funding */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">קולות קוראים ומענקים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {grantsData.map((grant, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{grant.ministry}</h3>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {grant.status === 'approved' && <CheckCircle className="h-4 w-4 text-success" />}
                    {grant.status === 'pending' && <Clock className="h-4 w-4 text-warning" />}
                    {grant.status === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <p className="text-lg font-bold">₪{grant.amount}</p>
                <Badge className={getStatusColor(grant.status)}>
                  {getStatusText(grant.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
