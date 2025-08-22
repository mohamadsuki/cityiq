import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Filter, X } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { AddInquiryDialog } from "./AddInquiryDialog";
import { EditInquiryDialog } from "./EditInquiryDialog";
import { InquiriesStatsCards } from "./InquiriesStatsCards";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
import type { Database } from "@/integrations/supabase/types";

type PublicInquiry = Database['public']['Tables']['public_inquiries']['Row'];

export function PublicInquiriesPage() {
  const [addInquiryOpen, setAddInquiryOpen] = useState(false);
  const [editInquiryOpen, setEditInquiryOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<PublicInquiry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<PublicInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: inquiries = [], isLoading, refetch } = useQuery({
    queryKey: ['public-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PublicInquiry[];
    },
    enabled: !!user,
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('public-inquiries-table-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_inquiries'
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleEdit = (inquiry: PublicInquiry) => {
    setSelectedInquiry(inquiry);
    setEditInquiryOpen(true);
  };

  const handleDelete = (inquiry: PublicInquiry) => {
    setInquiryToDelete(inquiry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!inquiryToDelete) return;

    try {
      const { error } = await supabase
        .from('public_inquiries')
        .delete()
        .eq('id', inquiryToDelete.id);

      if (error) throw error;

      toast({
        title: "הפניה נמחקה בהצלחה",
        description: "הפניה הוסרה מהמערכת",
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה במחיקת הפניה",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setInquiryToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'new': 'default',
      'in_progress': 'secondary', 
      'pending': 'outline',
      'resolved': 'default', // שינוי לירוק
      'closed': 'destructive'
    };
    
    const colors: Record<string, string> = {
      'resolved': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
    };
    
    const labels: Record<string, string> = {
      'new': 'חדש',
      'in_progress': 'בטיפול',
      'pending': 'בהמתנה',
      'resolved': 'טופל',
      'closed': 'סגור'
    };

    const customClass = colors[status] || '';
    return (
      <Badge 
        variant={variants[status]} 
        className={customClass}
      >
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'low': 'outline',
      'medium': 'default',
      'high': 'secondary',
      'urgent': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'low': 'נמוכה',
      'medium': 'בינונית', 
      'high': 'גבוהה',
      'urgent': 'דחוף'
    };

    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      'whatsapp': 'ווטסאפ',
      'email': 'אימייל',
      'phone': 'טלפון',
      'in_person': 'פניה ישירה',
      'website': 'אתר',
      'other': 'אחר'
    };
    return labels[source] || source;
  };

  const getInquiryTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'complaint': 'תלונה',
      'request': 'בקשה',
      'information': 'בקשת מידע',
      'suggestion': 'הצעה',
      'other': 'אחר'
    };
    return labels[type] || type;
  };

  const getDomainLabel = (domain: string) => {
    const labels: Record<string, string> = {
      'cleaning_environment': 'ניקיון וסביבה',
      'animals': 'בעלי חיים',
      'infrastructure_hazards': 'תשתיות ומפגעים',
      'security': 'ביטחון',
      'other': 'אחר'
    };
    return labels[domain] || domain || "—";
  };

  // Filter inquiries based on filters
  const filteredInquiries = inquiries.filter(inquiry => {
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(inquiry.status);
    const priorityMatch = priorityFilter.length === 0 || priorityFilter.includes(inquiry.priority);
    return statusMatch && priorityMatch;
  });

  const handleCardClick = (filterType: 'status' | 'priority', value: string | string[]) => {
    if (filterType === 'status') {
      if (Array.isArray(value)) {
        setStatusFilter(value);
      } else {
        setStatusFilter([value]);
      }
    } else if (filterType === 'priority') {
      if (Array.isArray(value)) {
        setPriorityFilter(value);
      } else {
        setPriorityFilter([value]);
      }
    }
  };

  const columns = [
    {
      accessorKey: "inquiry_number",
      header: "מספר פניה",
    },
    {
      accessorKey: "name",
      header: "שם פונה",
    },
    {
      accessorKey: "subject", 
      header: "נושא",
    },
    {
      accessorKey: "domain",
      header: "תחום",
      cell: ({ row }: any) => getDomainLabel(row.getValue("domain")),
    },
    {
      accessorKey: "inquiry_type",
      header: "סוג פניה",
      cell: ({ row }: any) => getInquiryTypeLabel(row.getValue("inquiry_type")),
    },
    {
      accessorKey: "source",
      header: "מקור פניה",
      cell: ({ row }: any) => getSourceLabel(row.getValue("source")),
    },
    {
      accessorKey: "priority",
      header: "עדיפות",
      cell: ({ row }: any) => getPriorityBadge(row.getValue("priority")),
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ row }: any) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "created_at",
      header: "תאריך יצירה",
      cell: ({ row }: any) => {
        const date = new Date(row.getValue("created_at"));
        return date.toLocaleDateString('he-IL');
      },
    },
    {
      accessorKey: "assigned_handler",
      header: "גורם מטפל",
      cell: ({ row }) => {
        const assignedHandler = row.getValue("assigned_handler") as string;
        const assignedAt = (row.original as any).assigned_at;
        
        if (!assignedHandler) {
          return <span className="text-muted-foreground">לא הועבר</span>;
        }
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{assignedHandler}</span>
            {assignedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(assignedAt).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "פעולות",
      cell: ({ row }: any) => {
        const inquiry = row.original;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(inquiry)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(inquiry)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">פניות ציבור</h1>
          <p className="text-muted-foreground mt-2">
            ניהול פניות ציבור ממקורות שונים
          </p>
        </div>
        <Button onClick={() => setAddInquiryOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          פניה חדשה
        </Button>
      </div>

      {/* כרטיסיות סטטיסטיקה */}
      <InquiriesStatsCards 
        onCardClick={handleCardClick}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onFilterChange={(statusFilters, priorityFilters) => {
          setStatusFilter(statusFilters);
          setPriorityFilter(priorityFilters);
        }}
      />

      {/* פילטרים פעילים */}
      {(statusFilter.length > 0 || priorityFilter.length > 0) && (
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">פילטרים פעילים:</span>
            </div>
            {statusFilter.map(status => (
              <Badge key={`status-${status}`} variant="secondary" className="flex items-center gap-1">
                סטטוס: {status}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setStatusFilter(prev => prev.filter(s => s !== status))}
                />
              </Badge>
            ))}
            {priorityFilter.map(priority => (
              <Badge key={`priority-${priority}`} variant="secondary" className="flex items-center gap-1">
                עדיפות: {priority}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setPriorityFilter(prev => prev.filter(p => p !== priority))}
                />
              </Badge>
            ))}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setStatusFilter([]);
                setPriorityFilter([]);
              }}
            >
              נקה הכל
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={filteredInquiries}
        searchableColumnIds={["inquiry_number", "name", "subject"]}
        searchPlaceholder="חיפוש לפי מספר, שם או נושא..."
      />

      <AddInquiryDialog 
        open={addInquiryOpen}
        onOpenChange={setAddInquiryOpen}
        onSuccess={() => {
          refetch();
          setAddInquiryOpen(false);
        }}
      />

      <EditInquiryDialog
        open={editInquiryOpen}
        onOpenChange={setEditInquiryOpen}
        inquiry={selectedInquiry}
        onSuccess={() => {
          refetch();
          setEditInquiryOpen(false);
          setSelectedInquiry(null);
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את הפניה לצמיתות. לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>מחק</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}