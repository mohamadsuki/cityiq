import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, TrendingUp, TrendingDown, DollarSign, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from "@tanstack/react-table";
import { DataUploader } from '@/components/shared/DataUploader';
import { ExportButtons } from '@/components/shared/ExportButtons';

interface RegularBudgetItem {
  id: string;
  category_type: 'income' | 'expense';
  category_name: string;
  budget_amount: number;
  actual_amount: number; // תקציב יחסי לתקופה
  cumulative_execution: number; // ביצוע מצטבר
  year: number;
  difference: number;
  percentage: number;
}

export default function RegularBudgetPage() {
  const { user, session } = useAuth();
  const [budgetData, setBudgetData] = useState<RegularBudgetItem[]>([]);
  const [filteredData, setFilteredData] = useState<RegularBudgetItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    category_type: 'income' as 'income' | 'expense',
    category_name: '',
    budget_amount: '',
    actual_amount: ''
  });

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const loadBudgetData = async () => {
    setLoading(true);
    console.log("=== LOADING REGULAR BUDGET DATA ===");
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('regular_budget')
        .select('*')
        .order('category_type', { ascending: true })
        .order('category_name', { ascending: true });

      if (error) throw error;

      console.log("📊 Raw regular budget data from DB:", data);

      const transformedData: RegularBudgetItem[] = (data || []).map(item => ({
        id: item.id,
        category_type: item.category_type,
        category_name: item.category_name,
        budget_amount: item.budget_amount || 0,
        actual_amount: item.actual_amount || 0, // תקציב יחסי לתקופה
        cumulative_execution: item.cumulative_execution || 0, // ביצוע מצטבר
        year: item.year,
        difference: (item.cumulative_execution || 0) - (item.budget_amount || 0),
        percentage: item.budget_amount ? ((item.cumulative_execution || 0) / item.budget_amount) * 100 : 0
      }));

      console.log("🔧 Transformed regular budget data:", transformedData);

      setBudgetData(transformedData);
      setFilteredData(transformedData);
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('שגיאה בטעינת נתוני התקציב');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [user]);

  useEffect(() => {
    if (categoryFilter === "all") {
      setFilteredData(budgetData);
    } else {
      setFilteredData(budgetData.filter(item => item.category_type === categoryFilter));
    }
  }, [categoryFilter, budgetData]);

  const handleAddItem = async () => {
    if (!user) {
      toast.error('יש להתחבר כדי להוסיף פריט');
      return;
    }
    
    if (!newItem.category_name || !newItem.budget_amount) {
      toast.error('יש למלא את כל השדות הנדרשים');
      return;
    }

    try {
      const itemData = {
        user_id: user.id,
        category_type: newItem.category_type,
        category_name: newItem.category_name,
        budget_amount: Number(newItem.budget_amount),
        actual_amount: Number(newItem.actual_amount) || 0,
        year: new Date().getFullYear()
      };

      const { error } = await supabase
        .from('regular_budget')
        .insert([itemData]);

      if (error) throw error;
      
      toast.success('פריט נוסף לתקציב בהצלחה');
      loadBudgetData();
      setAddDialogOpen(false);
      setNewItem({
        category_type: 'income',
        category_name: '',
        budget_amount: '',
        actual_amount: ''
      });
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('שגיאה בהוספת פריט לתקציב');
    }
  };

  // Prepare chart data
  const incomeChartData = budgetData
    .filter(item => item.category_type === 'income')
    .map(item => ({
      name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
      budget: item.budget_amount,
      actual: item.actual_amount
    }));

  const expenseChartData = budgetData
    .filter(item => item.category_type === 'expense')
    .map(item => ({
      name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
      budget: item.budget_amount,
      actual: item.actual_amount
    }));

  const columns: ColumnDef<RegularBudgetItem>[] = [
    {
      accessorKey: "category_type",
      header: "סוג",
      cell: ({ row }) => (
        <Badge variant={row.getValue("category_type") === "income" ? "default" : "destructive"}>
          {row.getValue("category_type") === "income" ? "הכנסה" : "הוצאה"}
        </Badge>
      ),
    },
    {
      accessorKey: "category_name",
      header: "שם הקטגוריה",
    },
    {
      accessorKey: "budget_amount",
      header: "תקציב מתוכנן",
      cell: ({ row }) => formatCurrency(row.getValue("budget_amount")),
    },
    {
      accessorKey: "actual_amount",
      header: "סכום בפועל",
      cell: ({ row }) => formatCurrency(row.getValue("actual_amount")),
    },
    {
      accessorKey: "difference",
      header: "הפרש",
      cell: ({ row }) => {
        const diff = row.getValue("difference") as number;
        return (
          <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(diff)}
          </span>
        );
      },
    },
    {
      accessorKey: "percentage",
      header: "אחוז ביצוע",
      cell: ({ row }) => {
        const percentage = row.getValue("percentage") as number;
        return (
          <span className={percentage >= 100 ? "text-green-600" : "text-red-600"}>
            {percentage.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  // Calculate totals - Use the summary rows from Excel if they exist, otherwise calculate
  const incomeSummaryRow = budgetData.find(item => 
    item.category_type === 'income' && 
    (item.category_name.includes('סה"כ הכנסות') || item.category_name.includes('סך הכנסות'))
  );
  
  const expenseSummaryRow = budgetData.find(item => 
    item.category_type === 'expense' && 
    (item.category_name.includes('סה"כ הוצאות') || item.category_name.includes('סך הוצאות'))
  );

  // Use summary rows if available, otherwise calculate from individual items
  const totalIncome = incomeSummaryRow 
    ? incomeSummaryRow.actual_amount 
    : budgetData
        .filter(item => item.category_type === 'income' && !item.category_name.includes('סה"כ') && !item.category_name.includes('סך'))
        .reduce((sum, item) => sum + item.actual_amount, 0);

  const totalExpenses = expenseSummaryRow 
    ? expenseSummaryRow.actual_amount 
    : budgetData
        .filter(item => item.category_type === 'expense' && !item.category_name.includes('סה"כ') && !item.category_name.includes('סך'))
        .reduce((sum, item) => sum + item.actual_amount, 0);

  const totalBudgetIncome = incomeSummaryRow 
    ? incomeSummaryRow.budget_amount 
    : budgetData
        .filter(item => item.category_type === 'income' && !item.category_name.includes('סה"כ') && !item.category_name.includes('סך'))
        .reduce((sum, item) => sum + item.budget_amount, 0);

  const totalBudgetExpenses = expenseSummaryRow 
    ? expenseSummaryRow.budget_amount 
    : budgetData
        .filter(item => item.category_type === 'expense' && !item.category_name.includes('סה"כ') && !item.category_name.includes('סך'))
        .reduce((sum, item) => sum + item.budget_amount, 0);

  // Debug log for totals
  console.log("💰 Total calculations:", {
    incomeSummaryRow,
    expenseSummaryRow,
    totalIncome,
    totalExpenses,
    totalBudgetIncome,
    totalBudgetExpenses
  });

  if (loading) {
    return <div className="p-6">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-right">תקציב רגיל</h1>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            העלאת קובץ
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            הוספת פריט
          </Button>
        </div>
      </div>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/30 dark:via-green-950/20 dark:to-teal-950/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-200">הכנסות מאושר</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(totalBudgetIncome)}
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mb-1">תקציב יחסי לתקופה</div>
              <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {incomeSummaryRow ? formatCurrency(incomeSummaryRow.actual_amount) : '₪0'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-rose-50 via-red-50 to-pink-50 dark:from-rose-950/30 dark:via-red-950/20 dark:to-pink-950/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-200">הוצאות מאושר</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingDown className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">
              {formatCurrency(totalBudgetExpenses)}
            </div>
            <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-rose-600 dark:text-rose-400 font-medium mb-1">תקציב יחסי לתקופה</div>
              <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
                {expenseSummaryRow ? formatCurrency(expenseSummaryRow.actual_amount) : '₪0'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">סה״כ הכנסות והוצאות בפועל</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-lg">
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">הכנסות</span>
                <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                  {incomeSummaryRow ? formatCurrency(incomeSummaryRow.cumulative_execution || 0) : '₪0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-rose-100/50 dark:bg-rose-900/20 rounded-lg">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">הוצאות</span>
                <span className="text-lg font-bold text-rose-800 dark:text-rose-200">
                  {expenseSummaryRow ? formatCurrency(expenseSummaryRow.cumulative_execution || 0) : '₪0'}
                </span>
              </div>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 text-center font-medium bg-blue-100/50 dark:bg-blue-900/20 p-2 rounded-lg">
              ביצוע מצטבר
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-200">סטיה מהתקציב</CardTitle>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                incomeSummaryRow && ((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0)) >= 0 
                  ? 'bg-emerald-100/50 dark:bg-emerald-900/20' 
                  : 'bg-rose-100/50 dark:bg-rose-900/20'
              }`}>
                <span className="text-sm font-medium">הכנסות</span>
                <div className="text-left">
                  <div className={`text-lg font-bold ${
                    incomeSummaryRow && ((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0)) >= 0 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {incomeSummaryRow ? formatCurrency(Math.abs((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0))) : '₪0'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ({incomeSummaryRow && (incomeSummaryRow.actual_amount || 0) > 0 ? ((((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0)) / (incomeSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                expenseSummaryRow && ((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0)) <= 0 
                  ? 'bg-emerald-100/50 dark:bg-emerald-900/20' 
                  : 'bg-rose-100/50 dark:bg-rose-900/20'
              }`}>
                <span className="text-sm font-medium">הוצאות</span>
                <div className="text-left">
                  <div className={`text-lg font-bold ${
                    expenseSummaryRow && ((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0)) <= 0 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {expenseSummaryRow ? formatCurrency(Math.abs((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0))) : '₪0'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ({expenseSummaryRow && (expenseSummaryRow.actual_amount || 0) > 0 ? ((((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0)) / (expenseSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}%)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/30 dark:via-blue-950/20 dark:to-indigo-950/30 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-sky-800 dark:text-sky-200">ביצוע מצטבר הכנסות</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm border border-sky-200/50 dark:border-sky-700/50">
              <div className="text-4xl font-bold text-sky-700 dark:text-sky-300 mb-2">
                {incomeSummaryRow && (incomeSummaryRow.actual_amount || 0) > 0 ? 
                  (((incomeSummaryRow.cumulative_execution || 0) / (incomeSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm font-medium text-sky-600 dark:text-sky-400">ביצוע בפועל מתוך תקציב יחסי</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-100/60 to-green-100/60 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">הפרש הכנסות-הוצאות</span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-950/30 dark:via-red-950/20 dark:to-pink-950/30 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-orange-800 dark:text-orange-200">ביצוע מצטבר הוצאות</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm border border-orange-200/50 dark:border-orange-700/50">
              <div className="text-4xl font-bold text-orange-700 dark:text-orange-300 mb-2">
                {expenseSummaryRow && (expenseSummaryRow.actual_amount || 0) > 0 ? 
                  (((expenseSummaryRow.cumulative_execution || 0) / (expenseSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-sm font-medium text-orange-600 dark:text-orange-400">ביצוע בפועל מתוך תקציב יחסי</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-100/60 to-green-100/60 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">הפרש הכנסות-הוצאות</span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-fuchsia-950/30 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in group">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-violet-800 dark:text-violet-200">עודף/גירעון</CardTitle>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-white/70 dark:bg-gray-800/70 rounded-xl backdrop-blur-sm border border-violet-200/50 dark:border-violet-700/50">
              <div className={`text-4xl font-bold mb-2 ${
                ((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)) >= 0 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-rose-700 dark:text-rose-300'
              }`}>
                {formatCurrency(Math.abs((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)))}
              </div>
              <div className="text-sm font-medium text-violet-600 dark:text-violet-400">
                {((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)) >= 0 ? 'עודף' : 'גירעון'} בביצוע
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-100/60 to-purple-100/60 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg">
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">אחוז הפרש</span>
              <span className={`text-2xl font-bold ${
                ((incomeSummaryRow?.cumulative_execution || 0) - (expenseSummaryRow?.cumulative_execution || 0)) >= 0 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : 'text-rose-700 dark:text-rose-300'
              }`}>
                {incomeSummaryRow && expenseSummaryRow && (incomeSummaryRow.actual_amount || 0) > 0 && (expenseSummaryRow.actual_amount || 0) > 0 ? 
                  ((((incomeSummaryRow.cumulative_execution || 0) / (incomeSummaryRow.actual_amount || 1)) - 
                    ((expenseSummaryRow.cumulative_execution || 0) / (expenseSummaryRow.actual_amount || 1))) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="income" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">הכנסות</TabsTrigger>
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
          <TabsTrigger value="comparison">השוואה כללית</TabsTrigger>
        </TabsList>

        <TabsContent value="income" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הכנסות - תקציב מול ביצוע</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={incomeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `₪${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ textAlign: 'right' }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="תקציב מתוכנן" />
                  <Bar dataKey="actual" fill="#82ca9d" name="ביצוע בפועל" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הוצאות - תקציב מול ביצוע</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={expenseChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `₪${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ textAlign: 'right' }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#8884d8" name="תקציב מתוכנן" />
                  <Bar dataKey="actual" fill="#ff7300" name="ביצוע בפועל" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>מגמת ביצוע תקציב</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={[
                  { month: 'ינואר', income: totalIncome * 0.8, expenses: totalExpenses * 0.75 },
                  { month: 'פברואר', income: totalIncome * 0.85, expenses: totalExpenses * 0.8 },
                  { month: 'מרץ', income: totalIncome * 0.9, expenses: totalExpenses * 0.85 },
                  { month: 'אפריל', income: totalIncome * 0.95, expenses: totalExpenses * 0.9 },
                  { month: 'מאי', income: totalIncome, expenses: totalExpenses }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₪${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelStyle={{ textAlign: 'right' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#82ca9d" name="הכנסות" strokeWidth={2} />
                  <Line type="monotone" dataKey="expenses" stroke="#ff7300" name="הוצאות" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>פירוט תקציב</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="סנן לפי סוג" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="income">הכנסות</SelectItem>
                  <SelectItem value="expense">הוצאות</SelectItem>
                </SelectContent>
              </Select>
              <ExportButtons 
                data={filteredData} 
                fileBaseName="regular-budget"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredData} />
        </CardContent>
      </Card>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>הוספת פריט תקציב חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category_type">סוג</Label>
              <Select value={newItem.category_type} onValueChange={(value: 'income' | 'expense') => setNewItem({...newItem, category_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">הכנסה</SelectItem>
                  <SelectItem value="expense">הוצאה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category_name">שם הקטגוריה</Label>
              <Input
                id="category_name"
                value={newItem.category_name}
                onChange={(e) => setNewItem({...newItem, category_name: e.target.value})}
                placeholder="הכנס שם קטגוריה"
              />
            </div>
            <div>
              <Label htmlFor="budget_amount">תקציב מתוכנן</Label>
              <Input
                id="budget_amount"
                type="number"
                value={newItem.budget_amount}
                onChange={(e) => setNewItem({...newItem, budget_amount: e.target.value})}
                placeholder="הכנס סכום תקציב"
              />
            </div>
            <div>
              <Label htmlFor="actual_amount">סכום בפועל</Label>
              <Input
                id="actual_amount"
                type="number"
                value={newItem.actual_amount}
                onChange={(e) => setNewItem({...newItem, actual_amount: e.target.value})}
                placeholder="הכנס סכום בפועל"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                ביטול
              </Button>
              <Button onClick={handleAddItem}>
                הוסף
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>העלאת נתונים מקובץ Excel</DialogTitle>
          </DialogHeader>
          <DataUploader 
            context="regular_budget" 
            onUploadSuccess={() => {
              setImportDialogOpen(false);
              loadBudgetData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}