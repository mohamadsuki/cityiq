import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Plus
} from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataUploader } from "@/components/shared/DataUploader";
import { ExcelSummaryCards } from "./ExcelSummaryCards";
import type { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RegularBudgetItem {
  id: string;
  category_type: 'income' | 'expense';
  category_name: string;
  budget_amount: number;
  actual_amount: number;
  excel_cell_ref?: string;
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
    actual_amount: '',
    excel_cell_ref: ''
  });

  // Check if user is using actual database (not demo data) - show real data from database
  const isDemoUser = false; // Show real data from database

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const loadBudgetData = async () => {
    setLoading(true);
    console.log("=== LOADING BUDGET DATA ===");
    
    if (isDemoUser) {
      // Demo data representing Excel structure (F7-F11, F14-F19, F23-F24 for income, F27-F29, F32-F33, F35-F36, F41, F44, F49 for expenses)
      const demoData: RegularBudgetItem[] = [
        // ... keep existing code (demo data)
        // הכנסות
        { id: '1', category_type: 'income', category_name: 'ארנונה כללית', budget_amount: 450000000, actual_amount: 420000000, excel_cell_ref: 'F7', year: 2024, difference: -30000000, percentage: 93.3 },
        { id: '2', category_type: 'income', category_name: 'אגרת ביוב', budget_amount: 85000000, actual_amount: 88000000, excel_cell_ref: 'F8', year: 2024, difference: 3000000, percentage: 103.5 },
        { id: '3', category_type: 'income', category_name: 'אגרת אשפה', budget_amount: 65000000, actual_amount: 62000000, excel_cell_ref: 'F9', year: 2024, difference: -3000000, percentage: 95.4 },
        { id: '4', category_type: 'income', category_name: 'היטלי פיתוח', budget_amount: 120000000, actual_amount: 135000000, excel_cell_ref: 'F10', year: 2024, difference: 15000000, percentage: 112.5 },
        { id: '5', category_type: 'income', category_name: 'רישיונות ואגרות', budget_amount: 45000000, actual_amount: 41000000, excel_cell_ref: 'F11', year: 2024, difference: -4000000, percentage: 91.1 },
        
        { id: '6', category_type: 'income', category_name: 'קנסות חניה', budget_amount: 25000000, actual_amount: 28000000, excel_cell_ref: 'F14', year: 2024, difference: 3000000, percentage: 112 },
        { id: '7', category_type: 'income', category_name: 'קנסות בנייה', budget_amount: 15000000, actual_amount: 12000000, excel_cell_ref: 'F15', year: 2024, difference: -3000000, percentage: 80 },
        { id: '8', category_type: 'income', category_name: 'השכרת נכסים', budget_amount: 35000000, actual_amount: 37000000, excel_cell_ref: 'F16', year: 2024, difference: 2000000, percentage: 105.7 },
        { id: '9', category_type: 'income', category_name: 'מענקים ממשלתיים', budget_amount: 180000000, actual_amount: 195000000, excel_cell_ref: 'F17', year: 2024, difference: 15000000, percentage: 108.3 },
        { id: '10', category_type: 'income', category_name: 'הכנסות אחרות', budget_amount: 30000000, actual_amount: 25000000, excel_cell_ref: 'F18', year: 2024, difference: -5000000, percentage: 83.3 },
        { id: '11', category_type: 'income', category_name: 'הכנסות מיוחדות', budget_amount: 40000000, actual_amount: 45000000, excel_cell_ref: 'F19', year: 2024, difference: 5000000, percentage: 112.5 },

        { id: '12', category_type: 'income', category_name: 'הכנסות חד פעמיות', budget_amount: 50000000, actual_amount: 55000000, excel_cell_ref: 'F23', year: 2024, difference: 5000000, percentage: 110 },
        { id: '13', category_type: 'income', category_name: 'הכנסות מרמי', budget_amount: 75000000, actual_amount: 78000000, excel_cell_ref: 'F24', year: 2024, difference: 3000000, percentage: 104 },

        // הוצאות
        { id: '14', category_type: 'expense', category_name: 'שכר כללי', budget_amount: 320000000, actual_amount: 315000000, excel_cell_ref: 'F27', year: 2024, difference: -5000000, percentage: 98.4 },
        { id: '15', category_type: 'expense', category_name: 'שכר חינוך', budget_amount: 180000000, actual_amount: 185000000, excel_cell_ref: 'F28', year: 2024, difference: 5000000, percentage: 102.8 },
        { id: '16', category_type: 'expense', category_name: 'שכר רווחה', budget_amount: 95000000, actual_amount: 92000000, excel_cell_ref: 'F29', year: 2024, difference: -3000000, percentage: 96.8 },

        { id: '17', category_type: 'expense', category_name: 'אחזקת רכב', budget_amount: 25000000, actual_amount: 28000000, excel_cell_ref: 'F32', year: 2024, difference: 3000000, percentage: 112 },
        { id: '18', category_type: 'expense', category_name: 'אחזקת מבנים', budget_amount: 45000000, actual_amount: 41000000, excel_cell_ref: 'F33', year: 2024, difference: -4000000, percentage: 91.1 },

        { id: '19', category_type: 'expense', category_name: 'חשמל ותאורה', budget_amount: 35000000, actual_amount: 38000000, excel_cell_ref: 'F35', year: 2024, difference: 3000000, percentage: 108.6 },
        { id: '20', category_type: 'expense', category_name: 'דלק וחימור', budget_amount: 20000000, actual_amount: 22000000, excel_cell_ref: 'F36', year: 2024, difference: 2000000, percentage: 110 },

        { id: '21', category_type: 'expense', category_name: 'שירותים מקצועיים', budget_amount: 55000000, actual_amount: 52000000, excel_cell_ref: 'F41', year: 2024, difference: -3000000, percentage: 94.5 },

        { id: '22', category_type: 'expense', category_name: 'פעילויות תרבות', budget_amount: 15000000, actual_amount: 18000000, excel_cell_ref: 'F44', year: 2024, difference: 3000000, percentage: 120 },

        { id: '23', category_type: 'expense', category_name: 'הוצאות שונות', budget_amount: 30000000, actual_amount: 25000000, excel_cell_ref: 'F49', year: 2024, difference: -5000000, percentage: 83.3 },
      ];
      setBudgetData(demoData);
      setFilteredData(demoData);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('regular_budget')
        .select('*')
        .order('category_type')
        .order('category_name');

      if (error) throw error;

      console.log("Raw data from database:", data);
      console.log("Number of records:", data?.length || 0);

      const processedData: RegularBudgetItem[] = (data || []).map(item => ({
        ...item,
        difference: (item.actual_amount || 0) - (item.budget_amount || 0),
        percentage: item.budget_amount ? ((item.actual_amount || 0) / item.budget_amount) * 100 : 0
      }));

      console.log("Processed data:", processedData);
      console.log("Income items:", processedData.filter(item => item.category_type === 'income').length);
      console.log("Expense items:", processedData.filter(item => item.category_type === 'expense').length);

      setBudgetData(processedData);
      setFilteredData(processedData);
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('שגיאה בטעינת נתוני תקציב');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, [session, user?.id]);

  useEffect(() => {
    let filtered = budgetData;
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => item.category_type === categoryFilter);
    }
    
    setFilteredData(filtered);
  }, [budgetData, categoryFilter]);

  const handleAddItem = async () => {
    if (!user?.id || !newItem.category_name || !newItem.budget_amount) {
      toast.error('נא למלא את כל השדות הנדרשים');
      return;
    }

    try {
      const itemData = {
        user_id: user.id,
        category_type: newItem.category_type,
        category_name: newItem.category_name,
        budget_amount: Number(newItem.budget_amount),
        actual_amount: Number(newItem.actual_amount) || 0,
        excel_cell_ref: newItem.excel_cell_ref || null,
        year: new Date().getFullYear()
      };

      if (isDemoUser) {
        const demoItem: RegularBudgetItem = {
          id: Date.now().toString(),
          ...itemData,
          difference: (itemData.actual_amount || 0) - itemData.budget_amount,
          percentage: itemData.budget_amount ? ((itemData.actual_amount || 0) / itemData.budget_amount) * 100 : 0
        };
        setBudgetData(prev => [...prev, demoItem]);
        toast.success('פריט נוסף לתקציב');
      } else {
        const { error } = await supabase
          .from('regular_budget')
          .insert([itemData]);

        if (error) throw error;
        
        toast.success('פריט נוסף לתקציב בהצלחה');
        loadBudgetData();
      }

      setNewItem({
        category_type: 'income',
        category_name: '',
        budget_amount: '',
        actual_amount: '',
        excel_cell_ref: ''
      });
      setAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding budget item:', error);
      toast.error('שגיאה בהוספת פריט לתקציב');
    }
  };

  // Prepare chart data
  const incomeData = filteredData.filter(item => item.category_type === 'income');
  const expenseData = filteredData.filter(item => item.category_type === 'expense');

  const incomeChartData = incomeData.map(item => ({
    name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
    budget: (item.budget_amount || 0) / 1000000,
    actual: (item.actual_amount || 0) / 1000000,
    difference: (item.difference || 0) / 1000000
  }));

  const expenseChartData = expenseData.map(item => ({
    name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
    budget: (item.budget_amount || 0) / 1000000,
    actual: (item.actual_amount || 0) / 1000000,
    difference: (item.difference || 0) / 1000000
  }));

  // Table columns
  const columns: ColumnDef<RegularBudgetItem>[] = [
    {
      accessorKey: "category_name",
      header: "קטגוריה",
    },
    {
      accessorKey: "category_type",
      header: "סוג",
      cell: ({ row }) => (
        <Badge variant={row.original.category_type === 'income' ? 'default' : 'secondary'}>
          {row.original.category_type === 'income' ? 'הכנסה' : 'הוצאה'}
        </Badge>
      ),
    },
    {
      accessorKey: "budget_amount",
      header: "תקציב מאושר",
      cell: ({ row }) => formatCurrency(row.original.budget_amount),
    },
    {
      accessorKey: "actual_amount",
      header: "ביצוע בפועל",
      cell: ({ row }) => formatCurrency(row.original.actual_amount),
    },
    {
      accessorKey: "difference",
      header: "הפרש",
      cell: ({ row }) => {
        const diff = row.original.difference;
        return (
          <span className={diff >= 0 ? 'text-success' : 'text-destructive'}>
            {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
          </span>
        );
      },
    },
    {
      accessorKey: "percentage",
      header: "אחוז ביצוע",
      cell: ({ row }) => {
        const percentage = row.original.percentage;
        return (
          <div className="flex items-center gap-2">
            <span className={percentage >= 100 ? 'text-success' : percentage >= 80 ? 'text-warning' : 'text-destructive'}>
              {percentage.toFixed(1)}%
            </span>
            {percentage >= 100 ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
          </div>
        );
      },
    },
    {
      accessorKey: "excel_cell_ref",
      header: "תא באקסל",
      cell: ({ row }) => (
        <Badge variant="outline">
          {row.original.excel_cell_ref || '-'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">תקציב רגיל</h1>
          <p className="text-muted-foreground">
            תצוגה מפורטת של התקציב הרגיל מקובץ "תקציב רגיל RAW"
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                הוסף פריט
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הוסף פריט תקציב חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category_type">סוג</Label>
                  <Select value={newItem.category_type} onValueChange={(value: 'income' | 'expense') => setNewItem(prev => ({...prev, category_type: value}))}>
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
                  <Label htmlFor="category_name">שם קטגוריה *</Label>
                  <Input
                    id="category_name"
                    value={newItem.category_name}
                    onChange={(e) => setNewItem(prev => ({...prev, category_name: e.target.value}))}
                    placeholder="לדוגמה: ארנונה כללית"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget_amount">תקציב מאושר *</Label>
                    <Input
                      id="budget_amount"
                      type="number"
                      value={newItem.budget_amount}
                      onChange={(e) => setNewItem(prev => ({...prev, budget_amount: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="actual_amount">ביצוע בפועל</Label>
                    <Input
                      id="actual_amount"
                      type="number"
                      value={newItem.actual_amount}
                      onChange={(e) => setNewItem(prev => ({...prev, actual_amount: e.target.value}))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="excel_cell_ref">תא באקסל</Label>
                  <Input
                    id="excel_cell_ref"
                    value={newItem.excel_cell_ref}
                    onChange={(e) => setNewItem(prev => ({...prev, excel_cell_ref: e.target.value}))}
                    placeholder="לדוגמה: F7"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddItem}>
                    שמור פריט
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="h-4 w-4 ml-2" />
                ייבוא מאקסל
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ייבוא תקציב רגיל מאקסל</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <DataUploader
                  context="regular_budget" 
                  onUploadSuccess={() => {
                    console.log("Data uploaded successfully - refreshing budget data...");
                    // Force page reload to ensure data is fresh
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                    setImportDialogOpen(false);
                    toast.success('הנתונים יובאו בהצלחה! הדף מתרענן כעת...');
                  }}
                />
                <div className="mt-4 text-sm text-muted-foreground">
                  לאחר הייבוא מוצלח, הדיאלוג יסגר והדף יתרענן אוטומטית.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards from Excel B25, D25, F25, J25 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <ExcelSummaryCards />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">סה"כ הכנסות מתוכננות</div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(incomeData.reduce((sum, item) => sum + (item.budget_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">סה"כ הכנסות בפועל</div>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(incomeData.reduce((sum, item) => sum + (item.actual_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">סה"כ הוצאות מתוכננות</div>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(expenseData.reduce((sum, item) => sum + (item.budget_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">סה"כ הוצאות בפועל</div>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(expenseData.reduce((sum, item) => sum + (item.actual_amount || 0), 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="income" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="income">גרפי הכנסות</TabsTrigger>
          <TabsTrigger value="expense">גרפי הוצאות</TabsTrigger>
          <TabsTrigger value="comparison">השוואה כוללת</TabsTrigger>
        </TabsList>

        {/* Income Charts */}
        <TabsContent value="income" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>הכנסות - תקציב מול ביצוע (F7-F11, F14-F19, F23-F24)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `₪${Number(value).toFixed(1)}M`, 
                        name === 'budget' ? 'תקציב' : 'ביצוע'
                      ]}
                    />
                    <Bar dataKey="budget" fill="hsl(var(--muted))" name="תקציב" />
                    <Bar dataKey="actual" fill="hsl(var(--success))" name="ביצוע" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>תקציב מאושר - הכנסות (D7-D11, D14-D19, D23-D24)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₪${Number(value).toFixed(1)}M`, 'תקציב']}
                    />
                    <Bar dataKey="budget" fill="hsl(var(--primary))" name="תקציב" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הפרש הכנסות (ביצוע מינוס תקציב)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₪${Number(value).toFixed(1)}M`, 'הפרש']}
                    />
                    <Bar 
                      dataKey="difference" 
                      fill="hsl(var(--chart-1))"
                      name="הפרש"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Expense Charts */}
        <TabsContent value="expense" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>הוצאות - תקציב מול ביצוע (F27-F29, F32-F33, F35-F36, F41, F44, F49)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `₪${Number(value).toFixed(1)}M`, 
                        name === 'budget' ? 'תקציב' : 'ביצוע'
                      ]}
                    />
                    <Bar dataKey="budget" fill="hsl(var(--muted))" name="תקציב" />
                    <Bar dataKey="actual" fill="hsl(var(--destructive))" name="ביצוע" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>תקציב מאושר - הוצאות (D27-D29, D32-D33, D35-D36, D41, D44, D49)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₪${Number(value).toFixed(1)}M`, 'תקציב']}
                    />
                    <Bar dataKey="budget" fill="hsl(var(--secondary))" name="תקציב" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הפרש הוצאות (ביצוע מינוס תקציב)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={expenseChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`₪${Number(value).toFixed(1)}M`, 'הפרש']}
                    />
                    <Bar 
                      dataKey="difference" 
                      fill="hsl(var(--chart-2))"
                      name="הפרש"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparison Chart */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>השוואה כוללת - הכנסות מול הוצאות</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={[
                  { 
                    name: 'תקציב מתוכנן',
                    income: incomeData.reduce((sum, item) => sum + item.budget_amount, 0) / 1000000,
                    expense: expenseData.reduce((sum, item) => sum + item.budget_amount, 0) / 1000000
                  },
                  { 
                    name: 'ביצוע בפועל',
                    income: incomeData.reduce((sum, item) => sum + item.actual_amount, 0) / 1000000,
                    expense: expenseData.reduce((sum, item) => sum + item.actual_amount, 0) / 1000000
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₪${Number(value).toFixed(1)}M`]} />
                  <Line type="monotone" dataKey="income" stroke="hsl(var(--success))" strokeWidth={3} name="הכנסות" />
                  <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={3} name="הוצאות" />
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
            <CardTitle>טבלת תקציב רגיל מפורטת</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="income">הכנסות</SelectItem>
                  <SelectItem value="expense">הוצאות</SelectItem>
                </SelectContent>
              </Select>
              <ExportButtons data={filteredData} fileBaseName="regular-budget" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-card">
            <DataTable
              columns={columns}
              data={filteredData}
              searchPlaceholder="חיפוש בתקציב..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}