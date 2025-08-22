import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataUploader } from "@/components/shared/DataUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileCheck, AlertCircle, Clock, CheckCircle, DollarSign, Upload } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from "@/hooks/use-toast";

// נתונים לדוגמה - בעתיד יבואו מהדאטאבייס
const mockAuthorizations = [
  {
    id: "1",
    authorizationNumber: "הר-2024-001",
    ministry: "משרד החינוך",
    program: "תוכנית חינוך מיוחד",
    amount: 150000,
    status: "approved",
    submittedAt: "2024-01-15",
    approvedAt: "2024-02-01",
    validUntil: "2024-12-31",
    purpose: "הקמת כיתות חינוך מיוחד"
  },
  {
    id: "2", 
    authorizationNumber: "הר-2024-002",
    ministry: "משרד הרווחה",
    program: "תמיכה בקשישים",
    amount: 85000,
    status: "pending",
    submittedAt: "2024-02-10",
    approvedAt: null,
    validUntil: "2024-11-30",
    purpose: "שירותי תמיכה לאוכלוסיית קשישים"
  },
  {
    id: "3",
    authorizationNumber: "הר-2024-003", 
    ministry: "משרד הפנים",
    program: "פיתוח תשתיות",
    amount: 320000,
    status: "in_review",
    submittedAt: "2024-03-05",
    approvedAt: null,
    validUntil: "2025-03-31",
    purpose: "שיפור תשתיות עירוניות"
  }
];

const statusLabels = {
  pending: { label: "ממתין לאישור", color: "bg-yellow-500", icon: Clock },
  in_review: { label: "בבדיקה", color: "bg-blue-500", icon: AlertCircle },
  approved: { label: "אושר", color: "bg-green-500", icon: CheckCircle },
  rejected: { label: "נדחה", color: "bg-red-500", icon: AlertCircle }
};

export default function BudgetAuthorizationsPage() {
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  const fetchAuthorizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('🔍 Fetched authorizations:', data);
      setAuthorizations(data || []);
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      setAuthorizations([]);
    } finally {
      setLoading(false);
    }
  };

  const updateAuthorizationStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('budget_authorizations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setAuthorizations(prev => 
        prev.map(auth => 
          auth.id === id ? { ...auth, status: newStatus } : auth
        )
      );

      toast({
        title: "הצלחה",
        description: "הסטטוס עודכן בהצלחה",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הסטטוס",
        variant: "destructive",
      });
    }
  };

  const handleUploadSuccess = () => {
    setShowUploader(false);
    fetchAuthorizations();
    toast({
      title: "הצלחה",
      description: "הקובץ הועלה בהצלחה והנתונים נשמרו",
    });
  };

  useEffect(() => {
    fetchAuthorizations();
  }, []);

  const columns = [
    {
      accessorKey: "authorization_number",
      header: "מספר הרשאה",
      enableSorting: true
    },
    {
      accessorKey: "ministry",
      header: "משרד מממן",
      enableSorting: true
    },
    {
      accessorKey: "program",
      header: "תיאור ההרשאה",
      enableSorting: true
    },
    {
      accessorKey: "purpose",
      header: "מס' תב\"ר",
      enableSorting: true
    },
    {
      accessorKey: "amount",
      header: "סכום ההרשאה (₪)",
      enableSorting: true,
      cell: ({ getValue }: any) => new Intl.NumberFormat('he-IL').format(getValue() || 0)
    },
    {
      accessorKey: "valid_until",
      header: "תוקף ההרשאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value ? new Date(value).toLocaleDateString('he-IL') : '-';
      }
    },
    {
      accessorKey: "department_slug",
      header: "מחלקה מטפלת",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        const deptMap: Record<string, string> = {
          'finance': 'כספים',
          'engineering': 'הנדסה',
          'education': 'חינוך',
          'welfare': 'רווחה',
          'non-formal': 'תרבות'
        };
        return deptMap[value] || value || '-';
      }
    },
    {
      accessorKey: "approved_at", 
      header: "תאריך אישור מליאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return value ? new Date(value).toLocaleDateString('he-IL') : '-';
      }
    },
    {
      accessorKey: "notes",
      header: "הערות",
      cell: ({ getValue }: any) => getValue() || '-'
    },
    {
      accessorKey: "status",
      header: "סטטוס",
      cell: ({ getValue, row }: any) => {
        const status = getValue();
        const statusInfo = statusLabels[status as keyof typeof statusLabels] || statusLabels.pending;
        const Icon = statusInfo?.icon || AlertCircle;
        
        return (
          <Select
            value={status || 'pending'}
            onValueChange={(newStatus) => updateAuthorizationStatus(row.original.id, newStatus)}
          >
            <SelectTrigger className="w-auto min-w-[120px] h-8">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                <span className="text-xs">{statusInfo?.label || status}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">ממתין לאישור</SelectItem>
              <SelectItem value="in_review">בבדיקה</SelectItem>
              <SelectItem value="approved">אושר</SelectItem>
              <SelectItem value="rejected">נדחה</SelectItem>
            </SelectContent>
          </Select>
        );
      }
    }
  ];

  const handleExport = () => {
    console.log(`Exporting authorizations`);
  };

  // סטטיסטיקות מהירות
  const stats = {
    total: authorizations.length,
    approved: authorizations.filter(a => a.status === 'approved').length,
    pending: authorizations.filter(a => a.status === 'pending').length,
    totalAmount: authorizations.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.amount, 0)
  };

  // נתוני גרפים
  const statusData = [
    { name: 'מאושרות', value: stats.approved, color: '#22c55e', icon: '✓' },
    { name: 'ממתינות', value: stats.pending, color: '#f59e0b', icon: '⏳' },
    { name: 'בבדיקה', value: authorizations.filter(a => a.status === 'in_review').length, color: '#3b82f6', icon: '👁️' },
    { name: 'נדחו', value: authorizations.filter(a => a.status === 'rejected').length, color: '#ef4444', icon: '✗' }
  ].filter(item => item.value > 0);

  const ministryData = authorizations.reduce((acc: any[], auth) => {
    const existing = acc.find(item => item.ministry === auth.ministry);
    if (existing) {
      existing.count += 1;
      existing.amount += auth.amount || 0;
    } else {
      acc.push({
        ministry: auth.ministry || 'לא צוין',
        count: 1,
        amount: auth.amount || 0
      });
    }
    return acc;
  }, []).slice(0, 6);

  // צבעים לגרף משרדים
  const ministryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">הרשאות תקציביות</h1>
          <p className="text-muted-foreground">ניהול הרשאות תקציביות ממשלתיות ותמיכות</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowUploader(true)}
          >
            <Upload className="h-4 w-4 ml-2" />
            העלה קובץ אקסל
          </Button>
          <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
            <Plus className="h-4 w-4 mr-2" />
            הרשאה חדשה
          </Button>
        </div>
      </div>

      {/* כרטיסי סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">סה"כ הרשאות</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">מאושרות</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/30 dark:to-yellow-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">ממתינות</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">סכום מאושר</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₪{new Intl.NumberFormat('he-IL').format(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* גרפים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      `${value} הרשאות`,
                      name
                    ]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי משרדים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ministryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="ministry" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'count' ? `${value} הרשאות` : `₪${new Intl.NumberFormat('he-IL').format(value as number)}`,
                      name === 'count' ? 'מספר הרשאות' : 'סכום כולל'
                    ]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#3b82f6"
                    name="count"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* טבלת הרשאות */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">רשימת הרשאות תקציביות</CardTitle>
          <ExportButtons data={authorizations} />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DataTable
              data={authorizations}
              columns={columns}
            />
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {showUploader && (
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent dir="rtl" className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ייבוא הרשאות תקציביות מקובץ אקסל</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <DataUploader 
                context="budget_authorizations"
                onUploadSuccess={handleUploadSuccess}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                העלה קובץ אקסל עם הרשאות תקציביות. הקובץ צריך להכיל עמודות: מספר הרשאה, משרד מממן, תיאור ההרשאה, סכום ההרשאה, תוקף ההרשאה.
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}