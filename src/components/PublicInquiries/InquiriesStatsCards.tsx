import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle, AlertTriangle, Users, Phone, Mail, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PublicInquiry = Database['public']['Tables']['public_inquiries']['Row'];

interface InquiriesStatsCardsProps {
  onCardClick?: (filterType: 'status' | 'priority', value: string | string[]) => void;
  statusFilter?: string[];
  priorityFilter?: string[];
  onFilterChange?: (statusFilters: string[], priorityFilters: string[]) => void;
}

export function InquiriesStatsCards({ 
  onCardClick, 
  statusFilter = [], 
  priorityFilter = [] 
}: InquiriesStatsCardsProps) {
  const { data: inquiries = [], refetch } = useQuery({
    queryKey: ['public-inquiries-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_inquiries')
        .select('*');
      
      if (error) throw error;
      return data as PublicInquiry[];
    },
  });

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('public-inquiries-stats-channel')
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

  // חישוב סטטיסטיקות
  const stats = {
    total: inquiries.length,
    inProgress: inquiries.filter(i => i.status === 'in_progress').length,
    resolved: inquiries.filter(i => i.status === 'resolved').length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    new: inquiries.filter(i => i.status === 'new').length,
    urgent: inquiries.filter(i => i.priority === 'urgent').length,
  };

  // סטטיסטיקות לפי מקור
  const sourceStats = inquiries.reduce((acc, inquiry) => {
    acc[inquiry.source] = (acc[inquiry.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // סטטיסטיקות לפי סוג פניה
  const typeStats = inquiries.reduce((acc, inquiry) => {
    acc[inquiry.inquiry_type] = (acc[inquiry.inquiry_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <Users className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'complaint': 'תלונות',
      'request': 'בקשות',
      'information': 'בקשות מידע',
      'suggestion': 'הצעות',
      'other': 'אחר'
    };
    return labels[type] || type;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* כרטיסי סטטוס עיקריים */}
      <Card 
        className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 cursor-pointer"
        onClick={() => onCardClick?.('status', [])}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-blue-900 dark:text-blue-100">סה"כ פניות</CardTitle>
          <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">{stats.total}</div>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">כלל הפניות במערכת</p>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 cursor-pointer"
        onClick={() => onCardClick?.('status', ['new', 'in_progress', 'pending'])}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">בטיפול</CardTitle>
          <div className="p-2 bg-amber-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Clock className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">{stats.inProgress + stats.new + stats.pending}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge 
              variant="outline" 
              className="text-xs bg-amber-100 border-amber-300 text-amber-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('status', 'new');
              }}
            >
              חדש: {stats.new}
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs bg-amber-100 border-amber-300 text-amber-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('status', 'pending');
              }}
            >
              המתנה: {stats.pending}
            </Badge>
            <Badge 
              variant="outline" 
              className="text-xs bg-amber-100 border-amber-300 text-amber-800 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.('status', 'in_progress');
              }}
            >
              פעיל: {stats.inProgress}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 cursor-pointer"
        onClick={() => onCardClick?.('status', 'resolved')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">טופלו בהצלחה</CardTitle>
          <div className="p-2 bg-emerald-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">{stats.resolved}</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-emerald-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
            <span className="text-xs font-medium text-emerald-700">
              {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 cursor-pointer"
        onClick={() => onCardClick?.('priority', 'urgent')}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">דחופות</CardTitle>
          <div className="p-2 bg-red-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-800 dark:text-red-200">{stats.urgent}</div>
          <p className="text-xs text-red-600 dark:text-red-300 mt-1">דורשות טיפול מיידי</p>
          {stats.urgent > 0 && (
            <div className="mt-2 px-2 py-1 bg-red-100 rounded text-xs text-red-800 font-medium">
              ⚠️ נדרש מעקב צמוד
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}