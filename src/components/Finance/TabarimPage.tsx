import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import AddTabarDialog from "./AddTabarDialog";

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
  status: string;
  created_at: string;
}

export default function TabarimPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [tabarim, setTabarim] = useState<Tabar[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTabarim = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tabarim')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
    loadTabarim(); // רענון הרשימה
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
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => {
        const statusLabels: Record<string, string> = {
          planning: "תכנון",
          approved: "מאושר", 
          active: "פעיל",
          completed: "הושלם",
          cancelled: "בוטל",
        };
        return statusLabels[row.getValue("status") as string] || row.getValue("status");
      },
    },
  ];

  // חישוב נתונים לגרפים
  const domainStats = tabarim.reduce((acc, tabar) => {
    acc[tabar.domain] = (acc[tabar.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusStats = tabarim.reduce((acc, tabar) => {
    acc[tabar.status] = (acc[tabar.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalBudget = tabarim.reduce((sum, tabar) => sum + tabar.approved_budget, 0);
  const totalIncome = tabarim.reduce((sum, tabar) => sum + tabar.income_actual, 0);
  const totalExpense = tabarim.reduce((sum, tabar) => sum + tabar.expense_actual, 0);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">תב"רים</h1>
          <p className="text-muted-foreground">
            ניהול תב"רים עירוניים - הוספה, עריכה ומעקב סטטוס
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף תב"ר
        </Button>
      </div>

      <div className="grid gap-6">
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

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>תב"רים לפי תחום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(domainStats).map(([domain, count]) => {
                  const domainLabels: Record<string, string> = {
                    education_buildings: "מבני חינוך",
                    infrastructure: "תשתיות", 
                    parks_gardens: "גנים ופארקים",
                    culture_sports: "תרבות וספורט",
                    organizational: "ארגוני",
                    welfare: "רווחה",
                  };
                  return (
                    <div key={domain} className="flex justify-between items-center py-2 border-b">
                      <span>{domainLabels[domain] || domain}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תב"רים לפי סטטוס</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(statusStats).map(([status, count]) => {
                  const statusLabels: Record<string, string> = {
                    planning: "תכנון",
                    approved: "מאושר",
                    active: "פעיל", 
                    completed: "הושלם",
                    cancelled: "בוטל",
                  };
                  return (
                    <div key={status} className="flex justify-between items-center py-2 border-b">
                      <span>{statusLabels[status] || status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  );
                })}
              </div>
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
      </div>

      <AddTabarDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={handleTabarSaved}
      />
    </div>
  );
}