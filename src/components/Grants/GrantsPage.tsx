import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Plus, Eye, Edit, Trash2, FileText, TrendingUp, CheckCircle, DollarSign } from "lucide-react";
import AddGrantDialog from "./AddGrantDialog";
import EditGrantDialog from "./EditGrantDialog";

interface Grant {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: DepartmentSlug | null;
  name: string | null;
  ministry: string | null;
  project_description: string | null;
  responsible_person: string | null;
  amount: number | null;
  submission_amount: number | null;
  approved_amount: number | null;
  support_amount: number | null;
  municipality_participation: number | null;
  status: string | null;
  submitted_at: string | null;
  decision_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
}

const deptLabels: Partial<Record<DepartmentSlug, string>> = {
  finance: "פיננסים",
  education: "חינוך", 
  engineering: "הנדסה",
  welfare: "רווחה",
  "non-formal": "חינוך בלתי פורמלי",
  business: "רישוי עסקים",
};

const statusVariant = (status: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'אושר': return 'default';
    case 'נדחה': return 'destructive';
    case 'הוגש': return 'secondary';
    case 'לא רלוונטי': return 'outline';
    default: return 'outline';
  }
};

export default function GrantsPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchGrants = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGrants(data || []);
    } catch (error) {
      console.error('Error fetching grants:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בטעינת הנתונים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleDelete = async () => {
    if (!selectedGrant) return;

    try {
      const { error } = await supabase
        .from('grants')
        .delete()
        .eq('id', selectedGrant.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקול הקורא נמחק בהצלחה",
      });

      fetchGrants();
      setDeleteDialogOpen(false);
      setSelectedGrant(null);
    } catch (error) {
      console.error('Error deleting grant:', error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה במחיקת הקול הקורא",
        variant: "destructive",
      });
    }
  };

  const handleView = (grant: Grant) => {
    setSelectedGrant(grant);
    setViewDialogOpen(true);
  };

  const handleEdit = (grant: Grant) => {
    setSelectedGrant(grant);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (grant: Grant) => {
    setSelectedGrant(grant);
    setDeleteDialogOpen(true);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = grants.length;
    const approved = grants.filter(g => g.status === 'אושר').length;
    const submitted = grants.filter(g => g.status === 'הוגש').length;
    const totalAmount = grants.reduce((sum, g) => sum + (g.amount || 0), 0);
    const approvedAmount = grants.filter(g => g.status === 'אושר').reduce((sum, g) => sum + (g.approved_amount || 0), 0);

    return {
      total,
      approved,
      submitted,
      totalAmount,
      approvedAmount,
      successRate: total > 0 ? Math.round((approved / total) * 100) : 0
    };
  }, [grants]);

  // Get unique ministries for filtering
  const ministries = useMemo(() => {
    const uniqueMinistries = new Set<string>();
    grants.forEach(grant => {
      if (grant.ministry) uniqueMinistries.add(grant.ministry);
    });
    return Array.from(uniqueMinistries).sort();
  }, [grants]);

  // Get unique departments for filtering
  const departments = useMemo(() => {
    const uniqueDepts = new Set<string>();
    grants.forEach(grant => {
      if (grant.department_slug) uniqueDepts.add(grant.department_slug);
    });
    return Array.from(uniqueDepts).sort();
  }, [grants]);

  const columns: ColumnDef<Grant>[] = [
    {
      accessorKey: "name",
      header: "שם הקול הקורא",
      cell: ({ row }) => (
        <div className="font-medium max-w-[200px] truncate">
          {row.original.name || "לא צוין"}
        </div>
      ),
    },
    {
      accessorKey: "ministry",
      header: "משרד",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate">
          {row.original.ministry || "לא צוין"}
        </div>
      ),
    },
    {
      accessorKey: "department_slug",
      header: "מחלקה",
      cell: ({ row }) => {
        const dept = row.original.department_slug;
        return dept ? deptLabels[dept] || dept : "לא צוין";
      },
    },
    {
      accessorKey: "responsible_person",
      header: "אחראי",
      cell: ({ row }) => (
        <div className="max-w-[120px] truncate">
          {row.original.responsible_person || "לא צוין"}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "תקציב קול קורא",
      cell: ({ row }) => {
        const amount = row.original.amount;
        return amount ? `₪${amount.toLocaleString('he-IL')}` : "לא צוין";
      },
    },
    {
      accessorKey: "submission_amount",
      header: "סכום הגשה",
      cell: ({ row }) => {
        const amount = row.original.submission_amount;
        return amount ? `₪${amount.toLocaleString('he-IL')}` : "לא צוין";
      },
    },
    {
      accessorKey: "approved_amount",
      header: "סכום שאושר",
      cell: ({ row }) => {
        const amount = row.original.approved_amount;
        return amount ? `₪${amount.toLocaleString('he-IL')}` : "לא צוין";
      },
    },
    {
      accessorKey: "support_amount", 
      header: "סכום תמיכה",
      cell: ({ row }) => {
        const amount = row.original.support_amount;
        return amount ? `₪${amount.toLocaleString('he-IL')}` : "לא צוין";
      },
    },
    {
      accessorKey: "municipality_participation",
      header: "השתתפות עירייה", 
      cell: ({ row }) => {
        const amount = row.original.municipality_participation;
        return amount ? `₪${amount.toLocaleString('he-IL')}` : "לא צוין";
      },
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)}>
          {row.original.status || "לא צוין"}
        </Badge>
      ),
    },
    {
      accessorKey: "submitted_at",
      header: "תאריך הגשה",
      cell: ({ row }) => {
        const date = row.original.submitted_at;
        return date ? new Date(date).toLocaleDateString('he-IL') : "לא צוין";
      },
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(row.original)}
            aria-label="צפייה"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(row.original)}
            aria-label="עריכה"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(row.original)}
            aria-label="מחיקה"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">קולות קוראים</h1>
          <p className="text-sm text-muted-foreground">ניהול קולות קוראים, מעקב אחר בקשות והחלטות</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          הוספת קול קורא
        </Button>
      </header>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ קולות קוראים</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מאושרים</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">אחוז הצלחה</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סכום מאושר</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{stats.approvedAmount.toLocaleString('he-IL')}</div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>טבלת קולות קוראים</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={grants}
            searchableColumnIds={["name", "ministry", "responsible_person"]}
            searchPlaceholder="חיפוש לפי שם, משרד או אחראי..."
            filterableColumns={{
              ministry: {
                label: "משרד",
                options: ministries.map(ministry => ({ label: ministry, value: ministry }))
              },
              department_slug: {
                label: "מחלקה",
                options: departments.map(dept => ({ 
                  label: deptLabels[dept as DepartmentSlug] || dept, 
                  value: dept 
                }))
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Add Grant Dialog */}
      <AddGrantDialog
        isOpen={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={fetchGrants}
      />

      {/* Edit Grant Dialog */}
      <EditGrantDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSuccess={fetchGrants}
        grant={selectedGrant}
      />

      {/* View Grant Dialog */}
      <AlertDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <AlertDialogContent className="max-w-2xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>פרטי קול קורא</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-right">
                {selectedGrant && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>שם:</strong> {selectedGrant.name || "לא צוין"}
                      </div>
                      <div>
                        <strong>משרד:</strong> {selectedGrant.ministry || "לא צוין"}
                      </div>
                      <div>
                        <strong>מחלקה:</strong> {selectedGrant.department_slug ? deptLabels[selectedGrant.department_slug] : "לא צוין"}
                      </div>
                      <div>
                        <strong>אחראי:</strong> {selectedGrant.responsible_person || "לא צוין"}
                      </div>
                      <div>
                        <strong>תקציב קול קורא:</strong> {selectedGrant.amount ? `₪${selectedGrant.amount.toLocaleString('he-IL')}` : "לא צוין"}
                      </div>
                      <div>
                        <strong>סכום הגשה:</strong> {selectedGrant.submission_amount ? `₪${selectedGrant.submission_amount.toLocaleString('he-IL')}` : "לא צוין"}
                      </div>
                      <div>
                        <strong>סכום שאושר:</strong> {selectedGrant.approved_amount ? `₪${selectedGrant.approved_amount.toLocaleString('he-IL')}` : "לא צוין"}
                      </div>
                      <div>
                        <strong>סטטוס:</strong> <Badge variant={statusVariant(selectedGrant.status)}>{selectedGrant.status || "לא צוין"}</Badge>
                      </div>
                      <div>
                        <strong>תאריך הגשה:</strong> {selectedGrant.submitted_at ? new Date(selectedGrant.submitted_at).toLocaleDateString('he-IL') : "לא צוין"}
                      </div>
                      <div>
                        <strong>תאריך החלטה:</strong> {selectedGrant.decision_at ? new Date(selectedGrant.decision_at).toLocaleDateString('he-IL') : "לא צוין"}
                      </div>
                    </div>
                    {selectedGrant.project_description && (
                      <div>
                        <strong>תיאור הפרויקט:</strong>
                        <p className="mt-1 text-sm">{selectedGrant.project_description}</p>
                      </div>
                    )}
                    {selectedGrant.notes && (
                      <div>
                        <strong>הערות:</strong>
                        <p className="mt-1 text-sm">{selectedGrant.notes}</p>
                      </div>
                    )}
                    {selectedGrant.rejection_reason && (
                      <div>
                        <strong>סיבת דחייה:</strong>
                        <p className="mt-1 text-sm">{selectedGrant.rejection_reason}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setViewDialogOpen(false)}>
              סגירה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הקול הקורא "{selectedGrant?.name}"?
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}