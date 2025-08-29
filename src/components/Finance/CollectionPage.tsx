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
  property_type: string;
  annual_budget: number;
  relative_budget: number;
  actual_collection: number;
  surplus_deficit: number;
  year: number;
  created_at: string;
  excel_cell_ref?: string;
}

interface CollectionSummary {
  propertyType: string;
  count: number;
  totalAnnualBudget: number;
  totalRelativeBudget: number;
  totalActualCollection: number;
  totalSurplusDeficit: number;
  averageCollectionRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];
const COLLECTION_RATE_COLORS = {
  excellent: '#10b981', // green-500
  good: '#3b82f6',      // blue-500 
  fair: '#f59e0b',      // amber-500
  poor: '#ef4444'       // red-500
};
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
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");

  // Generate year options (current year and 10 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({
    length: 11
  }, (_, i) => currentYear - i);
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

      // Load all data - don't consolidate, show individual records
      const { data, error } = await supabase
        .from('collection_data')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading collection data:', error);
        throw error;
      }
      
      console.log('📊 Raw collection data from database:', data);
      console.log('📊 Number of records:', data?.length || 0);

      // Convert to proper format but keep individual records
      const processedData: CollectionData[] = (data || [])
        .filter(item => {
          // Filter out completely empty records
          const hasAnyData = item.property_type || 
                           (item.annual_budget && item.annual_budget > 0) || 
                           (item.relative_budget && item.relative_budget > 0) || 
                           (item.actual_collection && item.actual_collection > 0);
          return hasAnyData;
        })
        .map(item => ({
          id: item.id,
          property_type: item.property_type || 'לא מוגדר',
          annual_budget: Number(item.annual_budget) || 0,
          relative_budget: Number(item.relative_budget) || 0,
          actual_collection: Number(item.actual_collection) || 0,
          surplus_deficit: Number(item.surplus_deficit) || 0,
          year: item.year,
          created_at: item.created_at,
          excel_cell_ref: item.excel_cell_ref
        }));

      console.log('🔧 Processed collection data:', processedData);
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
          totalAnnualBudget: 0,
          totalRelativeBudget: 0,
          totalActualCollection: 0,
          totalSurplusDeficit: 0,
          averageCollectionRate: 0
        };
      }
      
      acc[propertyType].count += 1;
      acc[propertyType].totalAnnualBudget += item.annual_budget;
      acc[propertyType].totalRelativeBudget += item.relative_budget;
      acc[propertyType].totalActualCollection += item.actual_collection;
      acc[propertyType].totalSurplusDeficit += item.surplus_deficit;
      
      return acc;
    }, {} as Record<string, CollectionSummary>);

    // Calculate average collection rates
    Object.values(grouped).forEach(summary => {
      if (summary.totalRelativeBudget > 0) {
        summary.averageCollectionRate = (summary.totalActualCollection / summary.totalRelativeBudget) * 100;
      }
    });

    return Object.values(grouped);
  };

  // Filter data based on search and filters
  useEffect(() => {
    let filtered = collectionData;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Property type filter
    if (selectedPropertyType !== "all") {
      filtered = filtered.filter(item => {
        const standardizedType = PROPERTY_TYPE_LABELS[item.property_type] || item.property_type;
        return standardizedType === selectedPropertyType;
      });
    }

    // Amount range filter
    if (minAmount) {
      const min = parseFloat(minAmount);
      filtered = filtered.filter(item => item.actual_collection >= min);
    }
    if (maxAmount) {
      const max = parseFloat(maxAmount);
      filtered = filtered.filter(item => item.actual_collection <= max);
    }

    setFilteredData(filtered);
  }, [collectionData, searchTerm, selectedPropertyType, minAmount, maxAmount]);
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
      const totalAnnualBudget = collectionData.reduce((sum, item) => sum + (item.annual_budget || 0), 0);
      const totalRelativeBudget = collectionData.reduce((sum, item) => sum + (item.relative_budget || 0), 0);
      const totalActualCollection = collectionData.reduce((sum, item) => sum + (item.actual_collection || 0), 0);
      const totalSurplusDeficit = collectionData.reduce((sum, item) => sum + (item.surplus_deficit || 0), 0);
      
      const { data, error } = await supabase.functions.invoke('analyze-collection', {
        body: {
          collectionData: collectionData,
          totalAnnualBudget,
          totalRelativeBudget,
          totalActualCollection,
          totalSurplusDeficit
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

  // Table columns
  const columns: ColumnDef<CollectionData>[] = [{
    accessorKey: "property_type",
    header: "סוג נכס",
    cell: ({
      row
    }) => PROPERTY_TYPE_LABELS[row.getValue("property_type") as string] || row.getValue("property_type")
  }, {
    accessorKey: "annual_budget",
    header: "תקציב שנתי ארנונה",
    cell: ({
      row
    }) => formatCurrency(row.getValue("annual_budget"))
  }, {
    accessorKey: "relative_budget",
    header: "תקציב יחסי ארנונה",
    cell: ({
      row
    }) => formatCurrency(row.getValue("relative_budget"))
  }, {
    accessorKey: "actual_collection",
    header: "גביה בפועל",
    cell: ({
      row
    }) => formatCurrency(row.getValue("actual_collection"))
  }, {
    accessorKey: "surplus_deficit",
    header: "עודף/גירעון",
    cell: ({
      row
    }) => {
      const surplusDeficit = row.getValue<number>("surplus_deficit") || 0;
      return <span className={surplusDeficit >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(surplusDeficit)}
          </span>;
    }
  }];

  // Prepare pie chart data by grouping by property type
  const groupDataByPropertyType = (data: CollectionData[], valueField: keyof CollectionData) => {
    const grouped: Record<string, number> = {};
    data.forEach(item => {
      const propertyType = PROPERTY_TYPE_LABELS[item.property_type] || item.property_type || 'לא מוגדר';
      const value = Number(item[valueField]) || 0;
      if (grouped[propertyType]) {
        grouped[propertyType] += value;
      } else {
        grouped[propertyType] = value;
      }
    });
    return Object.entries(grouped).filter(([_, value]) => value > 0).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  };
  const annualBudgetChartData = groupDataByPropertyType(collectionData, 'annual_budget');
  const relativeBudgetChartData = groupDataByPropertyType(collectionData, 'relative_budget');
  const actualCollectionChartData = groupDataByPropertyType(collectionData, 'actual_collection');

  // Calculate totals from grouped data
  const totalAnnualBudget = annualBudgetChartData.reduce((sum, item) => sum + item.value, 0);
  const totalRelativeBudget = relativeBudgetChartData.reduce((sum, item) => sum + item.value, 0);
  const totalActualCollection = actualCollectionChartData.reduce((sum, item) => sum + item.value, 0);
  const totalSurplusDeficit = totalActualCollection - totalRelativeBudget;
  const renderCustomTooltip = (props: any) => {
    if (props.active && props.payload && props.payload.length) {
      return <div className="bg-background p-2 border rounded shadow">
          <p className="font-medium">{props.payload[0].name}</p>
          <p className="text-primary">
            {formatCurrency(props.payload[0].value)}
          </p>
        </div>;
    }
    return null;
  };
  return <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">גביה</h1>
          <p className="text-muted-foreground">ניהול נתוני גביה מקובץ "טיוטת מאזן RAW"</p>
          {collectionData.length > 0 && (
            <div className="mt-2 text-sm text-green-600">
              {collectionData.length.toLocaleString('he-IL')} רשומות בטבלה
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
                העלה קובץ "טיוטת מאזן RAW" עם נתוני הגביה (עמודות D-I, L, M).
                הקובץ צריך להכיל נתונים לפי סוגי נכסים: מגורים, מסחר, תעשיה, משרדים ואחר.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="detailed">נתונים מפורטים</TabsTrigger>
          <TabsTrigger value="analytics">ניתוח ומגמות</TabsTrigger>
          <TabsTrigger value="ai-insights">תובנות AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Year Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Label htmlFor="year-select">שנה:</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedYear.toString()} onValueChange={value => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="בחר שנה" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(year => <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="end-year-select">עד שנה (אופציונלי):</Label>
                  <Select value={selectedEndYear?.toString() || "none"} onValueChange={value => setSelectedEndYear(value === "none" ? null : parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="בחר שנת סיום" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ללא</SelectItem>
                      {yearOptions.filter(year => year !== selectedYear).map(year => <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selectedEndYear && <Button variant="outline" size="sm" onClick={() => setSelectedEndYear(null)}>
                    איפוס טווח
                  </Button>}
                
                <div className="text-sm text-muted-foreground">
                  {selectedEndYear && selectedEndYear !== selectedYear ? `מציג נתונים לשנים ${Math.min(selectedYear, selectedEndYear)}-${Math.max(selectedYear, selectedEndYear)}` : `מציג נתונים לשנת ${selectedYear}`}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">סה"כ תקציב שנתי</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalAnnualBudget)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ממוצע לרשומה: {formatCurrency(collectionData.length > 0 ? totalAnnualBudget / collectionData.length : 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">סה"כ תקציב יחסי</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(totalRelativeBudget)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ממוצע לרשומה: {formatCurrency(collectionData.length > 0 ? totalRelativeBudget / collectionData.length : 0)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">סה"כ גביה בפועל</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalActualCollection)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  אחוז גביה: {totalRelativeBudget > 0 ? ((totalActualCollection / totalRelativeBudget) * 100).toFixed(1) : 0}%
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">עודף/גירעון כולל</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalSurplusDeficit)}
                </div>
                <div className="flex items-center mt-1">
                  {totalSurplusDeficit >= 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" /> : 
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  }
                  <p className="text-xs text-muted-foreground">
                    {totalSurplusDeficit >= 0 ? 'עודף' : 'גירעון'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary by Property Type */}
          <Card>
            <CardHeader>
              <CardTitle>סיכום לפי סוג נכס</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right p-2">סוג נכס</th>
                      <th className="text-right p-2">מספר רשומות</th>
                      <th className="text-right p-2">תקציב שנתי</th>
                      <th className="text-right p-2">תקציב יחסי</th>
                      <th className="text-right p-2">גביה בפועל</th>
                      <th className="text-right p-2">אחוז גביה</th>
                      <th className="text-right p-2">עודף/גירעון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((summary, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{summary.propertyType}</td>
                        <td className="p-2">{summary.count.toLocaleString('he-IL')}</td>
                        <td className="p-2">{formatCurrency(summary.totalAnnualBudget)}</td>
                        <td className="p-2">{formatCurrency(summary.totalRelativeBudget)}</td>
                        <td className="p-2">{formatCurrency(summary.totalActualCollection)}</td>
                        <td className="p-2">
                          <span className={`font-medium ${
                            summary.averageCollectionRate >= 90 ? 'text-green-600' : 
                            summary.averageCollectionRate >= 70 ? 'text-blue-600' : 
                            summary.averageCollectionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {summary.averageCollectionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={summary.totalSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(summary.totalSurplusDeficit)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pie Charts */}
          {collectionData.length > 0 && <div className="grid md:grid-cols-3 gap-6">
              {/* Annual Budget Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>תקציב שנתי ארנונה לפי סיווגים</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    סה"כ: {formatCurrency(totalAnnualBudget)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={annualBudgetChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                          {annualBudgetChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Relative Budget Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>תקציב יחסי ארנונה לפי סיווגים</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    סה"כ: {formatCurrency(totalRelativeBudget)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={relativeBudgetChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                          {relativeBudgetChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Actual Collection Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>גביה בפועל לפי סיווגים</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    סה"כ: {formatCurrency(totalActualCollection)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={actualCollectionChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value">
                          {actualCollectionChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={renderCustomTooltip} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                פילטרים וחיפוש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">חיפוש:</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="חפש לפי סוג נכס או ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="property-type">סוג נכס:</Label>
                  <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר סוג נכס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסוגים</SelectItem>
                      {Array.from(new Set(summaryData.map(s => s.propertyType))).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min-amount">סכום מינימלי:</Label>
                  <Input
                    id="min-amount"
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-amount">סכום מקסימלי:</Label>
                  <Input
                    id="max-amount"
                    type="number"
                    placeholder="ללא הגבלה"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
              </div>
              
              {(searchTerm || selectedPropertyType !== "all" || minAmount || maxAmount) && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    מציג {filteredData.length.toLocaleString('he-IL')} מתוך {collectionData.length.toLocaleString('he-IL')} רשומות
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedPropertyType("all");
                      setMinAmount("");
                      setMaxAmount("");
                    }}
                  >
                    נקה פילטרים
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>טבלת נתוני גביה מפורטת</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    ייצא לאקסל
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    תצוגה מפורטת
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? 
                <div className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  טוען נתונים...
                </div> : 
                filteredData.length === 0 ? 
                <div className="text-center py-8 text-muted-foreground">
                  {collectionData.length === 0 ? 
                    "אין נתוני גביה להצגה. יש לייבא קובץ \"טיוטת מאזן RAW\"." :
                    "אין רשומות המתאימות לפילטרים שנבחרו."
                  }
                </div> : 
                <DataTable 
                  columns={columns} 
                  data={filteredData} 
                  searchableColumnIds={["property_type"]} 
                  searchPlaceholder="חפש סוג נכס..." 
                />
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Collection Rate Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>ניתוח שיעורי גביה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summaryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="propertyType" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Bar dataKey="averageCollectionRate" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Trends (placeholder for future development) */}
          <Card>
            <CardHeader>
              <CardTitle>מגמות לאורך זמן</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="mb-2">בפיתוח</p>
                <p className="text-sm">בקרוב יתווספו גרפי מגמות והשוואות בין שנים</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          {/* AI Analysis Section */}
          <Card className="border border-border/50 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-foreground">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                ניתוח AI מתקדם - נתוני גביה
                {reportingPeriod && (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {reportingPeriod}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    ניתוח מבוסס בינה מלאכותית של נתוני הגביה
                  </span>
                </div>
                <Button
                  onClick={() => handleAnalyzeCollection()}
                  disabled={isAnalyzing || collectionData.length === 0}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      מנתח...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      נתח נתוני גביה
                    </>
                  )}
                </Button>
              </div>

              {analysisLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="mr-2 text-muted-foreground">טוען ניתוח קיים...</span>
                </div>
              )}

              {analysis && (
                <div className="mt-6 p-6 bg-secondary/30 rounded-lg border border-border/30">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {analysis}
                    </div>
                  </div>
                </div>
              )}

              {!analysis && !analysisLoading && !isAnalyzing && collectionData.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>לחץ על "נתח נתוני גביה" לקבלת ניתוח מתקדם</p>
                </div>
              )}

              {!analysis && !analysisLoading && !isAnalyzing && collectionData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>העלה נתוני גביה כדי לקבל ניתוח מתקדם</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Income Section (In Development) */}
          <Card>
            <CardHeader>
              <CardTitle>הכנסות אחרות שלא מארנונה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">בפיתוח</p>
                <p className="text-sm">בקרוב יתווספו נתונים על הכנסות נוספות מלבד ארנונה</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>;
}