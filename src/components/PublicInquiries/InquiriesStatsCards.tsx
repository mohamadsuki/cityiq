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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* כרטיסי סטטוס עיקריים */}
      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
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

      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-amber-900 dark:text-amber-100">בטיפול</CardTitle>
          <div className="p-2 bg-amber-600 rounded-lg group-hover:scale-110 transition-transform duration-300">
            <Clock className="h-5 w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">{stats.inProgress + stats.new + stats.pending}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-800">
              חדש: {stats.new}
            </Badge>
            <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-800">
              המתנה: {stats.pending}
            </Badge>
            <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-800">
              פעיל: {stats.inProgress}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20">
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

      <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-semibold text-red-900 dark:text-red-100">דחופות</CardTitle>
          <div className="p-2 bg-red-600 rounded-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
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

      {/* כרטיס מקורות פניה */}
      <Card className="md:col-span-2 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
            מקורות פניה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(sourceStats).map(([source, count]) => (
              <div key={source} className="flex items-center gap-3 p-3 bg-white/60 dark:bg-purple-900/20 rounded-lg hover:bg-white/80 transition-colors">
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-md">
                  {getSourceIcon(source)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    {getSourceLabel(source)}
                  </div>
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-300">{count}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* כרטיס סוגי פניה */}
      <Card className="md:col-span-2 hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            סוגי פניה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(typeStats).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-3 bg-white/60 dark:bg-indigo-900/20 rounded-lg hover:bg-white/80 transition-colors">
                <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                  {getTypeLabel(type)}
                </span>
                <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}