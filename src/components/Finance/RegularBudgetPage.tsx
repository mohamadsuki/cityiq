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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות מאושר</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalBudgetIncome)}</div>
            <p className="text-xs text-muted-foreground">
              תקציב יחסי: {incomeSummaryRow ? formatCurrency(incomeSummaryRow.actual_amount) : '₪0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הוצאות מאושר</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalBudgetExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              ביצוע: {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות והוצאות</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              הכנסות: {incomeSummaryRow ? formatCurrency(incomeSummaryRow.cumulative_execution || 0) : '₪0'}
            </div>
            <div className="text-lg font-bold text-red-600">
              הוצאות: {expenseSummaryRow ? formatCurrency(expenseSummaryRow.cumulative_execution || 0) : '₪0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ביצוע מצטבר
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סטיה מהתקציב</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className={`text-lg font-bold ${
                incomeSummaryRow && ((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0)) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                הכנסות: {incomeSummaryRow ? formatCurrency(Math.abs((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0))) : '₪0'}
              </div>
              <div className={`text-lg font-bold ${
                expenseSummaryRow && ((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0)) >= 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                הוצאות: {expenseSummaryRow ? formatCurrency(Math.abs((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0))) : '₪0'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              הכנסות: {incomeSummaryRow && (incomeSummaryRow.actual_amount || 0) > 0 ? ((((incomeSummaryRow.cumulative_execution || 0) - (incomeSummaryRow.actual_amount || 0)) / (incomeSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}% | 
              הוצאות: {expenseSummaryRow && (expenseSummaryRow.actual_amount || 0) > 0 ? ((((expenseSummaryRow.cumulative_execution || 0) - (expenseSummaryRow.actual_amount || 0)) / (expenseSummaryRow.actual_amount || 1)) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ביצוע מצטבר הכנסות</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalBudgetIncome > 0 ? ((totalIncome / totalBudgetIncome) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              מתוך התקציב המתוכנן
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ביצוע מצטבר הוצאות</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {totalBudgetExpenses > 0 ? ((totalExpenses / totalBudgetExpenses) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              מתוך התקציב המתוכנן
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">יעילות תקציבית</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              (totalIncome / totalBudgetIncome) > (totalExpenses / totalBudgetExpenses) ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalBudgetIncome > 0 && totalBudgetExpenses > 0 ? 
                (((totalIncome / totalBudgetIncome) - (totalExpenses / totalBudgetExpenses)) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              הפרש ביצוע הכנסות להוצאות
            </p>
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