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
import { Plus, TrendingUp, TrendingDown, DollarSign, Upload, Brain, Loader2, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColumnDef } from "@tanstack/react-table";
import { DataUploader } from '@/components/shared/DataUploader';
import { ExportButtons } from '@/components/shared/ExportButtons';
import SmartBudgetTable from './SmartBudgetTable';

interface RegularBudgetItem {
  id: string;
  category_type: 'income' | 'expense';
  category_name: string;
  budget_amount: number;
  actual_amount: number; // תקציב יחסי לתקופה
  cumulative_execution: number; // ביצוע מצטבר
  year: number;
  budget_deviation: number; // סטיה מהתקציב
  budget_deviation_percentage: number; // סטיה מהתקציב ב%
}

export default function RegularBudgetPage() {
  const { user, session } = useAuth();
  const [budgetData, setBudgetData] = useState<RegularBudgetItem[]>([]);
  const [filteredData, setFilteredData] = useState<RegularBudgetItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
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

      const transformedData: RegularBudgetItem[] = (data || []).map(item => {
        const budgetDeviation = (item.cumulative_execution || 0) - (item.actual_amount || 0);
        const budgetDeviationPercentage = (item.actual_amount || 0) !== 0 ? 
          (budgetDeviation / (item.actual_amount || 0)) * 100 : 0;

        return {
          id: item.id,
          category_type: item.category_type,
          category_name: item.category_name,
          budget_amount: item.budget_amount || 0,
          actual_amount: item.actual_amount || 0, // תקציב יחסי לתקופה
          cumulative_execution: item.cumulative_execution || 0, // ביצוע מצטבר
          year: item.year,
          budget_deviation: budgetDeviation, // סטיה מהתקציב
          budget_deviation_percentage: budgetDeviationPercentage // סטיה מהתקציב ב%
        };
      });

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

  // Load saved analysis when budget data is loaded
  useEffect(() => {
    if (budgetData.length > 0 && user && !analysis) {
      loadSavedAnalysis();
    }
  }, [budgetData, user]);

  const loadSavedAnalysis = async () => {
    if (!user) return;
    
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase
        .from('budget_analysis')
        .select('analysis_text, created_at')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setAnalysis(data.analysis_text);
        console.log('Loaded saved analysis from:', data.created_at);
      } else if (budgetData.length > 0) {
        // If no saved analysis, generate new one automatically
        console.log('No saved analysis found, generating new one...');
        handleAnalyzeBudget(true); // silent generation
      }
    } catch (error) {
      console.error('Error loading saved analysis:', error);
      // Try to generate new analysis
      if (budgetData.length > 0) {
        handleAnalyzeBudget(true);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

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

  const handleAnalyzeBudget = async (silent = false) => {
    if (!budgetData || budgetData.length === 0) {
      if (!silent) toast.error("אין נתוני תקציב לניתוח");
      return;
    }

    setIsAnalyzing(true);
    try {
      const incomeDeviation = totalIncomeExecution - totalIncome;
      const expenseDeviation = totalExpenseExecution - totalExpenses;
      
      console.log('Calling analyze-budget function with data:', {
        budgetDataLength: budgetData.filter(item => isDetailRow(item)).length,
        totalIncome,
        totalExpenses,
        incomeDeviation,
        expenseDeviation
      });
      
      const { data, error } = await supabase.functions.invoke('analyze-budget', {
        body: {
          budgetData: budgetData.filter(item => isDetailRow(item)),
          totalIncome: totalIncome,
          totalExpenses: totalExpenses,
          incomeDeviation: incomeDeviation,
          expenseDeviation: expenseDeviation
        }
      });

      if (error) {
        console.error("Error analyzing budget:", error);
        if (!silent) toast.error(`שגיאה בניתוח התקציב: ${error.message || 'שגיאה לא ידועה'}`);
        return;
      }

      if (data?.error) {
        console.error("OpenAI API error:", data.error);
        if (!silent) toast.error(`שגיאה ב-OpenAI: ${data.error}`);
        return;
      }

      console.log('Full response from Edge Function:', { data, error });
      console.log('Analysis content:', data?.analysis);
      
      if (data?.analysis && data.analysis.trim()) {
        setAnalysis(data.analysis);
        if (!silent) toast.success("ניתוח התקציב הושלם בהצלחה");
      } else {
        console.error("No valid analysis in response:", data);
        if (!silent) toast.error("לא התקבל ניתוח תקין מהשרת");
      }
    } catch (error) {
      console.error("Error:", error);
      if (!silent) toast.error(`שגיאה בניתוח התקציב: ${error.message || 'שגיאה לא ידועה'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper functions to identify different types of rows
  const isMainSummaryRow = (categoryName: string) => {
    return categoryName === 'סה"כ הכנסות' || categoryName === 'סה"כ הוצאות';
  };

  const isSubSummaryRow = (categoryName: string) => {
    return categoryName.includes('סה"כ') && !isMainSummaryRow(categoryName);
  };

  const isHeaderRow = (categoryName: string) => {
    return categoryName.includes('לתקופה:') || categoryName === 'הכנסות' || categoryName === 'הוצאות';
  };

  const isDetailRow = (item: RegularBudgetItem) => {
    return !isMainSummaryRow(item.category_name) && 
           !isSubSummaryRow(item.category_name) && 
           !isHeaderRow(item.category_name);
  };

  // Prepare chart data
  const incomeChartData = budgetData
    .filter(item => item.category_type === 'income' && isDetailRow(item))
    .map(item => ({
      name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
      budget: item.budget_amount,
      actual: item.actual_amount
    }));

  const expenseChartData = budgetData
    .filter(item => item.category_type === 'expense' && isDetailRow(item))
    .map(item => ({
      name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
      budget: item.budget_amount,
      actual: item.actual_amount
    }));

  const columns: ColumnDef<RegularBudgetItem>[] = [
    {
      accessorKey: "category_name",
      header: "שם הקטגוריה",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        
        let className = "";
        if (isMainSummaryRow(categoryName)) {
          className = "font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className = "font-semibold text-lg text-blue-700 dark:text-blue-300";
        } else if (isHeaderRow(categoryName)) {
          className = "font-medium text-gray-600 dark:text-gray-400 italic";
        }
        
        return (
          <span className={className}>
            {categoryName}
          </span>
        );
      },
    },
    {
      accessorKey: "budget_amount",
      header: "תקציב מאושר",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        const amount = row.getValue("budget_amount") as number;
        
        let className = "";
        if (isMainSummaryRow(categoryName)) {
          className = "font-bold text-xl border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className = "font-semibold text-lg";
        }
        
        return (
          <span className={className}>
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "actual_amount",
      header: "תקציב יחסי לתקופה",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        const amount = row.getValue("actual_amount") as number;
        
        let className = "";
        if (isMainSummaryRow(categoryName)) {
          className = "font-bold text-xl border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className = "font-semibold text-lg";
        }
        
        return (
          <span className={className}>
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "cumulative_execution",
      header: "ביצוע מצטבר",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        const amount = row.getValue("cumulative_execution") as number;
        
        let className = "";
        if (isMainSummaryRow(categoryName)) {
          className = "font-bold text-xl border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className = "font-semibold text-lg";
        }
        
        return (
          <span className={className}>
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      accessorKey: "budget_deviation",
      header: "סטיה מהתקציב",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        const deviation = row.getValue("budget_deviation") as number;
        
        let className = `${deviation >= 0 ? "text-green-600" : "text-red-600"}`;
        if (isMainSummaryRow(categoryName)) {
          className += " font-bold text-xl border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className += " font-semibold text-lg";
        }
        
        return (
          <span className={className}>
            {formatCurrency(deviation)}
          </span>
        );
      },
    },
    {
      accessorKey: "budget_deviation_percentage",
      header: "סטיה מהתקציב ב%",
      cell: ({ row }) => {
        const categoryName = row.getValue("category_name") as string;
        const percentage = row.getValue("budget_deviation_percentage") as number;
        
        let className = `${percentage >= 0 ? "text-green-600" : "text-red-600"}`;
        if (isMainSummaryRow(categoryName)) {
          className += " font-bold text-xl border-t-2 border-blue-300 pt-2";
        } else if (isSubSummaryRow(categoryName)) {
          className += " font-semibold text-lg";
        }
        
        return (
          <span className={className}>
            {percentage.toFixed(1)}%
          </span>
        );
      },
    },
  ];

  // Smart mapping of summary rows based on actual Excel structure
  const mainIncomeSummaryRow = budgetData.find(item => 
    item.category_type === 'income' && 
    item.category_name === 'סה"כ הכנסות'
  );
  
  const mainExpenseSummaryRow = budgetData.find(item => 
    item.category_type === 'expense' && 
    item.category_name === 'סה"כ הוצאות'
  );

  // Use the main summary rows for totals, fallback to calculations if not found
  const totalIncome = mainIncomeSummaryRow?.actual_amount || 
    budgetData.filter(item => item.category_type === 'income' && isDetailRow(item))
      .reduce((sum, item) => sum + item.actual_amount, 0);
      
  const totalExpenses = mainExpenseSummaryRow?.actual_amount || 
    budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item))
      .reduce((sum, item) => sum + item.actual_amount, 0);
      
  const totalBudgetIncome = mainIncomeSummaryRow?.budget_amount || 
    budgetData.filter(item => item.category_type === 'income' && isDetailRow(item))
      .reduce((sum, item) => sum + item.budget_amount, 0);
      
  const totalBudgetExpenses = mainExpenseSummaryRow?.budget_amount || 
    budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item))
      .reduce((sum, item) => sum + item.budget_amount, 0);
      
  const totalIncomeExecution = mainIncomeSummaryRow?.cumulative_execution || 
    budgetData.filter(item => item.category_type === 'income' && isDetailRow(item))
      .reduce((sum, item) => sum + (item.cumulative_execution || 0), 0);
      
  const totalExpenseExecution = mainExpenseSummaryRow?.cumulative_execution || 
    budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item))
      .reduce((sum, item) => sum + (item.cumulative_execution || 0), 0);

  // Debug log for totals with more detail
  console.log("💰 Total calculations:", {
    mainIncomeSummaryRow,
    mainExpenseSummaryRow,
    totalIncome,
    totalExpenses,
    totalBudgetIncome,
    totalBudgetExpenses,
    totalIncomeExecution,
    totalExpenseExecution,
    incomeDetailRowsCount: budgetData.filter(item => item.category_type === 'income' && isDetailRow(item)).length,
    expenseDetailRowsCount: budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item)).length
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
                {formatCurrency(totalIncome)}
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
                {formatCurrency(totalExpenses)}
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
                  {formatCurrency(totalIncomeExecution)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-rose-100/50 dark:bg-rose-900/20 rounded-lg">
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">הוצאות</span>
                <span className="text-lg font-bold text-rose-800 dark:text-rose-200">
                  {formatCurrency(totalExpenseExecution)}
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
                ((totalIncomeExecution || 0) - (totalIncome || 0)) >= 0 
                  ? 'bg-emerald-100/50 dark:bg-emerald-900/20' 
                  : 'bg-rose-100/50 dark:bg-rose-900/20'
              }`}>
                <span className="text-sm font-medium">הכנסות</span>
                <div className="text-left">
                  <div className={`text-lg font-bold ${
                    ((totalIncomeExecution || 0) - (totalIncome || 0)) >= 0 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {formatCurrency((totalIncomeExecution || 0) - (totalIncome || 0))}
                  </div>
                  <div className={`text-sm ${
                    ((totalIncomeExecution || 0) - (totalIncome || 0)) >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {totalIncome !== 0 ? (((totalIncomeExecution || 0) - (totalIncome || 0)) / (totalIncome || 1) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>
              <div className={`flex justify-between items-center p-2 rounded-lg ${
                ((totalExpenseExecution || 0) - (totalExpenses || 0)) >= 0 
                  ? 'bg-emerald-100/50 dark:bg-emerald-900/20' 
                  : 'bg-rose-100/50 dark:bg-rose-900/20'
              }`}>
                <span className="text-sm font-medium">הוצאות</span>
                <div className="text-left">
                  <div className={`text-lg font-bold ${
                    ((totalExpenseExecution || 0) - (totalExpenses || 0)) >= 0 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {formatCurrency((totalExpenseExecution || 0) - (totalExpenses || 0))}
                  </div>
                  <div className={`text-sm ${
                    ((totalExpenseExecution || 0) - (totalExpenses || 0)) >= 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {totalExpenses !== 0 ? (((totalExpenseExecution || 0) - (totalExpenses || 0)) / (totalExpenses || 1) * 100).toFixed(1) : '0.0'}%
                  </div>
                </div>
              </div>
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

      {/* Data Tables - Separated by Income and Expenses */}
      <div className="space-y-6">
        {/* Income Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-emerald-700 dark:text-emerald-300">טבלת הכנסות</CardTitle>
              <ExportButtons 
                data={budgetData.filter(item => item.category_type === 'income')} 
                fileBaseName="income-budget"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Income Table Data - Include all income rows, including summary rows */}
              <DataTable 
                columns={columns} 
                data={budgetData.filter(item => item.category_type === 'income')} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold text-rose-700 dark:text-rose-300">טבלת הוצאות</CardTitle>
              <ExportButtons 
                data={budgetData.filter(item => item.category_type === 'expense')} 
                fileBaseName="expenses-budget"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Expenses Table Data - Include all expense rows, including summary rows */}
              <DataTable 
                columns={columns} 
                data={budgetData.filter(item => item.category_type === 'expense')} 
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Budget Analysis Section - Enhanced */}
      <Card className="border-2 border-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800/30 dark:to-blue-800/30 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ניתוח חכם של התקציב
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  הצגה וניתוח נתונים מתקדם באמצעות בינה מלאכותית
                </p>
              </div>
            </div>
            <Button 
              onClick={() => handleAnalyzeBudget(false)}
              disabled={isAnalyzing || analysisLoading || !budgetData || budgetData.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105"
              size="lg"
            >
              {isAnalyzing || analysisLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  מנתח נתונים...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  נתח תקציב
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {(analysisLoading && !analysis) ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-600" />
              <p className="text-lg font-medium mb-2">טוען ניתוח קודם...</p>
              <p className="text-sm text-muted-foreground">בודק אם יש ניתוח שמור מהיום</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-xl border-l-4 border-gradient-to-b from-green-500 to-blue-500">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">ניתוח זמין</span>
                </div>
                <div className="prose prose-lg max-w-none text-right">
                  <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                    {analysis}
                  </div>
                </div>
              </div>
              
              {/* Enhanced insights section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">יעילות הכנסות</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {((totalIncomeExecution / totalIncome) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">מביצוע ההכנסות</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">מאזן נוכחי</span>
                  </div>
                  <div className={`text-2xl font-bold ${totalIncomeExecution - totalExpenseExecution >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(totalIncomeExecution - totalExpenseExecution)}
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">עודף/גירעון</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800 dark:text-orange-200">שליטה בהוצאות</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                    {((totalExpenseExecution / totalExpenses) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">מביצוע ההוצאות</div>
                </div>
              </div>

              {/* Smart Data Table */}
              {budgetData.length > 0 && (
                <Card className="mt-6 border-2 border-blue-200 dark:border-blue-800">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardTitle className="text-xl font-bold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      טבלת נתונים חכמה - ניתוח מפורט
                    </CardTitle>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      הצגת הנתונים בצורה מסודרת ומובנת עם הבנת מבנה קובץ האקסל
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    <SmartBudgetTable budgetData={budgetData} />
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-16">
              <div className="mb-6">
                <Brain className="w-20 h-20 mx-auto mb-6 opacity-30" />
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold">ניתוח חכם מתקדם</h3>
                  <p className="text-lg">לחץ על "נתח תקציב" כדי לקבל:</p>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    <Badge variant="secondary" className="px-3 py-1">📊 הצגת נתונים מובנת</Badge>
                    <Badge variant="secondary" className="px-3 py-1">📈 ניתוח מגמות</Badge>
                    <Badge variant="secondary" className="px-3 py-1">⚠️ אזורי תשומת לב</Badge>
                    <Badge variant="secondary" className="px-3 py-1">💡 המלצות מעשיות</Badge>
                    <Badge variant="secondary" className="px-3 py-1">🎯 סיכום מנהלים</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
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