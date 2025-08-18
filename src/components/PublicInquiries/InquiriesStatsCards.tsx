import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle, AlertTriangle, Users, Phone, Mail, MessageSquare } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type PublicInquiry = Database['public']['Tables']['public_inquiries']['Row'];

export function InquiriesStatsCards() {
  const { data: inquiries = [] } = useQuery({
    queryKey: ['public-inquiries-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_inquiries')
        .select('*');
      
      if (error) throw error;
      return data as PublicInquiry[];
    },
  });

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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* כרטיסי סטטוס עיקריים */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סה"כ פניות</CardTitle>
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">בטיפול</CardTitle>
          <Clock className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="flex gap-1 mt-2">
            <Badge variant="outline" className="text-xs">חדש: {stats.new}</Badge>
            <Badge variant="outline" className="text-xs">המתנה: {stats.pending}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">טופלו</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <p className="text-xs text-muted-foreground">
            {stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% מכלל הפניות
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">דחופות</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <p className="text-xs text-muted-foreground">דורשות טיפול מיידי</p>
        </CardContent>
      </Card>

      {/* כרטיס מקורות פניה */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">מקורות פניה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(sourceStats).map(([source, count]) => (
              <div key={source} className="flex items-center gap-2">
                {getSourceIcon(source)}
                <span className="text-sm">{getSourceLabel(source)}: {count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* כרטיס סוגי פניה */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">סוגי פניה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(typeStats).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <Badge variant="outline">{getTypeLabel(type)}: {count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}