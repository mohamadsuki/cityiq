import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Upload, Calendar, Brain, Loader2, BarChart3, TrendingUp, TrendingDown, Filter, Search, Download, Eye } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { DataUploader } from "@/components/shared/DataUploader";
import { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "@/context/AuthContext";

interface CollectionData {
  id: string;
  property_type: string; // סוג נכס
  property_description: string; // תאור סוג נכס
  source_year: number; // שנת מקור
  service_description: string; // תאור סוג שרות
  payer_id: string; // משלם
  payer_name: string; // שם משלם
  total_debt: number; // סהכ חובה
  cash: number; // מזומן
  interest: number; // ריבית
  indexation: number; // הצמדה
  nominal_balance: number; // יתרה נומינלית
  real_balance: number; // יתרה ראלית
  collection_percentage: number; // אחוז גביה
  year: number;
  created_at: string;
  excel_cell_ref?: string;
}

interface CollectionSummary {
  propertyType: string;
  count: number;
  totalDebt: number;
  totalCash: number;
  totalInterest: number;
  totalIndexation: number;
  totalNominalBalance: number;
  totalRealBalance: number;
  averageCollectionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  'מגורים': 'מגורים',
  'מסחר': 'מסחר', 
  'תעשיה': 'תעשיה',
  'משרדים': 'משרדים',
  'אחר': 'אחר',
  'residential': 'מגורים',
  'commercial': 'מסחר',
  'industrial': 'תעשיה',
  'office': 'משרדים',
  'other': 'אחר'
};

export default function CollectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [filteredData, setFilteredData] = useState<CollectionData[]>([]);
  const [summaryData, setSummaryData] = useState<CollectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEndYear, setSelectedEndYear] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("all");
  const [selectedServiceType, setSelectedServiceType] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  // Generate year options (current year and 10 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting to load collection data...');

      // Load ALL data without limits - show all 30,000+ records
      const { data, error } = await supabase
        .from('collection_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading collection data:', error);
        throw error;
      }
      
      console.log('📊 Raw collection data from database:', data);
      console.log('📊 Number of records loaded:', data?.length || 0);

      // Process all records - keep individual payer records
      const processedData: CollectionData[] = (data || [])
        .filter(item => {
          // Keep all records with any meaningful data
          const hasValidData = item.property_type && item.property_type.trim() !== '';
          return hasValidData;
        })
        .map(item => ({
          id: item.id,
          property_type: item.property_type || 'לא מוגדר',
          property_description: item.property_description || '',
          source_year: Number(item.source_year) || new Date().getFullYear(),
          service_description: item.service_description || '',
          payer_id: item.payer_id || '',
          payer_name: item.payer_name || '',
          total_debt: Number(item.total_debt) || 0,
          cash: Number(item.cash) || 0,
          interest: Number(item.interest) || 0,
          indexation: Number(item.indexation) || 0,
          nominal_balance: Number(item.nominal_balance) || 0,
          real_balance: Number(item.real_balance) || 0,
          collection_percentage: Number(item.collection_percentage) || 0,
          year: item.year,
          created_at: item.created_at,
          excel_cell_ref: item.excel_cell_ref
        }));

      console.log('🔧 Processed collection data:', processedData);
      console.log('🔧 Total records after processing:', processedData.length);
      setCollectionData(processedData);
      
      // Generate summary data by property type
      const summary = generateSummaryData(processedData);
      setSummaryData(summary);
      
    } catch (error) {
      console.error('💥 Error in loadCollectionData:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את נתוני הגביה",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryData = (data: CollectionData[]): CollectionSummary[] => {
    const grouped = data.reduce((acc, item) => {
      const propertyType = PROPERTY_TYPE_LABELS[item.property_type] || item.property_type;
      
      if (!acc[propertyType]) {
        acc[propertyType] = {
          propertyType,
          count: 0,
          totalDebt: 0,
          totalCash: 0,
          totalInterest: 0,
          totalIndexation: 0,
          totalNominalBalance: 0,
          totalRealBalance: 0,
          averageCollectionRate: 0
        };
      }
      
      acc[propertyType].count += 1;
      acc[propertyType].totalDebt += item.total_debt;
      acc[propertyType].totalCash += item.cash;
      acc[propertyType].totalInterest += item.interest;
      acc[propertyType].totalIndexation += item.indexation;
      acc[propertyType].totalNominalBalance += item.nominal_balance;
      acc[propertyType].totalRealBalance += item.real_balance;
      
      return acc;
    }, {} as Record<string, CollectionSummary>);

    // Calculate average collection rates
    Object.values(grouped).forEach(summary => {
      if (summary.count > 0) {
        const totalCollectionPercentage = data
          .filter(item => (PROPERTY_TYPE_LABELS[item.property_type] || item.property_type) === summary.propertyType)
          .reduce((sum, item) => sum + item.collection_percentage, 0);
        summary.averageCollectionRate = totalCollectionPercentage / summary.count;
      }
    });

    return Object.values(grouped);
  };

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = collectionData;

    // Search filter - search in property type and payer info
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.service_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.excel_cell_ref && item.excel_cell_ref.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Property type filter (service type)
    if (selectedPropertyType !== "all") {
      filtered = filtered.filter(item => {
        const standardizedType = PROPERTY_TYPE_LABELS[item.property_type] || item.property_type;
        return standardizedType === selectedPropertyType;
      });
    }

    // Service type filter (additional filter for service descriptions)
    if (selectedServiceType !== "all") {
      filtered = filtered.filter(item => 
        item.service_description.toLowerCase().includes(selectedServiceType.toLowerCase())
      );
    }

    // Amount range filter (debt amount)
    if (minAmount) {
      const min = parseFloat(minAmount);
      filtered = filtered.filter(item => item.total_debt >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filtered = filtered.filter(item => item.total_debt <= max);
    }

    setFilteredData(filtered);
  }, [collectionData, searchTerm, selectedPropertyType, selectedServiceType, minAmount, maxAmount]);

  useEffect(() => {
    loadCollectionData();
  }, [selectedYear, selectedEndYear]);

  // Load saved analysis when collection data is loaded
  useEffect(() => {
    if (collectionData.length > 0 && user && !analysis) {
      loadSavedAnalysis();
    }
  }, [collectionData, user]);

  const loadSavedAnalysis = async () => {
    if (!user) return;
    
    setAnalysisLoading(true);
    try {
      const { data, error } = await supabase
        .from('tabarim_analysis')
        .select('analysis_text, created_at')
        .eq('user_id', user.id)
        .eq('year', new Date().getFullYear())
        .eq('analysis_type', 'collection')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        setAnalysis(data.analysis_text);
        console.log('Loaded saved collection analysis from:', data.created_at);
      } else if (collectionData.length > 0) {
        // If no saved analysis, generate new one automatically
        console.log('No saved collection analysis found, generating new one...');
        handleAnalyzeCollection(true); // silent generation
      }
    } catch (error) {
      console.error('Error loading saved collection analysis:', error);
      // Try to generate new analysis
      if (collectionData.length > 0) {
        handleAnalyzeCollection(true);
      }
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAnalyzeCollection = async (silent = false) => {
    if (!collectionData || collectionData.length === 0) {
      if (!silent) toast({
        title: "שגיאה",
        description: "אין נתוני גביה לניתוח",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      if (!silent) toast({
        title: "שגיאה",
        description: "יש להתחבר כדי לבצע ניתוח",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    console.log('🚀 Starting collection analysis...');
    
    try {
      const totalDebt = collectionData.reduce((sum, item) => sum + (item.total_debt || 0), 0);
      const totalCash = collectionData.reduce((sum, item) => sum + (item.cash || 0), 0);
      const totalInterest = collectionData.reduce((sum, item) => sum + (item.interest || 0), 0);
      const totalIndexation = collectionData.reduce((sum, item) => sum + (item.indexation || 0), 0);
      const totalNominalBalance = collectionData.reduce((sum, item) => sum + (item.nominal_balance || 0), 0);
      const totalRealBalance = collectionData.reduce((sum, item) => sum + (item.real_balance || 0), 0);
      
      const { data, error } = await supabase.functions.invoke('analyze-collection', {
        body: {
          collectionData: collectionData,
          totalDebt,
          totalCash,
          totalInterest,
          totalIndexation,
          totalNominalBalance,
          totalRealBalance
        }
      });

      if (error) {
        console.error("Error analyzing collection:", error);
        if (!silent) toast({
          title: "שגיאה",
          description: `שגיאה בניתוח הגביה: ${error.message || 'שגיאה לא ידועה'}`,
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
        if (data.reportingPeriod) {
          setReportingPeriod(data.reportingPeriod);
        }
        if (!silent) toast({
          title: "הצלחה",
          description: "ניתוח הגביה הושלם בהצלחה",
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
        description: `שגיאה בניתוח הגביה: ${error.message || 'שגיאה לא ידועה'}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUploadSuccess = () => {
    setImportDialogOpen(false);
    loadCollectionData();
    toast({
      title: "הצלחה",
      description: "נתוני הגביה עודכנו בהצלחה"
    });
  };

  // Table columns - specific columns as requested
  const columns: ColumnDef<CollectionData>[] = [
    {
      accessorKey: "property_type",
      header: "סוג נכס",
      cell: ({ row }) => PROPERTY_TYPE_LABELS[row.getValue("property_type") as string] || row.getValue("property_type")
    },
    {
      accessorKey: "property_description", 
      header: "תאור סוג נכס",
      cell: ({ row }) => row.getValue("property_description") || "-"
    },
    {
      accessorKey: "source_year",
      header: "שנת מקור", 
      cell: ({ row }) => row.getValue("source_year")
    },
    {
      accessorKey: "service_description",
      header: "תאור סוג שרות",
      cell: ({ row }) => row.getValue("service_description") || "-"
    },
    {
      accessorKey: "payer_id",
      header: "משלם",
      cell: ({ row }) => row.getValue("payer_id") || "-"
    },
    {
      accessorKey: "payer_name", 
      header: "שם משלם",
      cell: ({ row }) => row.getValue("payer_name") || "-"
    },
    {
      accessorKey: "total_debt",
      header: "סהכ חובה",
      cell: ({ row }) => {
        const debt = row.getValue<number>("total_debt") || 0;
        return (
          <span className={debt > 0 ? "text-red-600 font-medium" : "text-green-600"}>
            {formatCurrency(debt)}
          </span>
        );
      }
    },
    {
      accessorKey: "cash",
      header: "מזומן",
      cell: ({ row }) => formatCurrency(row.getValue("cash"))
    },
    {
      accessorKey: "interest",
      header: "ריבית", 
      cell: ({ row }) => formatCurrency(row.getValue("interest"))
    },
    {
      accessorKey: "indexation",
      header: "הצמדה",
      cell: ({ row }) => formatCurrency(row.getValue("indexation"))
    },
    {
      accessorKey: "nominal_balance",
      header: "יתרה נומינלית",
      cell: ({ row }) => formatCurrency(row.getValue("nominal_balance"))
    },
    {
      accessorKey: "real_balance", 
      header: "יתרה ראלית",
      cell: ({ row }) => formatCurrency(row.getValue("real_balance"))
    },
    {
      accessorKey: "collection_percentage",
      header: "אחוז גביה",
      cell: ({ row }) => {
        const percentage = row.getValue<number>("collection_percentage") || 0;
        return `${percentage.toFixed(1)}%`;
      }
    }
  ];

  // Prepare chart data by grouping by property type  
  const groupDataByPropertyType = (data: CollectionData[], valueField: 'totalDebt' | 'totalCash' | 'totalNominalBalance' | 'totalRealBalance') => {
    const grouped: Record<string, number> = {};
    summaryData.forEach(summary => {
      const value = Number(summary[valueField]) || 0;
      if (value > 0) {
        grouped[summary.propertyType] = value;
      }
    });
    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };

  const debtChartData = groupDataByPropertyType(collectionData, 'totalDebt');
  const cashChartData = groupDataByPropertyType(collectionData, 'totalCash'); 
  const nominalBalanceChartData = groupDataByPropertyType(collectionData, 'totalNominalBalance');
  const realBalanceChartData = groupDataByPropertyType(collectionData, 'totalRealBalance');

  // Calculate totals from summary data
  const totalDebt = summaryData.reduce((sum, item) => sum + item.totalDebt, 0);
  const totalCash = summaryData.reduce((sum, item) => sum + item.totalCash, 0);
  const totalNominalBalance = summaryData.reduce((sum, item) => sum + item.totalNominalBalance, 0);
  const totalRealBalance = summaryData.reduce((sum, item) => sum + item.totalRealBalance, 0);

  const renderCustomTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      return (
        <div className="bg-background p-2 border rounded shadow">
          <p className="font-medium">{props.payload[0].name}</p>
          <p className="text-primary">
            {formatCurrency(props.payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">גביה</h1>
          <p className="text-muted-foreground">ניהול נתוני גביה לפי משלמים אינדיבידואליים</p>
          {collectionData.length > 0 && (
            <div className="mt-2 text-sm text-green-600">
              {collectionData.length.toLocaleString('he-IL')} רשומות משלמים בטבלה
            </div>
          )}
        </div>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 ml-2" />
              ייבוא מאקסל
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl" className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ייבוא נתוני גביה מטיוטת מאזן RAW</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DataUploader context="collection" onUploadSuccess={handleUploadSuccess} />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ "טיוטת מאזן RAW" עם נתוני הגביה לפי משלמים.
                הקובץ צריך להכיל נתונים לפי סוגי שירותים ותיאורים.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="detailed">נתונים מפורטים</TabsTrigger>
          <TabsTrigger value="ai-insights">ניתוח AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">סה"כ רשומות</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collectionData.length.toLocaleString('he-IL')}</div>
                <p className="text-xs text-muted-foreground">משלמים בבסיס הנתונים</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">תקציב שנתי</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalCash)}</div>
                <p className="text-xs text-muted-foreground">סה"כ מזומן</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">יתרה נומינלית</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalNominalBalance)}</div>
                <p className="text-xs text-muted-foreground">סה"כ יתרה נומינלית</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">סה"כ חובות</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalDebt)}
                </div>
                <p className="text-xs text-muted-foreground">חוב כולל</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>התפלגות סוגי שירותים</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summaryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {summaryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>חובות לפי סוג שירות</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="propertyType" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'סה"כ חובות']} />
                      <Bar dataKey="totalDebt" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                סינון וחיפוש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="חיפוש לפי סוג שירות או מזהה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="סנן לפי סוג שירות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל סוגי השירותים</SelectItem>
                      {Object.values(PROPERTY_TYPE_LABELS).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="תיאור סוג שירות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל התיאורים</SelectItem>
                      {Array.from(new Set(collectionData.map(item => item.service_description)))
                        .filter(desc => desc && desc.trim() !== '')
                        .slice(0, 20)
                        .map(desc => (
                          <SelectItem key={desc} value={desc}>{desc}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="חוב מינימלי"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-32"
                    type="number"
                  />
                  <Input
                    placeholder="חוב מקסימלי"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-32"
                    type="number"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  מציג {filteredData.length.toLocaleString('he-IL')} מתוך {collectionData.length.toLocaleString('he-IL')} רשומות משלמים
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>נתוני גביה מפורטים</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin ml-2" />
                  <span>טוען נתונים...</span>
                </div>
              ) : (
                <DataTable
                  columns={columns}
                  data={filteredData}
                  searchPlaceholder="חיפוש בנתוני גביה..."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ניתוח AI מתקדם - גביה
                <Button
                  onClick={() => handleAnalyzeCollection()}
                  disabled={isAnalyzing || collectionData.length === 0}
                  size="sm"
                  className="mr-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-1" />
                      מנתח...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 ml-1" />
                      נתח מחדש
                    </>
                  )}
                </Button>
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                ניתוח מתקדם של נתוני הגביה באמצעות בינה מלאכותית - זיהוי מגמות, השוואות ותובנות
              </div>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin ml-2" />
                  <span>טוען ניתוח קיים...</span>
                </div>
              ) : analysis ? (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="prose prose-sm max-w-none" dir="rtl">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {analysis}
                      </div>
                    </div>
                  </div>
                  {reportingPeriod && (
                    <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
                      <strong>תקופת דיווח:</strong> {reportingPeriod}
                    </div>
                  )}
                  
                  {/* Key Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{collectionData.length.toLocaleString('he-IL')}</div>
                          <div className="text-sm text-muted-foreground">רשומות משלמים</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(totalDebt)}
                          </div>
                          <div className="text-sm text-muted-foreground">סה"כ חובות</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {summaryData.length}
                          </div>
                          <div className="text-sm text-muted-foreground">סוגי שירותים</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    לא קיים ניתוח AI עבור נתוני הגביה
                  </p>
                  <Button
                    onClick={() => handleAnalyzeCollection()}
                    disabled={isAnalyzing || collectionData.length === 0}
                  >
                    <Brain className="h-4 w-4 ml-2" />
                    צור ניתוח חדש
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
