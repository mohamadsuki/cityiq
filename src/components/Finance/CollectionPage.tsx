import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSpreadsheet, Upload } from "lucide-react";
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "₪0";
    }
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  const loadCollectionData = async () => {
    try {
      setLoading(true);
      
      // Build query - filter by current year and order by property type
      let query = supabase
        .from('collection_data')
        .select('*')
        .eq('year', new Date().getFullYear())
        .order('property_type');

      // Add user filter if user is logged in
      if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log('Loaded collection data:', data);
      
      // Convert to proper format and clean up property types
      const processedData: CollectionData[] = (data || []).map(item => ({
        id: item.id,
        property_type: item.property_type || 'לא מוגדר',
        annual_budget: Number(item.annual_budget) || 0,
        relative_budget: Number(item.relative_budget) || 0,
        actual_collection: Number(item.actual_collection) || 0,
        year: item.year,
        created_at: item.created_at
      }));

      setCollectionData(processedData);
    } catch (error) {
      console.error('Error loading collection data:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את נתוני הגביה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollectionData();
  }, []);

  const handleUploadSuccess = () => {
    setImportDialogOpen(false);
    loadCollectionData();
    toast({
      title: "הצלחה",
      description: "נתוני הגביה עודכנו בהצלחה",
    });
  };

  // Table columns
  const columns: ColumnDef<CollectionData>[] = [
    {
      accessorKey: "property_type",
      header: "סוג נכס",
      cell: ({ row }) => PROPERTY_TYPE_LABELS[row.getValue("property_type") as string] || row.getValue("property_type"),
    },
    {
      accessorKey: "annual_budget",
      header: "תקציב שנתי ארנונה (עמודה H)",
      cell: ({ row }) => formatCurrency(row.getValue("annual_budget")),
    },
    {
      accessorKey: "relative_budget",
      header: "תקציב יחסי ארנונה (עמודה I)",
      cell: ({ row }) => formatCurrency(row.getValue("relative_budget")),
    },
    {
      accessorKey: "actual_collection",
      header: "גביה בפועל (עמודה M)",
      cell: ({ row }) => formatCurrency(row.getValue("actual_collection")),
    },
    {
      accessorKey: "surplus_deficit",
      header: "עודף/גירעון",
      cell: ({ row }) => {
        const actual = row.getValue<number>("actual_collection") || 0;
        const relative = row.getValue<number>("relative_budget") || 0;
        const diff = actual - relative;
        return (
          <span className={diff >= 0 ? "text-green-600" : "text-red-600"}>
            {formatCurrency(diff)}
          </span>
        );
      },
    },
  ];

  // Prepare pie chart data
  const annualBudgetChartData = collectionData.map((item, index) => ({
    name: PROPERTY_TYPE_LABELS[item.property_type] || item.property_type,
    value: item.annual_budget || 0,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  const relativeBudgetChartData = collectionData.map((item, index) => ({
    name: PROPERTY_TYPE_LABELS[item.property_type] || item.property_type,
    value: item.relative_budget || 0,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  const actualCollectionChartData = collectionData.map((item, index) => ({
    name: PROPERTY_TYPE_LABELS[item.property_type] || item.property_type,
    value: item.actual_collection || 0,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  // Calculate totals
  const totalAnnualBudget = collectionData.reduce((sum, item) => sum + (item.annual_budget || 0), 0);
  const totalRelativeBudget = collectionData.reduce((sum, item) => sum + (item.relative_budget || 0), 0);
  const totalActualCollection = collectionData.reduce((sum, item) => sum + (item.actual_collection || 0), 0);
  const totalSurplusDeficit = totalActualCollection - totalRelativeBudget;

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
          <p className="text-muted-foreground">
            ניהול נתוני גביה מקובץ "טיוטת מאזן RAW" - עמודות D-I, L, M
          </p>
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
              <DataUploader
                context="collection"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ "טיוטת מאזן RAW" עם נתוני הגביה (עמודות D-I, L, M).
                הקובץ צריך להכיל נתונים לפי סוגי נכסים: מגורים, מסחר, תעשיה, משרדים ואחר.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
          <CardTitle>טבלת נתוני גביה מעמודות D-I, L, M</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              טוען נתונים...
            </div>
          ) : collectionData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין נתוני גביה להצגה. יש לייבא קובץ "טיוטת מאזן RAW".
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={collectionData}
              searchableColumnIds={["property_type"]}
              searchPlaceholder="חפש סוג נכס..."
            />
          )}
        </CardContent>
      </Card>

      {/* Pie Charts */}
      {collectionData.length > 0 && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Annual Budget Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>תקציב שנתי ארנונה לפי סיווגים (עמודה H)</CardTitle>
              <p className="text-sm text-muted-foreground">
                סה"כ: {formatCurrency(totalAnnualBudget)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={annualBudgetChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {annualBudgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
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
              <CardTitle>תקציב יחסי ארנונה לפי סיווגים (עמודה I)</CardTitle>
              <p className="text-sm text-muted-foreground">
                סה"כ: {formatCurrency(totalRelativeBudget)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={relativeBudgetChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {relativeBudgetChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
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
              <CardTitle>גביה בפועל לפי סיווגים (עמודה M)</CardTitle>
              <p className="text-sm text-muted-foreground">
                סה"כ: {formatCurrency(totalActualCollection)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actualCollectionChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {actualCollectionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={renderCustomTooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
    </div>
  );
}
