import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { AddInquiryDialog } from "./AddInquiryDialog";
import { useAuth } from "@/context/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type PublicInquiry = Database['public']['Tables']['public_inquiries']['Row'];

export function PublicInquiriesPage() {
  const [addInquiryOpen, setAddInquiryOpen] = useState(false);
  const { user } = useAuth();

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'new': 'default',
      'in_progress': 'secondary', 
      'pending': 'outline',
      'resolved': 'secondary',
      'closed': 'destructive'
    };
    
    const labels: Record<string, string> = {
      'new': 'חדש',
      'in_progress': 'בטיפול',
      'pending': 'בהמתנה',
      'resolved': 'טופל',
      'closed': 'סגור'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
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

      <DataTable
        columns={columns}
        data={inquiries}
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
    </div>
  );
}