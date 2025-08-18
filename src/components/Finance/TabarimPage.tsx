import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Upload, Plus, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { DataUploader } from "@/components/shared/DataUploader";
import { ColumnDef } from "@tanstack/react-table";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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
  const { toast } = useToast();

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

  // חישוב נתונים לגרפים
  const domainLabels: Record<string, string> = {
    "תשתיות וכבישים": "תשתיות וכבישים",
    "מבני ציבור": "מבני ציבור", 
    "חינוך": "חינוך",
    "תרבות וספורט": "תרבות וספורט",
    "רווחה": "רווחה",
    "איכות הסביבה": "איכות הסביבה",
    "אחר": "אחר",
  };

  const domainColors = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7c7c", "#8dd1e1", "#d084d0", "#82d982"
  ];

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

  const chartData = Object.entries(domainStats).map(([domain, stats]) => ({
    name: domainLabels[domain] || domain,
    count: stats.count,
    budgetMillion: Math.round(stats.budget / 1000000 * 10) / 10,
    countPercentage: ((stats.count / tabarim.length) * 100),
    budgetPercentage: totalBudget > 0 ? ((stats.budget / totalBudget) * 100) : 0
  }));

  // נתונים לגרף מוערם - שורה אחת עם כל התחומים
  const stackedData = [
    {
      category: "מספר תב״רים",
      ...chartData.reduce((acc, item) => {
        acc[item.name] = item.countPercentage;
        return acc;
      }, {} as Record<string, number>)
    },
    {
      category: "תקציב",
      ...chartData.reduce((acc, item) => {
        acc[item.name] = item.budgetPercentage;
        return acc;
      }, {} as Record<string, number>)
    }
  ];

  const domains = chartData.map(item => item.name);
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#82d982'];

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
        {/* Summary Cards First */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>תב"רים לפי תחום</CardTitle>
            </CardHeader>
            <CardContent>
              {tabarim.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="horizontal"
                      data={stackedData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 80,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis 
                        type="category" 
                        dataKey="category" 
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => {
                          const item = chartData.find(d => d.name === name);
                          if (props.payload.category === "מספר תב״רים") {
                            return [
                              `${value.toFixed(1)}% (${item?.count || 0} תב"רים)`,
                              name
                            ];
                          } else {
                            return [
                              `${value.toFixed(1)}% (₪${item?.budgetMillion || 0}M)`,
                              name
                            ];
                          }
                        }}
                        labelFormatter={(label) => label}
                      />
                      <Legend />
                      {domains.map((domain, index) => (
                        <Bar 
                          key={domain}
                          dataKey={domain} 
                          stackId="a"
                          fill={colors[index % colors.length]} 
                          name={domain}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  אין נתונים להצגה
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סיכום תקציבי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>סה"כ תקציב מאושר</span>
                  <span className="font-semibold text-blue-600">₪{totalBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>סה"כ הכנסות בפועל</span>
                  <span className="font-semibold text-green-600">₪{totalIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>סה"כ הוצאות בפועל</span>
                  <span className="font-semibold text-red-600">₪{totalExpense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b font-bold">
                  <span>עודף/גירעון כולל</span>
                  <span className={`font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{(totalIncome - totalExpense).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table Below */}
        <Card>
          <CardHeader>
            <CardTitle>רשימת תב"רים ({tabarim.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                טוען נתונים...
              </div>
            ) : tabarim.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                אין תב"רים להצגה
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={tabarim}
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