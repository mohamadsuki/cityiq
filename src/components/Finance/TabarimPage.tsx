import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Plus, Pencil, Brain, Loader2, BarChart3, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { DataUploader } from "@/components/shared/DataUploader";
import { ColumnDef } from "@tanstack/react-table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddTabarDialog from "./AddTabarDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Tabar {
  id: string;
  tabar_number: string;
  tabar_name: string;
  domain: string;
  funding_source1: string;
  funding_source2?: string;
  funding_source3?: string;
  approved_budget: number;
  income_actual: number;
  expense_actual: number;
  surplus_deficit: number;
  created_at: string;
}

export default function TabarimPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [tabarim, setTabarim] = useState<Tabar[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTabar, setSelectedTabar] = useState<Tabar | null>(null);
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'deficit' | 'surplus'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [fundingSourceFilter, setFundingSourceFilter] = useState<string>('all');
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [detectedPeriod, setDetectedPeriod] = useState<string>("");
  const { toast } = useToast();
  const tableRef = useRef<HTMLDivElement>(null);

  const loadTabarim = async () => {
    try {
      console.log('🔄 Loading tabarim from database...');
      setLoading(true);
      const { data, error } = await supabase
        .from('tabarim')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📊 Tabarim query result:', { 
        data: data?.length || 0, 
        error,
        sampleData: data?.[0] 
      });

      if (error) {
        console.error('❌ Error loading tabarim:', error);
        throw error;
      }
      
      console.log('✅ Successfully loaded tabarim:', data?.length || 0, 'records');
      setTabarim(data || []);
    } catch (error) {
      console.error('Error loading tabarim:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת התב\"רים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabarim();
  }, []);

  // Load saved analysis when tabarim data is loaded
  useEffect(() => {
    if (tabarim.length > 0 && !analysis) {
      loadSavedAnalysis();
    }
  }, [tabarim]);

  const loadSavedAnalysis = async () => {
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase
        .from('tabarim_analysis')
        .select('analysis_text, created_at')
        .eq('year', new Date().getFullYear())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setAnalysis(data.analysis_text);
        console.log('Loaded saved tabarim analysis from:', data.created_at);
      } else if (tabarim.length > 0) {
        // If no saved analysis, generate new one automatically
        console.log('No saved tabarim analysis found, generating new one...');
        handleAnalyzeTabarim(true); // silent generation
      }
    } catch (error) {
      console.error('Error loading saved tabarim analysis:', error);
      // Try to generate new analysis
      if (tabarim.length > 0) {
        handleAnalyzeTabarim(true);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAnalyzeTabarim = async (silent = false) => {
    if (!tabarim || tabarim.length === 0) {
      if (!silent) toast({
        title: "שגיאה",
        description: "אין נתוני תב\"רים לניתוח",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('🚀 Starting tabarim analysis...');
    
    try {
      const totalApprovedBudget = tabarim.reduce((sum, item) => sum + (item.approved_budget || 0), 0);
      const totalIncomeActual = tabarim.reduce((sum, item) => sum + (item.income_actual || 0), 0);
      const totalExpenseActual = tabarim.reduce((sum, item) => sum + (item.expense_actual || 0), 0);
      const totalSurplusDeficit = tabarim.reduce((sum, item) => sum + (item.surplus_deficit || 0), 0);
      
      const { data, error } = await supabase.functions.invoke('analyze-tabarim', {
        body: {
          tabarimData: tabarim,
          totalApprovedBudget,
          totalIncomeActual,
          totalExpenseActual,
          totalSurplusDeficit
        }
      });

      if (error) {
        console.error("Error analyzing tabarim:", error);
        if (!silent) toast({
          title: "שגיאה",
          description: `שגיאה בניתוח התב\"רים: ${error.message || 'שגיאה לא ידועה'}`,
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        console.error("OpenAI API error:", data.error);
        if (!silent) toast({
          title: "שגיאה",
          description: `שגיאה ב-OpenAI: ${data.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (data?.analysis && data.analysis.trim()) {
        setAnalysis(data.analysis);
        if (data.period) {
          setDetectedPeriod(data.period);
        }
        if (!silent) toast({
          title: "הצלחה",
          description: "ניתוח התב\"רים הושלם בהצלחה",
        });
      } else {
        console.error("No valid analysis in response:", data);
        if (!silent) toast({
          title: "שגיאה",
          description: "לא התקבל ניתוח תקין מהשרת",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      if (!silent) toast({
        title: "שגיאה",
        description: `שגיאה בניתוח התב\"רים: ${error.message || 'שגיאה לא ידועה'}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabarSaved = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    loadTabarim(); // רענון הרשימה
  };

  const handleEditClick = (tabar: Tabar) => {
    setSelectedTabar(tabar);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (tabar: Tabar) => {
    setSelectedTabar(tabar);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTabar) return;

    try {
      const { error } = await supabase
        .from('tabarim')
        .delete()
        .eq('id', selectedTabar.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "התב\"ר נמחק בהצלחה",
      });

      loadTabarim(); // רענון הרשימה
    } catch (error) {
      console.error('Error deleting tabar:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את התב\"ר",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedTabar(null);
    }
  };

  const handleUploadSuccess = () => {
    console.log('🔄 Upload success callback - refreshing tabarim list');
    setShowUploader(false);
    // Add delay to ensure database has been updated  
    setTimeout(() => {
      loadTabarim(); // רענון הרשימה
      toast({
        title: "הצלחה",
        description: "הקובץ הועלה בהצלחה והנתונים נשמרו",
      });
    }, 1000);
  };

  const columns: ColumnDef<Tabar>[] = [
    {
      accessorKey: "tabar_number",
      header: "מספר תב\"ר",
    },
    {
      accessorKey: "tabar_name", 
      header: "שם התב\"ר",
    },
    {
      accessorKey: "domain",
      header: "תחום",
      cell: ({ row }) => {
        const domainLabels: Record<string, string> = {
          education_buildings: "מבני חינוך",
          infrastructure: "תשתיות",
          parks_gardens: "גנים ופארקים",
          culture_sports: "תרבות וספורט",
          organizational: "ארגוני",
          welfare: "רווחה",
        };
        return domainLabels[row.getValue("domain") as string] || row.getValue("domain");
      },
    },
    {
      accessorKey: "funding_source1",
      header: "מקור תקציב 1",
      cell: ({ row }) => {
        const fundingLabels: Record<string, string> = {
          municipality: "עיריה",
          education_ministry: "משרד החינוך",
          interior_ministry: "משרד הפנים",
          transportation_ministry: "משרד התחבורה",
          health_ministry: "משרד הבריאות",
          culture_ministry: "משרד התרבות",
          energy_ministry: "משרד האנרגיה",
          agriculture_ministry: "משרד החקלאות",
          economy_ministry: "משרד הכלכלה",
          science_technology_ministry: "משרד המדע",
          construction_housing_ministry: "משרד הבינוי",
          environmental_protection_ministry: "משרד להגנת הסביבה",
          planning_administration: "רשות התכנון",
          lottery: "מפעל הפיס",
          loan: "הלוואה",
        };
        const value = row.getValue("funding_source1") as string;
        return value ? (fundingLabels[value] || value) : "-";
      },
    },
    {
      accessorKey: "funding_source2", 
      header: "מקור תקציב 2",
      cell: ({ row }) => {
        const fundingLabels: Record<string, string> = {
          municipality: "עיריה",
          education_ministry: "משרד החינוך",
          interior_ministry: "משרד הפנים",
          transportation_ministry: "משרד התחבורה",
          health_ministry: "משרד הבריאות",
          culture_ministry: "משרד התרבות",
          energy_ministry: "משרד האנרגיה",
          agriculture_ministry: "משרד החקלאות",
          economy_ministry: "משרד הכלכלה",
          science_technology_ministry: "משרד המדע",
          construction_housing_ministry: "משרד הבינוי",
          environmental_protection_ministry: "משרד להגנת הסביבה",
          planning_administration: "רשות התכנון",
          lottery: "מפעל הפיס",
          loan: "הלוואה",
        };
        const value = row.getValue("funding_source2") as string;
        return value ? (fundingLabels[value] || value) : "-";
      },
    },
    {
      accessorKey: "funding_source3",
      header: "מקור תקציב 3", 
      cell: ({ row }) => {
        const fundingLabels: Record<string, string> = {
          municipality: "עיריה",
          education_ministry: "משרד החינוך",
          interior_ministry: "משרד הפנים",
          transportation_ministry: "משרד התחבורה",
          health_ministry: "משרד הבריאות",
          culture_ministry: "משרד התרבות",
          energy_ministry: "משרד האנרגיה",
          agriculture_ministry: "משרד החקלאות",
          economy_ministry: "משרד הכלכלה",
          science_technology_ministry: "משרד המדע",
          construction_housing_ministry: "משרד הבינוי",
          environmental_protection_ministry: "משרד להגנת הסביבה",
          planning_administration: "רשות התכנון",
          lottery: "מפעל הפיס",
          loan: "הלוואה",
        };
        const value = row.getValue("funding_source3") as string;
        return value ? (fundingLabels[value] || value) : "-";
      },
    },
    {
      accessorKey: "approved_budget",
      header: "תקציב מאושר",
      cell: ({ row }) => `₪${row.getValue<number>("approved_budget").toLocaleString()}`,
    },
    {
      accessorKey: "income_actual",
      header: "הכנסה בפועל",
      cell: ({ row }) => `₪${row.getValue<number>("income_actual").toLocaleString()}`,
    },
    {
      accessorKey: "expense_actual", 
      header: "הוצאה בפועל",
      cell: ({ row }) => `₪${row.getValue<number>("expense_actual").toLocaleString()}`,
    },
    {
      accessorKey: "surplus_deficit",
      header: "עודף/גירעון",
      cell: ({ row }) => {
        const value = row.getValue<number>("surplus_deficit");
        return (
          <span className={value >= 0 ? "text-green-600" : "text-red-600"}>
            ₪{value.toLocaleString()}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditClick(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // חישוב נתונים לתחומים
  const domainLabels: Record<string, string> = {
    education_buildings: "מבני חינוך",
    infrastructure: "תשתיות",
    parks_gardens: "גנים ופארקים",
    culture_sports: "תרבות וספורט",
    organizational: "ארגוני",
    welfare: "רווחה",
  };

  const domainColors: Record<string, string> = {
    education_buildings: "hsl(var(--chart-1))",
    infrastructure: "hsl(var(--chart-2))", 
    parks_gardens: "hsl(var(--chart-3))",
    culture_sports: "hsl(var(--chart-4))",
    organizational: "hsl(var(--chart-5))",
    welfare: "hsl(var(--primary))",
  };

  const domainStats = tabarim.reduce((acc, tabar) => {
    const domain = tabar.domain || "אחר";
    if (!acc[domain]) {
      acc[domain] = { count: 0, budget: 0 };
    }
    acc[domain].count += 1;
    acc[domain].budget += tabar.approved_budget || 0;
    return acc;
  }, {} as Record<string, { count: number; budget: number }>);

  const totalBudget = tabarim.reduce((sum, tabar) => sum + tabar.approved_budget, 0);
  const totalIncome = tabarim.reduce((sum, tabar) => sum + tabar.income_actual, 0);
  const totalExpense = tabarim.reduce((sum, tabar) => sum + tabar.expense_actual, 0);

  // מצב מיון
  const [sortBy, setSortBy] = useState<'count' | 'budget'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // מצב מיון עבור תברים בגירעון
  const [deficitSortBy, setDeficitSortBy] = useState<'amount' | 'percentage'>('amount');
  const [deficitSortOrder, setDeficitSortOrder] = useState<'asc' | 'desc'>('desc');

  // נתונים עבור הטבלה הויזואלית - מיון לפי הבחירה של המשתמש
  const domainSummaryData = Object.entries(domainStats)
    .map(([domain, stats]) => ({
      domain: domainLabels[domain] || domain,
      originalDomain: domain,
      count: stats.count,
      budget: stats.budget,
      budgetThousand: Math.round(stats.budget / 1000),
      countPercentage: tabarim.length > 0 ? Math.round((stats.count / tabarim.length) * 100) : 0,
      budgetPercentage: totalBudget > 0 ? Math.round((stats.budget / totalBudget) * 100) : 0,
      color: domainColors[domain] || "hsl(var(--muted-foreground))"
    }))
    .sort((a, b) => {
      if (sortBy === 'count') {
        return sortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      } else {
        return sortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
      }
    });

  // פונקציה לפורמט מספרים
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}`;
    }
    return amount.toLocaleString();
  };

  const getCurrencyUnit = (amount: number) => {
    if (amount >= 1000000) {
      return 'מלש"ח';
    }
    return 'אלש"ח';
  };

  // פונקציה לניווט לטבלה עם מיון לפי גירעון
  const scrollToTableWithDeficitSort = () => {
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // חישוב נתונים למקורות תקציב של תב"רים בגירעון
  const fundingLabelsForChart: Record<string, string> = {
    municipality: "עיריה",
    education_ministry: "משרד החינוך",
    interior_ministry: "משרד הפנים",
    transportation_ministry: "משרד התחבורה",
    health_ministry: "משרד הבריאות",
    culture_ministry: "משרד התרבות",
    energy_ministry: "משרד האנרגיה",
    agriculture_ministry: "משרד החקלאות",
    economy_ministry: "משרד הכלכלה",
    science_technology_ministry: "משרד המדע",
    construction_housing_ministry: "משרד הבינוי",
    environmental_protection_ministry: "משרד להגנת הסביבה",
    planning_administration: "רשות התכנון",
    lottery: "מפעל הפיס",
    loan: "הלוואה",
  };

  const fundingColors: Record<string, string> = {
    municipality: "hsl(var(--chart-1))",
    education_ministry: "hsl(var(--chart-2))",
    interior_ministry: "hsl(var(--chart-3))",
    transportation_ministry: "hsl(var(--chart-4))",
    health_ministry: "hsl(var(--chart-5))",
    culture_ministry: "hsl(var(--primary))",
    energy_ministry: "hsl(var(--chart-1))",
    agriculture_ministry: "hsl(var(--chart-2))",
    economy_ministry: "hsl(var(--chart-3))",
    science_technology_ministry: "hsl(var(--chart-4))",
    construction_housing_ministry: "hsl(var(--chart-5))",
    environmental_protection_ministry: "hsl(var(--primary))",
    planning_administration: "hsl(var(--chart-1))",
    lottery: "hsl(var(--chart-2))",
    loan: "hsl(var(--chart-3))",
  };

  // מצב מיון עבור מקורות תקציב של תב"רים בגירעון
  const [fundingSortBy, setFundingSortBy] = useState<'count' | 'budget'>('count');
  const [fundingSortOrder, setFundingSortOrder] = useState<'asc' | 'desc'>('desc');

  // פילטר תב"רים בגירעון
  const deficitTabarim = tabarim.filter(tabar => tabar.surplus_deficit < 0);

  // חישוב תחומים ייחודיים
  const uniqueDomains = useMemo(() => {
    const domains = Array.from(new Set(tabarim.map(tabar => tabar.domain).filter(Boolean)));
    return domains.map(domain => domainLabels[domain] || domain);
  }, [tabarim]);

  // חישוב מקורות תקציב ייחודיים מכל שלושת העמודות
  const uniqueFundingSources = useMemo(() => {
    const sources = new Set<string>();
    tabarim.forEach(tabar => {
      if (tabar.funding_source1) sources.add(tabar.funding_source1);
      if (tabar.funding_source2) sources.add(tabar.funding_source2);
      if (tabar.funding_source3) sources.add(tabar.funding_source3);
    });
    return Array.from(sources).map(source => fundingLabelsForChart[source] || source);
  }, [tabarim]);

  // פילטר תב"רים לפי הסינונים
  const filteredTabarim = useMemo(() => {
    return tabarim.filter(tabar => {
      // סינון לפי מאזן
      if (balanceFilter === 'deficit' && tabar.surplus_deficit >= 0) return false;
      if (balanceFilter === 'surplus' && tabar.surplus_deficit < 0) return false;
      
      // סינון לפי תחום
      if (domainFilter !== 'all') {
        const displayName = domainLabels[tabar.domain] || tabar.domain;
        if (displayName !== domainFilter) return false;
      }
      
      // סינון לפי מקור תקציב
      if (fundingSourceFilter !== 'all') {
        const hasFundingSource = [tabar.funding_source1, tabar.funding_source2, tabar.funding_source3]
          .some(source => {
            if (!source) return false;
            const displayName = fundingLabelsForChart[source] || source;
            return displayName === fundingSourceFilter;
          });
        if (!hasFundingSource) return false;
      }
      
      return true;
    });
  }, [tabarim, balanceFilter, domainFilter, fundingSourceFilter]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">טוען נתוני תברים...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">ניהול תברים</h1>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            הוסף תבר
          </Button>
          <Button variant="outline" onClick={() => setShowUploader(true)} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            העלה נתונים
          </Button>
        </div>
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-6 mt-8">
        {detectedPeriod && (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-2xl font-bold text-center text-primary">
                תקופת הנתונים: {detectedPeriod}
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">סיכום כספי</TabsTrigger>
            <TabsTrigger value="charts">גרפים ותרשימים</TabsTrigger>
            <TabsTrigger value="table">טבלת נתונים</TabsTrigger>
            <TabsTrigger value="analysis">ניתוח AI</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">סה"כ תקציב מאושר</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₪{totalBudget.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">סה"כ הכנסה בפועל</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₪{totalIncome.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">סה"כ הוצאה בפועל</CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">₪{totalExpense.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">מאזן כולל</CardTitle>
                  <Badge variant={totalIncome - totalExpense >= 0 ? "default" : "destructive"}>
                    {totalIncome - totalExpense >= 0 ? "עודף" : "גירעון"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{Math.abs(totalIncome - totalExpense).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>ביצועי תב"רים לפי תחום</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {domainSummaryData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium">{item.domain}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.count} תב"רים • {item.countPercentage}% מהכלל
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold">{formatCurrency(item.budget)} {getCurrencyUnit(item.budget)}</div>
                          <div className="text-sm text-muted-foreground">{item.budgetPercentage}% מהתקציב</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ניתוח תב"רים בגירעון</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tabarim.filter(item => item.surplus_deficit < 0).slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.tabar_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {domainLabels[item.domain] || item.domain}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-red-600 text-sm">
                            ₪{Math.abs(item.surplus_deficit).toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">גירעון</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <div ref={tableRef}>
              <DataTable
                columns={columns}
                data={filteredTabarim}
                searchableColumnIds={["tabar_name"]}
                searchPlaceholder="חיפוש תבר..."
                className="mt-4"
              />
              <div className="flex items-center gap-4 mt-4">
                <h2 className="text-2xl font-bold">רשימת תברים</h2>
                <div className="flex gap-2">
                  <Select value={balanceFilter} onValueChange={(value: string) => setBalanceFilter(value as 'all' | 'deficit' | 'surplus')}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="סינון לפי מאזן" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל התברים</SelectItem>
                      <SelectItem value="surplus">עודף</SelectItem>
                      <SelectItem value="deficit">גירעון</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={domainFilter} onValueChange={setDomainFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="סינון לפי תחום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל התחומים</SelectItem>
                      {uniqueDomains.map(domain => (
                        <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={fundingSourceFilter} onValueChange={setFundingSourceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="סינון לפי מקור תקציב" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל המקורות</SelectItem>
                      {uniqueFundingSources.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  ניתוח AI לתברים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleAnalyzeTabarim(false)}
                    disabled={isAnalyzing || analysisLoading}
                    className="flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    {isAnalyzing ? "מנתח..." : "נתח תברים"}
                  </Button>
                </div>
                
                {(analysisLoading || isAnalyzing) && (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                      <p className="text-muted-foreground">
                        {analysisLoading ? "טוען ניתוח קיים..." : "מבצע ניתוח נתונים..."}
                      </p>
                    </div>
                  </div>
                )}
                
                {analysis && !analysisLoading && (
                  <div className="border rounded-lg p-6 bg-muted/20">
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {analysis}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <AddTabarDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={handleTabarSaved}
      />

      <AddTabarDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={handleTabarSaved}
        editData={selectedTabar}
      />

      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>העלאת קובץ תברים</DialogTitle>
          </DialogHeader>
          <DataUploader
            context="tabarim"
            onUploadSuccess={handleUploadSuccess}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תבר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את התבר {selectedTabar?.tabar_name}?
              פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}