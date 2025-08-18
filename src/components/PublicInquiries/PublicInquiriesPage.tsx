import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Phone, Mail, MessageCircle, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/shared/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import AddInquiryDialog from "./AddInquiryDialog";
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

interface PublicInquiry {
  id: string;
  inquiry_number: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  inquiry_type: string;
  source: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  department_slug?: string;
  response?: string;
  internal_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export default function PublicInquiriesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [inquiries, setInquiries] = useState<PublicInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<PublicInquiry | null>(null);
  const { toast } = useToast();

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('public_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error loading inquiries:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את רשימת הפניות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleInquirySaved = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    loadInquiries();
  };

  const handleEditClick = (inquiry: PublicInquiry) => {
    setSelectedInquiry(inquiry);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (inquiry: PublicInquiry) => {
    setSelectedInquiry(inquiry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedInquiry) return;

    try {
      const { error } = await supabase
        .from('public_inquiries')
        .delete()
        .eq('id', selectedInquiry.id);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הפניה נמחקה בהצלחה",
      });

      loadInquiries();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הפניה",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedInquiry(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLabels: Record<string, string> = {
      new: "חדש",
      in_progress: "בטיפול",
      waiting_approval: "ממתין לאישור",
      resolved: "נפתר",
      closed: "סגור",
    };

    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      waiting_approval: "bg-orange-100 text-orange-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityLabels: Record<string, string> = {
      low: "נמוך",
      medium: "בינוני",
      high: "גבוה",
      urgent: "דחוף",
    };

    const priorityColors: Record<string, string> = {
      low: "bg-gray-100 text-gray-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={priorityColors[priority] || "bg-gray-100 text-gray-800"}>
        {priorityLabels[priority] || priority}
      </Badge>
    );
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'phone':
        return <Phone className="h-4 w-4 text-purple-600" />;
      case 'in_person':
        return <User className="h-4 w-4 text-gray-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const columns: ColumnDef<PublicInquiry>[] = [
    {
      accessorKey: "inquiry_number",
      header: "מספר פניה",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("inquiry_number")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "שם הפונה",
    },
    {
      accessorKey: "phone",
      header: "טלפון",
      cell: ({ row }) => row.getValue("phone") || "-",
    },
    {
      accessorKey: "inquiry_type",
      header: "סוג פניה",
      cell: ({ row }) => {
        const typeLabels: Record<string, string> = {
          complaint: "תלונה",
          request: "בקשה",
          information: "מידע",
          licensing: "רישוי",
          maintenance: "תחזוקה",
          other: "אחר",
        };
        return typeLabels[row.getValue("inquiry_type") as string] || row.getValue("inquiry_type");
      },
    },
    {
      accessorKey: "source",
      header: "מקור הפניה",
      cell: ({ row }) => {
        const source = row.getValue("source") as string;
        const sourceLabels: Record<string, string> = {
          whatsapp: "וואטסאפ",
          email: "אימייל",
          phone: "טלפון",
          in_person: "פנים אל פנים",
          website: "אתר",
          social_media: "רשתות חברתיות",
        };
        return (
          <div className="flex items-center gap-2">
            {getSourceIcon(source)}
            <span>{sourceLabels[source] || source}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "נושא",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue("subject")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "priority",
      header: "עדיפות",
      cell: ({ row }) => getPriorityBadge(row.getValue("priority")),
    },
    {
      accessorKey: "created_at",
      header: "תאריך יצירה",
      cell: ({ row }) => new Date(row.getValue("created_at")).toLocaleDateString('he-IL'),
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

  // Statistics
  const totalInquiries = inquiries.length;
  const newInquiries = inquiries.filter(i => i.status === 'new').length;
  const inProgressInquiries = inquiries.filter(i => i.status === 'in_progress').length;
  const resolvedInquiries = inquiries.filter(i => i.status === 'resolved').length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">פניות ציבור</h1>
          <p className="text-muted-foreground">
            ניהול פניות ציבור - קבלה, מעקב וטיפול
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף פניה חדשה
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{totalInquiries}</div>
            <p className="text-sm text-muted-foreground">סה"כ פניות</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{newInquiries}</div>
            <p className="text-sm text-muted-foreground">פניות חדשות</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{inProgressInquiries}</div>
            <p className="text-sm text-muted-foreground">בטיפול</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{resolvedInquiries}</div>
            <p className="text-sm text-muted-foreground">נפתרו</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת פניות ({totalInquiries})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              טוען נתונים...
            </div>
          ) : inquiries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              אין פניות להצגה
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={inquiries}
              searchableColumnIds={["name", "subject", "inquiry_number"]}
              searchPlaceholder="חפש פניה..."
            />
          )}
        </CardContent>
      </Card>

      <AddInquiryDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={handleInquirySaved}
      />

      <AddInquiryDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={handleInquirySaved}
        editData={selectedInquiry}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת פניה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק פניה זו? פעולה זו אינה ניתנת לביטול.
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