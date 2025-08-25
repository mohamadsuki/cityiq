import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileSpreadsheet, Upload, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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
}
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
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
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedEndYear, setSelectedEndYear] = useState<number | null>(null);

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

      // Load all data without any filtering for now
      const { data, error } = await supabase
        .from('collection_data')
        .select('*')
        .order('property_type');

      if (error) {
        console.error('❌ Error loading collection data:', error);
        throw error;
      }
      
      console.log('📊 Raw collection data from database:', data);
      console.log('📊 Number of records:', data?.length || 0);

      // Convert to proper format and clean up property types
      const processedData: CollectionData[] = (data || [])
        .filter(item => {
          // Filter out empty records (records with no property type and all values are 0)
          const hasPropertyType = item.property_type && item.property_type.trim() !== '';
          const hasValues = (item.annual_budget > 0 || item.relative_budget > 0 || item.actual_collection > 0);
          const isValid = hasPropertyType || hasValues;
          
          if (!isValid) {
            console.log('🚫 Filtering out empty record:', item);
          }
          return isValid;
        })
        .map(item => {
          console.log('🔧 Processing valid item:', item);
          return {
            id: item.id,
            property_type: item.property_type || 'לא מוגדר',
            annual_budget: Number(item.annual_budget) || 0,
            relative_budget: Number(item.relative_budget) || 0,
            actual_collection: Number(item.actual_collection) || 0,
            surplus_deficit: Number(item.surplus_deficit) || 0,
            year: item.year,
            created_at: item.created_at
          };
        });

      console.log('🔧 Processed collection data (after filtering):', processedData);

      // Consolidate duplicate property types by summing their values
      const consolidatedData: Record<string, CollectionData> = {};
      processedData.forEach(item => {
        const standardizedType = PROPERTY_TYPE_LABELS[item.property_type] || item.property_type;
        console.log(`🏠 Processing property type: ${item.property_type} -> ${standardizedType}`);
        
        if (consolidatedData[standardizedType]) {
          // Merge with existing entry
          consolidatedData[standardizedType].annual_budget += item.annual_budget;
          consolidatedData[standardizedType].relative_budget += item.relative_budget;
          consolidatedData[standardizedType].actual_collection += item.actual_collection;
          consolidatedData[standardizedType].surplus_deficit += item.surplus_deficit;
          console.log(`➕ Merged with existing ${standardizedType}`);
        } else {
          // Create new entry
          consolidatedData[standardizedType] = {
            ...item,
            property_type: standardizedType
          };
          console.log(`✨ Created new entry for ${standardizedType}`);
        }
      });
      
      const finalData = Object.values(consolidatedData);
      console.log('✅ Final consolidated collection data:', finalData);
      console.log('✅ Final data length:', finalData.length);
      
      setCollectionData(finalData);
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
  useEffect(() => {
    loadCollectionData();
  }, [selectedYear, selectedEndYear]);
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
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>טבלת נתוני גביה</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="text-center py-8 text-muted-foreground">
              טוען נתונים...
            </div> : collectionData.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              אין נתוני גביה להצגה. יש לייבא קובץ "טיוטת מאזן RAW".
            </div> : <DataTable columns={columns} data={collectionData} searchableColumnIds={["property_type"]} searchPlaceholder="חפש סוג נכס..." />}
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
    </div>;
}