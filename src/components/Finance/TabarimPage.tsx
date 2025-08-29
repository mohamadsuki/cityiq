import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trash2, Upload, Plus, Pencil, Brain, Loader2, BarChart3 } from "lucide-react";
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

  // Debug logs
  console.log("🔍 Filters state:", { balanceFilter, domainFilter, uniqueDomains: uniqueDomains.length });

  // מטפלי אירועים לסינון מהגרפים
  const handleDomainChartClick = (domain: string) => {
    setDomainFilter(domain);
    setBalanceFilter('all');
    setFundingSourceFilter('all');
    // גלילה לטבלה
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeficitChartClick = (tabarName: string) => {
    setBalanceFilter('deficit');
    setDomainFilter('all');
    setFundingSourceFilter('all');
    // גלילה לטבלה
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFundingSourceChartClick = (fundingSource: string) => {
    setFundingSourceFilter(fundingSource);
    setBalanceFilter('deficit');
    setDomainFilter('all');
    // גלילה לטבלה
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAllFundingSourceChartClick = (fundingSource: string) => {
    setFundingSourceFilter(fundingSource);
    setBalanceFilter('all');
    setDomainFilter('all');
    // גלילה לטבלה
    tableRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // חישוב סטטיסטיקות למקורות תקציב של כל התב"רים
  const allFundingStats = tabarim.reduce((acc, tabar) => {
    // מקור תקציב 1
    if (tabar.funding_source1) {
      const source = tabar.funding_source1;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      acc[source].count += 1;
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    // מקור תקציב 2
    if (tabar.funding_source2) {
      const source = tabar.funding_source2;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      // אל תוסף לספירה (כדי לא לספור תב"ר פעמיים), רק לתקציב
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    // מקור תקציב 3
    if (tabar.funding_source3) {
      const source = tabar.funding_source3;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      // אל תוסף לספירה (כדי לא לספור תב"ר פעמיים), רק לתקציב
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    return acc;
  }, {} as Record<string, { count: number; budget: number }>);

  // חישוב סטטיסטיקות למקורות תקציב של תב"רים בגירעון
  const fundingStats = deficitTabarim.reduce((acc, tabar) => {
    // מקור תקציב 1
    if (tabar.funding_source1) {
      const source = tabar.funding_source1;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      acc[source].count += 1;
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    // מקור תקציב 2
    if (tabar.funding_source2) {
      const source = tabar.funding_source2;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      // אל תוסף לספירה (כדי לא לספור תב"ר פעמיים), רק לתקציב
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    // מקור תקציב 3
    if (tabar.funding_source3) {
      const source = tabar.funding_source3;
      if (!acc[source]) {
        acc[source] = { count: 0, budget: 0 };
      }
      // אל תוסף לספירה (כדי לא לספור תב"ר פעמיים), רק לתקציב
      acc[source].budget += tabar.approved_budget || 0;
    }
    
    return acc;
  }, {} as Record<string, { count: number; budget: number }>);

  const totalDeficitBudget = deficitTabarim.reduce((sum, tabar) => sum + tabar.approved_budget, 0);
  const totalAllBudget = tabarim.reduce((sum, tabar) => sum + tabar.approved_budget, 0);

  // נתונים עבור הגרף של כל התב"רים - עמודות צהובות
  const allFundingSummaryData = Object.entries(allFundingStats)
    .map(([source, stats]) => ({
      source: fundingLabelsForChart[source] || source,
      originalSource: source,
      count: stats.count,
      budget: stats.budget,
      budgetThousand: Math.round(stats.budget / 1000),
      countPercentage: tabarim.length > 0 ? Math.round((stats.count / tabarim.length) * 100) : 0,
      budgetPercentage: totalAllBudget > 0 ? Math.round((stats.budget / totalAllBudget) * 100) : 0,
      color: "hsl(45, 93%, 47%)" // צבע צהוב לכל העמודות
    }))
    .sort((a, b) => {
      if (fundingSortBy === 'count') {
        return fundingSortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      } else {
        return fundingSortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
      }
    })
    .slice(0, 24); // לקיחת טופ 24

  // נתונים עבור הגרף - מיון לפי הבחירה של המשתמש ולקיחת טופ 12
  const fundingSummaryData = Object.entries(fundingStats)
    .map(([source, stats]) => ({
      source: fundingLabelsForChart[source] || source,
      originalSource: source,
      count: stats.count,
      budget: stats.budget,
      budgetThousand: Math.round(stats.budget / 1000),
      countPercentage: deficitTabarim.length > 0 ? Math.round((stats.count / deficitTabarim.length) * 100) : 0,
      budgetPercentage: totalDeficitBudget > 0 ? Math.round((stats.budget / totalDeficitBudget) * 100) : 0,
      color: fundingColors[source] || "hsl(var(--muted-foreground))"
    }))
    .sort((a, b) => {
      if (fundingSortBy === 'count') {
        return fundingSortOrder === 'desc' ? b.count - a.count : a.count - b.count;
      } else {
        return fundingSortOrder === 'desc' ? b.budget - a.budget : a.budget - b.budget;
      }
    })
    .slice(0, 24); // לקיחת טופ 24

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">תב"רים</h1>
          <p className="text-muted-foreground">
            ניהול תב"רים עירוניים - הוספה, עריכה ומעקב
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUploader(true)}
          >
            <Upload className="h-4 w-4 ml-2" />
            העלה קובץ אקסל
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 ml-2" />
            הוסף תב"ר
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Summary Card - Full Width with Better Design */}
        <Card className="bg-gradient-to-l from-background to-muted/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-primary">סיכום תקציבי כללי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-background rounded-lg p-4 border shadow-sm">
                <div className="text-2xl font-bold text-primary">{tabarim.length}</div>
                <div className="text-sm text-muted-foreground">תב"רים פעילים</div>
              </div>
              <div className="bg-background rounded-lg p-4 border shadow-sm">
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalBudget)} <span className="text-[10px] text-muted-foreground opacity-70">{getCurrencyUnit(totalBudget)}</span>
                </div>
                <div className="text-sm text-muted-foreground">תקציב מאושר</div>
              </div>
              <div className="bg-background rounded-lg p-4 border shadow-sm">
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(totalIncome)} <span className="text-[10px] text-muted-foreground opacity-70">{getCurrencyUnit(totalIncome)}</span>
                </div>
                <div className="text-sm text-muted-foreground">הכנסות בפועל</div>
              </div>
              <div className="bg-background rounded-lg p-4 border shadow-sm">
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(totalExpense)} <span className="text-[10px] text-muted-foreground opacity-70">{getCurrencyUnit(totalExpense)}</span>
                </div>
                <div className="text-sm text-muted-foreground">הוצאות בפועל</div>
              </div>
              <div 
                className="bg-background rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={scrollToTableWithDeficitSort}
              >
                <div className={`text-lg font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalIncome - totalExpense)} <span className="text-[10px] text-muted-foreground opacity-70">{getCurrencyUnit(totalIncome - totalExpense)}</span>
                </div>
                <div className="text-sm text-muted-foreground">עודף/גירעון</div>
              </div>
              <div 
                className="bg-background rounded-lg p-4 border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={scrollToTableWithDeficitSort}
              >
                <div className="text-lg font-bold text-red-600">{tabarim.filter(tabar => tabar.surplus_deficit < 0).length}</div>
                <div className="text-sm text-muted-foreground">תב"רים בגירעון</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Two Cards Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">תב"רים לפי תחום</CardTitle>
                <div className="flex gap-2 text-xs">
                  <Button
                    variant={sortBy === 'count' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('count')}
                    className="h-7 text-xs"
                  >
                    לפי מספר
                  </Button>
                  <Button
                    variant={sortBy === 'budget' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('budget')}
                    className="h-7 text-xs"
                  >
                    לפי תקציב
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    className="h-7 text-xs w-7 p-0"
                  >
                    {sortOrder === 'desc' ? '↓' : '↑'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {tabarim.length > 0 ? (
                <div className="space-y-1">
                  {domainSummaryData.map((item, index) => {
                    // חישוב רוחב העמודה היחסי
                    const maxValue = Math.max(...domainSummaryData.map(d => sortBy === 'count' ? d.count : d.budget));
                    const currentValue = sortBy === 'count' ? item.count : item.budget;
                    const barWidth = (currentValue / maxValue) * 100;
                    
                    return (
                      <div 
                        key={item.originalDomain} 
                        className="flex items-center group hover:bg-accent/20 rounded-sm transition-colors duration-200 py-1 px-2 relative cursor-pointer"
                        onClick={() => handleDomainChartClick(item.domain)}
                      >
                        {/* עמודת רקע יחסית */}
                        <div 
                          className="absolute inset-0 bg-muted-foreground/20 rounded-sm transition-all duration-300 pointer-events-none"
                          style={{ width: `${barWidth}%` }}
                        />
                        
                        {/* תוכן קיים */}
                        <div className="relative z-10 flex items-center w-full">
                          {/* סוגר שמאלי צבעוני */}
                          <div className="flex items-center ml-2">
                            <div 
                              className="w-1 h-6 rounded-sm"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          
                          {/* תקציב */}
                          <div className="min-w-[85px] text-left">
                            <span className="text-sm font-medium text-muted-foreground">
                              {formatCurrency(item.budget)} <span className="text-[10px] opacity-70">{getCurrencyUnit(item.budget)}</span>
                            </span>
                          </div>
                          
                          {/* מספר תב"רים */}
                          <div className="min-w-[30px] text-left ml-4">
                            <span className="text-base font-semibold">
                              {item.count}
                            </span>
                          </div>
                          
                          {/* שם התחום */}
                          <div className="flex-1 ml-4">
                            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                              {item.domain}
                            </span>
                          </div>
                        </div>
                        
                        {/* פרטי hover */}
                        <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px]">
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>מספר תב"רים:</span>
                              <span className="font-medium">{item.count} ({item.countPercentage}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>תקציב:</span>
                              <span className="font-medium"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {item.budget.toLocaleString()} ({item.budgetPercentage}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>תקציב ממוצע לתב"ר:</span>
                              <span className="font-medium"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {Math.round(item.budget / item.count).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  אין נתונים להצגה
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">תב"רים בגירעון</CardTitle>
                <div className="flex gap-2 text-xs">
                  <span className="text-xs text-muted-foreground mr-2">טופ 12</span>
                  <Button
                    variant={deficitSortBy === 'amount' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeficitSortBy('amount')}
                    className="h-7 text-xs"
                  >
                    לפי סכום
                  </Button>
                  <Button
                    variant={deficitSortBy === 'percentage' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDeficitSortBy('percentage')}
                    className="h-7 text-xs"
                  >
                    לפי אחוז
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeficitSortOrder(deficitSortOrder === 'desc' ? 'asc' : 'desc')}
                    className="h-7 text-xs w-7 p-0"
                  >
                    {deficitSortOrder === 'desc' ? '↓' : '↑'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {tabarim.length > 0 ? (
                <div className="space-y-1">
                  {(() => {
                    const deficitTabarim = tabarim
                      .filter(tabar => tabar.surplus_deficit < 0)
                      .map(tabar => ({
                        ...tabar,
                        deficitPercentage: tabar.income_actual > 0 
                          ? Math.round(((tabar.expense_actual - tabar.income_actual) / tabar.income_actual) * 100)
                          : 0
                      }))
                      .sort((a, b) => {
                        if (deficitSortBy === 'amount') {
                          return deficitSortOrder === 'desc' 
                            ? a.surplus_deficit - b.surplus_deficit 
                            : b.surplus_deficit - a.surplus_deficit;
                        } else {
                          return deficitSortOrder === 'desc' 
                            ? b.deficitPercentage - a.deficitPercentage 
                            : a.deficitPercentage - b.deficitPercentage;
                        }
                      })
                      .slice(0, 12);

                    // חישוב הערך המקסימלי לחישוב היחס
                    const maxValue = deficitSortBy === 'amount'
                      ? Math.max(...deficitTabarim.map(t => Math.abs(t.surplus_deficit)))
                      : Math.max(...deficitTabarim.map(t => t.deficitPercentage));

                    return deficitTabarim.map((tabar, index) => {
                      // חישוב רוחב העמודה היחסי
                      const currentValue = deficitSortBy === 'amount' 
                        ? Math.abs(tabar.surplus_deficit)
                        : tabar.deficitPercentage;
                      const barWidth = maxValue > 0 ? (currentValue / maxValue) * 100 : 0;

                      return (
                        <div 
                          key={tabar.id} 
                          className="flex items-center group hover:bg-accent/20 rounded-sm transition-colors duration-200 py-1 px-2 relative cursor-pointer"
                          onClick={() => handleDeficitChartClick(tabar.tabar_name)}
                        >
                          {/* עמודת רקע יחסית */}
                          <div 
                            className="absolute inset-0 bg-red-100 rounded-sm transition-all duration-300 pointer-events-none"
                            style={{ width: `${barWidth}%` }}
                          />

                          {/* תוכן קיים */}
                          <div className="relative z-10 flex items-center w-full">
                            {/* סוגר שמאלי אדום */}
                            <div className="flex items-center ml-2">
                              <div 
                                className="w-1 h-6 rounded-sm bg-red-500"
                              />
                            </div>
                            
                            {/* גירעון */}
                            <div className="min-w-[85px] text-left">
                              <span className="text-sm font-medium text-red-600">
                                {formatCurrency(Math.abs(tabar.surplus_deficit))}- <span className="text-[10px] opacity-70">{getCurrencyUnit(Math.abs(tabar.surplus_deficit))}</span>
                              </span>
                            </div>
                            
                            {/* אחוז גירעון */}
                            <div className="min-w-[45px] text-left ml-2">
                              <span className="text-xs font-medium text-orange-600">
                                {tabar.deficitPercentage}%
                              </span>
                            </div>
                            
                            {/* שם התב"ר */}
                            <div className="flex-1 ml-4">
                              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                {tabar.tabar_name}
                              </span>
                            </div>
                          </div>
                          
                          {/* פרטי hover */}
                          <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[280px]">
                            <div className="text-xs space-y-1">
                              <div className="flex justify-between">
                                <span>מספר תב"ר:</span>
                                <span className="font-medium">{tabar.tabar_number}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>תחום:</span>
                                <span className="font-medium">{domainLabels[tabar.domain] || tabar.domain}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>תקציב מאושר:</span>
                                <span className="font-medium"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {tabar.approved_budget.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>הכנסה בפועל:</span>
                                <span className="font-medium text-green-600"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {tabar.income_actual.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>הוצאה בפועל:</span>
                                <span className="font-medium text-red-600"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {tabar.expense_actual.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-t pt-1">
                                <span>גירעון:</span>
                                <span className="font-bold text-red-600"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {tabar.surplus_deficit.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>אחוז גירעון:</span>
                                <span className="font-bold text-orange-600">{tabar.deficitPercentage}%</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 pt-1 border-t">
                                אחוז הגירעון = (הוצאה - הכנסה) / הכנסה
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  אין נתונים להצגה
                </div>
              )}
              {tabarim.filter(tabar => tabar.surplus_deficit < 0).length === 0 && tabarim.length > 0 && (
                <div className="text-center py-4 text-green-600 text-sm">
                  🎉 אין תב"רים בגירעון
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Funding Sources Chart for All Tabarim */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">מקורות תקציב של כל התב"רים</CardTitle>
              <div className="flex gap-2 text-xs">
                <span className="text-xs text-muted-foreground mr-2">טופ 24</span>
                <Button
                  variant={fundingSortBy === 'count' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFundingSortBy('count')}
                  className="h-7 text-xs"
                >
                  לפי מספר
                </Button>
                <Button
                  variant={fundingSortBy === 'budget' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFundingSortBy('budget')}
                  className="h-7 text-xs"
                >
                  לפי תקציב
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFundingSortOrder(fundingSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="h-7 text-xs w-7 p-0"
                >
                  {fundingSortOrder === 'desc' ? '↓' : '↑'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tabarim.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6">
                {allFundingSummaryData.map((item, index) => {
                  // חישוב רוחב העמודה היחסי
                  const maxValue = Math.max(...allFundingSummaryData.map(d => fundingSortBy === 'count' ? d.count : d.budget));
                  const currentValue = fundingSortBy === 'count' ? item.count : item.budget;
                  const barWidth = (currentValue / maxValue) * 100;
                  
                  return (
                    <div 
                      key={item.originalSource} 
                      className="flex items-center group hover:bg-accent/20 rounded-sm transition-colors duration-200 py-1 px-2 relative cursor-pointer"
                      onClick={() => handleAllFundingSourceChartClick(item.source)}
                    >
                       {/* עמודת רקע יחסית - צהובה */}
                       <div 
                         className="absolute inset-0 bg-yellow-100 rounded-sm transition-all duration-300 pointer-events-none"
                         style={{ width: `${barWidth}%` }}
                       />
                      
                      {/* תוכן קיים */}
                      <div className="relative z-10 flex items-center w-full">
                        {/* סוגר שמאלי צבעוני */}
                        <div className="flex items-center ml-2">
                          <div 
                            className="w-1 h-6 rounded-sm bg-yellow-500"
                          />
                        </div>
                        
                        {/* תקציב */}
                        <div className="min-w-[85px] text-left">
                          <span className="text-sm font-medium text-muted-foreground">
                            {formatCurrency(item.budget)} <span className="text-[10px] opacity-70">{getCurrencyUnit(item.budget)}</span>
                          </span>
                        </div>
                        
                        {/* מספר תב"רים */}
                        <div className="min-w-[30px] text-left ml-4">
                          <span className="text-base font-semibold">
                            {item.count}
                          </span>
                        </div>
                        
                        {/* שם המקור */}
                        <div className="flex-1 ml-4">
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {item.source}
                          </span>
                        </div>
                      </div>
                      
                      {/* פרטי hover */}
                      <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px]">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>מספר תב"רים:</span>
                            <span className="font-bold">{item.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>סכום תקציב:</span>
                            <span className="font-bold">{formatCurrency(item.budget)} ₪</span>
                          </div>
                          <div className="flex justify-between">
                            <span>אחוז מכל התב"רים:</span>
                            <span className="font-bold text-yellow-600">{item.countPercentage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>אחוז מהתקציב הכולל:</span>
                            <span className="font-bold text-yellow-600">{item.budgetPercentage}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        {/* Funding Sources Chart for Deficit Tabarim */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">מקורות תקציב של תב"רים בגירעון</CardTitle>
              <div className="flex gap-2 text-xs">
              <span className="text-xs text-muted-foreground mr-2">טופ 24</span>
                <Button
                  variant={fundingSortBy === 'count' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFundingSortBy('count')}
                  className="h-7 text-xs"
                >
                  לפי מספר
                </Button>
                <Button
                  variant={fundingSortBy === 'budget' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFundingSortBy('budget')}
                  className="h-7 text-xs"
                >
                  לפי תקציב
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFundingSortOrder(fundingSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="h-7 text-xs w-7 p-0"
                >
                  {fundingSortOrder === 'desc' ? '↓' : '↑'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {deficitTabarim.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-6">
                {fundingSummaryData.map((item, index) => {
                  // חישוב רוחב העמודה היחסי
                  const maxValue = Math.max(...fundingSummaryData.map(d => fundingSortBy === 'count' ? d.count : d.budget));
                  const currentValue = fundingSortBy === 'count' ? item.count : item.budget;
                  const barWidth = (currentValue / maxValue) * 100;
                  
                  return (
                    <div 
                      key={item.originalSource} 
                      className="flex items-center group hover:bg-accent/20 rounded-sm transition-colors duration-200 py-1 px-2 relative cursor-pointer"
                      onClick={() => handleFundingSourceChartClick(item.source)}
                    >
                       {/* עמודת רקע יחסית */}
                       <div 
                         className="absolute inset-0 bg-blue-100 rounded-sm transition-all duration-300 pointer-events-none"
                         style={{ width: `${barWidth}%` }}
                       />
                      
                      {/* תוכן קיים */}
                      <div className="relative z-10 flex items-center w-full">
                        {/* סוגר שמאלי צבעוני */}
                        <div className="flex items-center ml-2">
                          <div 
                            className="w-1 h-6 rounded-sm"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                        
                        {/* תקציב */}
                        <div className="min-w-[85px] text-left">
                          <span className="text-sm font-medium text-muted-foreground">
                            {formatCurrency(item.budget)} <span className="text-[10px] opacity-70">{getCurrencyUnit(item.budget)}</span>
                          </span>
                        </div>
                        
                        {/* מספר תב"רים */}
                        <div className="min-w-[30px] text-left ml-4">
                          <span className="text-base font-semibold">
                            {item.count}
                          </span>
                        </div>
                        
                        {/* שם המקור */}
                        <div className="flex-1 ml-4">
                          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {item.source}
                          </span>
                        </div>
                      </div>
                      
                      {/* פרטי hover */}
                      <div className="absolute left-0 top-full mt-1 bg-popover border rounded-md shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 min-w-[200px]">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>מספר תב"רים:</span>
                            <span className="font-medium">{item.count} ({item.countPercentage}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>תקציב:</span>
                            <span className="font-medium"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {item.budget.toLocaleString()} ({item.budgetPercentage}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span>תקציב ממוצע לתב"ר:</span>
                            <span className="font-medium"><span className="text-[10px] text-muted-foreground">אלש"ח</span> {item.count > 0 ? Math.round(item.budget / item.count).toLocaleString() : '0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600 text-sm">
                🎉 אין תב"רים בגירעון
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Below */}
        <Card ref={tableRef}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>רשימת תב"רים ({filteredTabarim.length})</CardTitle>
              <div className="flex gap-3 items-center">
                {/* סינון לפי מאזן */}
                <Select value={balanceFilter} onValueChange={(value: string) => setBalanceFilter(value as 'all' | 'deficit' | 'surplus')}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="סינון לפי מאזן" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">כל המאזנים</SelectItem>
                    <SelectItem value="deficit">גירעון</SelectItem>
                    <SelectItem value="surplus">עודף</SelectItem>
                  </SelectContent>
                </Select>

                {/* סינון לפי תחום */}
                <Select value={domainFilter} onValueChange={setDomainFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="סינון לפי תחום" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">כל התחומים</SelectItem>
                    {uniqueDomains.map((domain) => (
                      <SelectItem key={domain} value={domain}>
                        {domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* סינון לפי מקור תקציב */}
                <Select value={fundingSourceFilter} onValueChange={setFundingSourceFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="סינון לפי מקור תקציב" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">כל המקורות</SelectItem>
                    {uniqueFundingSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                טוען נתונים...
              </div>
            ) : filteredTabarim.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין תב"רים להצגה עם הסינונים הנבחרים
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={filteredTabarim.sort((a, b) => a.surplus_deficit - b.surplus_deficit)}
                searchableColumnIds={["tabar_name", "tabar_number"]}
                searchPlaceholder="חפש תב״ר..."
              />
            )}
          </CardContent>
        </Card>
      </div>

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

      {showUploader && (
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent dir="rtl" className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ייבוא תב"רים מקובץ אקסל</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DataUploader 
                context="tabarim"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ אקסל עם תב"רים. הקובץ צריך להכיל עמודות: מספר תב"ר, שם תב"ר, תחום, מקורות תקציב, תקציב מאושר, הכנסה בפועל, הוצאה בפועל.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תב"ר</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק תב"ר זה? פעולה זו אינה ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}