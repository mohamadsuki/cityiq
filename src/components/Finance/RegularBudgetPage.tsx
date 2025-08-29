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
  excel_cell_ref?: string; // אופציונלי - הפניה לתא באקסל
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

  // Load existing analysis from database
  const loadExistingAnalysis = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading analysis');
      return false;
    }

    try {
      console.log('Checking for existing analysis...');
      const { data: existingAnalysis, error } = await supabase
        .from('budget_analysis')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading existing analysis:', error);
        return false;
      }

      if (existingAnalysis) {
        console.log('Found existing analysis:', existingAnalysis.id, 'Created at:', existingAnalysis.created_at);
        setAnalysis(existingAnalysis.analysis_text);
        // Load saved chart data if available
        if (existingAnalysis.analysis_data && typeof existingAnalysis.analysis_data === 'object') {
          console.log('Loaded saved chart data:', existingAnalysis.analysis_data);
        }
        return true;
      } else {
        console.log('No existing analysis found in database');
        return false;
      }
    } catch (error) {
      console.error('Exception loading existing analysis:', error);
      return false;
    }
  };

  const handleAnalyzeBudget = async (silent = false) => {
    if (!budgetData || budgetData.length === 0) {
      if (!silent) toast.error("אין נתוני תקציב לניתוח");
      return;
    }

    if (!user?.id) {
      if (!silent) toast.error("יש להתחבר כדי לבצע ניתוח");
      return;
    }

    // For silent calls, check if analysis already exists first
    if (silent) {
      const hasExisting = await loadExistingAnalysis();
      if (hasExisting) {
        console.log('Analysis already exists, using saved version');
        return;
      }
    }

    setIsAnalyzing(true);
    console.log('🚀 Starting budget analysis...');
    try {
      const incomeDeviation = totalIncomeExecution - totalIncome;
      const expenseDeviation = totalExpenseExecution - totalExpenses;
      
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
      
      if (data?.analysis && data.analysis.trim()) {
        // Save analysis to database
        console.log('Saving analysis to database...');
        
        // Ensure user is authenticated before saving
        if (!user?.id) {
          console.error('Cannot save analysis: user not authenticated');
          if (!silent) toast.error("יש להתחבר כדי לשמור את הניתוח");
          return;
        }

        const analysisData = {
          user_id: user.id, // Use user.id directly, not user?.id
          year: new Date().getFullYear(),
          analysis_text: data.analysis,
          total_income: totalIncome,
          total_expenses: totalExpenses,
          income_deviation: incomeDeviation,
          expense_deviation: expenseDeviation,
          analysis_data: {
            timestamp: new Date().toISOString(),
            summary: 'Budget analysis completed',
            chartData: {
              incomeCategories: budgetData.filter(item => item.category_type === 'income' && isDetailRow(item)),
              expenseCategories: budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item)),
              totalMetrics: { totalIncome, totalExpenses, incomeDeviation, expenseDeviation }
            }
          } as any
        };

        const { error: saveError } = await supabase
          .from('budget_analysis')
          .insert(analysisData);

        if (saveError) {
          console.error("Error saving analysis:", saveError);
          if (!silent) toast.error("שגיאה בשמירת הניתוח במסד הנתונים");
        } else {
          console.log("Analysis saved successfully to database");
          if (!silent) toast.success("הניתוח נשמר בהצלחה במערכת");
        }

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
      {/* Data Period Display - Prominent */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6 mb-6">
        <div className="text-center space-y-3">
          <div className="text-sm font-medium text-primary/80 uppercase tracking-wide">תקופת הנתונים</div>
          <div className="text-3xl font-bold text-foreground">
            {(() => {
              // Extract period from Excel data or budget data
              const allTextData = budgetData.map(item => 
                `${item.category_name || ''} ${item.excel_cell_ref || ''}`
              ).join(' ');
              
              // Month/Year format detection (MM/YYYY, M/YYYY)
              const monthYearPattern = /(\d{1,2})\/(\d{4})/g;
              const monthYearMatches = [...allTextData.matchAll(monthYearPattern)];
              
              if (monthYearMatches.length > 0) {
                const latestMatch = monthYearMatches[monthYearMatches.length - 1];
                const month = parseInt(latestMatch[1]);
                const year = latestMatch[2];
                
                // Determine quarter from month
                let quarter = '';
                if (month >= 1 && month <= 3) quarter = 'רבעון ראשון';
                else if (month >= 4 && month <= 6) quarter = 'רבעון שני';
                else if (month >= 7 && month <= 9) quarter = 'רבעון שלישי';
                else if (month >= 10 && month <= 12) quarter = 'רבעון רביעי';
                
                return `${month}/${year} - ${quarter}`;
              }
              
              // Quarter detection patterns
              const quarterPatterns = [
                { pattern: /רבעון ראשון|רבעון 1|Q1/i, quarter: 'רבעון ראשון' },
                { pattern: /רבעון שני|רבעון 2|Q2/i, quarter: 'רבעון שני' },
                { pattern: /רבעון שלישי|רבעון 3|Q3/i, quarter: 'רבעון שלישי' },
                { pattern: /רבעון רביעי|רבעון 4|Q4/i, quarter: 'רבעון רביעי' }
              ];
              
              for (const { pattern, quarter } of quarterPatterns) {
                if (pattern.test(allTextData)) {
                  return `${quarter} ${new Date().getFullYear()}`;
                }
              }
              
              return `שנת ${new Date().getFullYear()}`;
            })()}
          </div>
          <div className="text-sm text-muted-foreground">מקור הנתונים: קובץ אקסל שהועלה למערכת</div>
        </div>
      </div>

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

      {/* Smart Budget Analysis Section */}
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                ניתוח חכם של התקציב
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                ניתוח אוטומטי מתקדם המתבסס על נתוני האקסל שהועלו
              </p>
            </div>
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
              <div className="bg-gradient-to-r from-card to-muted/20 p-8 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span className="text-lg font-semibold text-foreground">ניתוח זמין</span>
                  <Badge variant="outline" className="text-xs">
                    נוצר אוטומטי מנתוני האקסל
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    נשמר במערכת
                  </Badge>
                  {/* Show period if available */}
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                    {(() => {
                      const analysisText = analysis || '';
                      const periodMatch = analysisText.match(/תקופת דיווח:\s*([^\.]+)/);
                      return periodMatch ? periodMatch[1].trim() : 'תקופה לא זוהתה';
                    })()}
                  </Badge>
                </div>
                <div className="prose prose-lg max-w-none">
                  <div className="text-foreground leading-relaxed space-y-4 font-medium">
                    {analysis.split('\n').map((paragraph, index) => {
                      if (!paragraph.trim()) return null;
                      
                      // Clean the paragraph from symbols
                      const cleanParagraph = paragraph
                        .replace(/\*\*/g, '') // Remove bold markdown
                        .replace(/\*/g, '') // Remove asterisks
                        .replace(/##+\s*/g, '') // Remove markdown headers
                        .replace(/^##\s*/g, '') // Remove ## at start
                        .replace(/[\u{1F300}-\u{1F5FF}|\u{1F600}-\u{1F64F}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '') // Remove emojis
                        .trim();
                      
                      if (!cleanParagraph) return null;
                      
                      // Handle headers (lines that end with colons or are clearly headers)
                      if (cleanParagraph.match(/^[א-ת\s]+:$/) || cleanParagraph.includes('ניתוח') || cleanParagraph.includes('המלצות') || cleanParagraph.includes('סיכום')) {
                        return (
                          <h3 key={index} className="text-xl font-bold text-primary mt-6 mb-3 border-b border-border pb-2">
                            {cleanParagraph.replace(/:$/, '')}
                          </h3>
                        );
                      }
                      
                      // Handle bullet points
                      if (cleanParagraph.startsWith('- ')) {
                        return (
                          <div key={index} className="flex items-start gap-3 my-2">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                            <span className="text-muted-foreground">{cleanParagraph.substring(2)}</span>
                          </div>
                        );
                      }
                      
                      // Regular paragraphs
                      return (
                        <p key={index} className="text-muted-foreground leading-relaxed">
                          {cleanParagraph}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Enhanced insights section with practical analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <span className="font-semibold text-blue-800 dark:text-blue-200">יעילות הכנסות</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    {totalIncome > 0 ? ((totalIncomeExecution / totalIncome) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400 mb-2">מתקציב התקופה</div>
                  <div className="text-xs bg-blue-100 dark:bg-blue-900/30 p-2 rounded-md">
                    <span className="font-medium">תובנה: </span>
                    {totalIncome > 0 && (totalIncomeExecution / totalIncome) >= 1.05 ? 
                      "ביצועים מעולים - חריגה חיובית מהתוכנית" :
                      totalIncome > 0 && (totalIncomeExecution / totalIncome) >= 0.95 ?
                      "ביצועים בהתאם לתוכנית" :
                      "נדרש ניטור צמוד לשיפור הגבייה"
                    }
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                    <span className="font-semibold text-purple-800 dark:text-purple-200">מאזן תקופתי</span>
                  </div>
                  <div className={`text-3xl font-bold mb-1 ${totalIncomeExecution - totalExpenseExecution >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    {formatCurrency(totalIncomeExecution - totalExpenseExecution)}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-2">
                    {totalIncomeExecution - totalExpenseExecution >= 0 ? 'עודף' : 'גירעון'} לתקופה
                  </div>
                  <div className="text-xs bg-purple-100 dark:bg-purple-900/30 p-2 rounded-md">
                    <span className="font-medium">מצב: </span>
                    {totalIncomeExecution - totalExpenseExecution >= 0 ? 
                      "מצב פיננסי חיובי - ניתן להרחיב פעילות" :
                      "נדרש צמצום הוצאות או הגדלת הכנסות"
                    }
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-6 h-6 text-orange-600" />
                    <span className="font-semibold text-orange-800 dark:text-orange-200">שליטה בהוצאות</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-700 dark:text-orange-300 mb-1">
                    {totalExpenses > 0 ? ((totalExpenseExecution / totalExpenses) * 100).toFixed(1) : '0.0'}%
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 mb-2">מתקציב התקופה</div>
                  <div className="text-xs bg-orange-100 dark:bg-orange-900/30 p-2 rounded-md">
                    <span className="font-medium">מצב: </span>
                    {totalExpenses > 0 && (totalExpenseExecution / totalExpenses) > 1.05 ? 
                      "חריגה מהתקציב - נדרש בקרת הוצאות" :
                      totalExpenses > 0 && (totalExpenseExecution / totalExpenses) > 0.95 ?
                      "ביצוע בהתאם לתוכנית" :
                      "ביצוע חסכוני - מתחת לתוכנית"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-5 rounded-xl border border-green-200 dark:border-green-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-200">מדד יעילות</span>
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300 mb-1">
                    {totalExpenses > 0 && totalIncome > 0 ? ((totalIncomeExecution / totalExpenseExecution) * 100).toFixed(0) : '0'}%
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mb-2">יחס הכנסות/הוצאות</div>
                  <div className="text-xs bg-green-100 dark:bg-green-900/30 p-2 rounded-md">
                    <span className="font-medium">רמה: </span>
                    {totalExpenseExecution > 0 && (totalIncomeExecution / totalExpenseExecution) >= 1.1 ? 
                      "מצוינת - מאזן חיובי משמעותי" :
                      totalExpenseExecution > 0 && (totalIncomeExecution / totalExpenseExecution) >= 1.0 ?
                      "טובה - מאזן חיובי" :
                      "נדרש שיפור במאזן הכספי"
                    }
                  </div>
                </div>
              </div>

              {/* Period Analysis and Key Figures */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                      📊 ניתוח תקופתי מתקדם
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">שנת תקציב</div>
                        <div className="text-xl font-bold text-indigo-800 dark:text-indigo-200">{new Date().getFullYear()}</div>
                      </div>
                      <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">תקופת הנתונים</div>
                        <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                          {(() => {
                            // Extract period from Excel data or budget data
                            const allTextData = budgetData.map(item => 
                              `${item.category_name || ''} ${item.excel_cell_ref || ''}`
                            ).join(' ');
                            
                            // Month/Year format detection (MM/YYYY, M/YYYY)
                            const monthYearPattern = /(\d{1,2})\/(\d{4})/g;
                            const monthYearMatches = [...allTextData.matchAll(monthYearPattern)];
                            
                            if (monthYearMatches.length > 0) {
                              const latestMatch = monthYearMatches[monthYearMatches.length - 1];
                              const month = parseInt(latestMatch[1]);
                              const year = latestMatch[2];
                              
                              // Determine quarter from month
                              let quarter = '';
                              if (month >= 1 && month <= 3) quarter = 'רבעון ראשון';
                              else if (month >= 4 && month <= 6) quarter = 'רבעון שני';
                              else if (month >= 7 && month <= 9) quarter = 'רבעון שלישי';
                              else if (month >= 10 && month <= 12) quarter = 'רבעון רביעי';
                              
                              return `${month}/${year} ${quarter}`;
                            }
                            
                            // Quarter detection patterns
                            const quarterPatterns = [
                              { pattern: /רבעון ראשון|רבעון 1|Q1/i, quarter: 'רבעון ראשון' },
                              { pattern: /רבעון שני|רבעון 2|Q2/i, quarter: 'רבעון שני' },
                              { pattern: /רבעון שלישי|רבעון 3|Q3/i, quarter: 'רבעון שלישי' },
                              { pattern: /רבעון רביעי|רבעון 4|Q4/i, quarter: 'רבעון רביעי' }
                            ];
                            
                            for (const { pattern, quarter } of quarterPatterns) {
                              if (pattern.test(allTextData)) {
                                return `${quarter} ${new Date().getFullYear()}`;
                              }
                            }
                            
                            return 'לא זוהתה תקופה ספציפית';
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
                      <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">סיכום ביצוע התקופה</div>
                      <div className="text-xs space-y-1">
                        <div>• קטגוריות הכנסות: {budgetData.filter(item => item.category_type === 'income' && isDetailRow(item)).length}</div>
                        <div>• קטגוריות הוצאות: {budgetData.filter(item => item.category_type === 'expense' && isDetailRow(item)).length}</div>
                        <div>• חריגות משמעותיות: {budgetData.filter(item => Math.abs(item.budget_deviation_percentage) > 10 && isDetailRow(item)).length}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                      💡 המלצות מעשיות
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      {(() => {
                        const recommendations = [];
                        
                        // Check income efficiency
                        if (totalIncome > 0 && (totalIncomeExecution / totalIncome) < 0.9) {
                          recommendations.push("🔍 בדוק מקורות הכנסה שלא מומשו במלואם");
                        }
                        
                        // Check expense control
                        if (totalExpenses > 0 && (totalExpenseExecution / totalExpenses) > 1.1) {
                          recommendations.push("⚠️ הגבלת הוצאות בסעיפים החורגים מהתקציב");
                        }
                        
                        // Check balance
                        if (totalIncomeExecution - totalExpenseExecution < 0) {
                          recommendations.push("📈 פיתוח מקורות הכנסה נוספים להקטנת הגירעון");
                        }
                        
                        // Check high deviations
                        const highDeviations = budgetData.filter(item => Math.abs(item.budget_deviation_percentage) > 15 && isDetailRow(item));
                        if (highDeviations.length > 0) {
                          recommendations.push(`🎯 ניטור ${highDeviations.length} סעיפים עם חריגות גבוהות`);
                        }
                        
                        if (recommendations.length === 0) {
                          recommendations.push("✅ הביצוע תואם לתוכנית - המשיכו בניטור שוטף");
                        }
                        
                        return recommendations.map((rec, index) => (
                          <div key={index} className="bg-white/60 dark:bg-gray-800/60 p-2 rounded-md text-amber-800 dark:text-amber-200 font-medium">
                            {rec}
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
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
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold">ניתוח אוטומטי מתקדם</h3>
                  <p className="text-lg">העלה קובץ אקסל כדי לקבל ניתוח מיידי הכולל:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6">
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                      <div className="font-semibold text-blue-800 dark:text-blue-200 mb-2">📊 ניתוח נתונים</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400">
                        • הצגת נתונים מסודרת לפי תקופות<br/>
                        • זיהוי מגמות וחריגות<br/>
                        • סיכום מספרים מרכזיים
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                      <div className="font-semibold text-green-800 dark:text-green-200 mb-2">💡 המלצות מעשיות</div>
                      <div className="text-sm text-green-600 dark:text-green-400">
                        • אזורי תשומת לב דחופים<br/>
                        • הצעות לשיפור הביצוע<br/>
                        • תחזיות למגמות עתידיות
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg max-w-md mx-auto mt-4">
                    <div className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                      ⚡ הניתוח מתבצע אוטומטית מיד לאחר העלאת קובץ האקסל ונשמר למעקב עתידי
                    </div>
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
            onAnalysisTriggered={() => handleAnalyzeBudget(true)}
          />
        </DialogContent>
      </Dialog>

      {/* Advanced Charts Section */}
      {analysis && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="h-7 w-7 text-primary" />
            <div>
              <h3 className="text-2xl font-bold text-foreground">ויזואליזציות נתונים מתקדמות</h3>
              <p className="text-sm text-muted-foreground mt-1">גרפים מבוססי AI לניתוח פיננסי מקצועי</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Enhanced Budget Overview Chart */}
            <Card className="p-6 shadow-lg border-l-4 border-l-primary">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-foreground">סקירת תקציב כוללת</h4>
                <Badge variant="secondary" className="text-xs">ביצוע לעומת תכנון</Badge>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[
                      { 
                        category: 'הכנסות', 
                        מתוכנן: totalIncome, 
                        בפועל: totalIncomeExecution,
                        אחוזביצוע: totalIncome ? (totalIncomeExecution / totalIncome * 100) : 0
                      },
                      { 
                        category: 'הוצאות', 
                        מתוכנן: totalExpenses, 
                        בפועל: totalExpenseExecution,
                        אחוזביצוע: totalExpenses ? (totalExpenseExecution / totalExpenses * 100) : 0
                      }
                    ]} 
                    margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="category" 
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      fontSize={14}
                      fontWeight={600}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))' }}
                      fontSize={12}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toLocaleString('he-IL')} ₪`,
                        name === 'מתוכנן' ? 'תקציב מתוכנן' : 'ביצוע בפועל'
                      ]}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="מתוכנן" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                      name="תקציב מתוכנן"
                    />
                    <Bar 
                      dataKey="בפועל" 
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                      name="ביצוע בפועל"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Performance by Category Chart - Vertical Layout */}
            <Card className="p-6 shadow-lg border-l-4 border-l-secondary">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-foreground">ביצועי תקציב לפי קטגורית</h4>
                  <Badge variant="outline" className="text-xs">top 6 קטגוריות</Badge>
                </div>
                
                {/* Vertical list layout instead of chart */}
                <div className="space-y-3">
                  {budgetData
                    .filter(item => item.category_type === 'income' && isDetailRow(item))
                    .slice(0, 6)
                    .map((item, index) => {
                      const percentage = item.budget_amount ? ((item.actual_amount || 0) / item.budget_amount * 100) : 0;
                      return (
                        <div key={index} className="bg-gradient-to-l from-card to-muted/10 p-4 rounded-lg border border-border">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-foreground text-sm">
                              {item.category_name}
                            </div>
                            <div className={`text-sm font-bold ${percentage >= 100 ? 'text-green-600' : percentage >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>תקציב: {formatCurrency(item.budget_amount)}</span>
                            <span>ביצוע: {formatCurrency(item.actual_amount)}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                percentage >= 100 ? 'bg-green-500' : 
                                percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>

            {/* Expense Distribution Pie Chart */}
            <Card className="p-6 shadow-lg border-l-4 border-l-accent">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-foreground">התפלגות הוצאות</h4>
                <Badge variant="outline" className="text-xs">top 8 הוצאות</Badge>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <div className="grid grid-cols-2 gap-4 h-full">
                    {budgetData
                      .filter(item => item.category_type === 'expense' && isDetailRow(item) && item.actual_amount > 0)
                      .slice(0, 8)
                      .map((item, index) => {
                        const total = budgetData
                          .filter(i => i.category_type === 'expense' && isDetailRow(i) && i.actual_amount > 0)
                          .reduce((sum, i) => sum + (i.actual_amount || 0), 0);
                        const percentage = ((item.actual_amount || 0) / total * 100).toFixed(1);
                        
                        return (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm" 
                              style={{ backgroundColor: `hsl(${index * 45 + 200}, 70%, 50%)` }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate text-foreground">
                                {item.category_name.length > 18 ? item.category_name.substring(0, 18) + '...' : item.category_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {Number(item.actual_amount).toLocaleString('he-IL')} ₪
                              </div>
                              <div className="text-xs font-medium text-primary">
                                {percentage}%
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Budget Variance Analysis - Vertical Layout */}
            <Card className="p-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-foreground">ניתוח חריגות תקציביות</h4>
                
                {/* Vertical list layout for variance analysis */}
                <div className="space-y-3">
                  {budgetData
                    .filter(item => isDetailRow(item) && Math.abs((item.actual_amount || 0) - (item.budget_amount || 0)) > 1000)
                    .slice(0, 8)
                    .map((item, index) => {
                      const variance = (item.actual_amount || 0) - (item.budget_amount || 0);
                      const variancePercentage = item.budget_amount ? (variance / item.budget_amount * 100) : 0;
                      const isPositive = variance >= 0;
                      
                      return (
                        <div key={index} className={`p-4 rounded-lg border ${
                          isPositive ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 
                          'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-foreground text-sm">
                              {item.category_name}
                            </div>
                            <div className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              {variancePercentage.toFixed(1)}%
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-2">
                            <span>תקציב: {formatCurrency(item.budget_amount)}</span>
                            <span>ביצוע: {formatCurrency(item.actual_amount)}</span>
                          </div>
                          <div className={`text-sm font-medium ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                            חריגה: {formatCurrency(variance)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}