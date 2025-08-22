import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataUploader } from "@/components/shared/DataUploader";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileCheck, AlertCircle, Clock, CheckCircle } from "lucide-react";

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

  const fetchAuthorizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAuthorizations(data || []);
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      // Fallback to mock data if DB fails
      setAuthorizations(mockAuthorizations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizations();
  }, []);

  const columns = [
    {
      key: "authorizationNumber" as keyof typeof mockAuthorizations[0],
      header: "מספר הרשאה",
      sortable: true
    },
    {
      key: "ministry" as keyof typeof mockAuthorizations[0],
      header: "משרד",
      sortable: true
    },
    {
      key: "program" as keyof typeof mockAuthorizations[0],
      header: "תוכנית",
      sortable: true
    },
    {
      key: "amount" as keyof typeof mockAuthorizations[0],
      header: "סכום (₪)",
      sortable: true,
      render: (value: any) => new Intl.NumberFormat('he-IL').format(value)
    },
    {
      key: "status" as keyof typeof mockAuthorizations[0],
      header: "סטטוס",
      render: (status: string) => {
        const statusInfo = statusLabels[status as keyof typeof statusLabels];
        const Icon = statusInfo?.icon || AlertCircle;
        return (
          <Badge className={`${statusInfo?.color} text-white`}>
            <Icon className="h-3 w-3 mr-1" />
            {statusInfo?.label || status}
          </Badge>
        );
      }
    },
    {
      key: "submittedAt" as keyof typeof mockAuthorizations[0],
      header: "תאריך הגשה",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('he-IL')
    },
    {
      key: "validUntil" as keyof typeof mockAuthorizations[0],
      header: "תוקף עד",
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString('he-IL')
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">הרשאות תקציביות</h1>
          <p className="text-muted-foreground">ניהול הרשאות תקציביות ממשלתיות ותמיכות</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4 mr-2" />
          הרשאה חדשה
        </Button>
      </div>

      {/* Data Uploader */}
      <DataUploader context="budget_authorizations" onUploadSuccess={() => fetchAuthorizations()} />

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
            <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ₪{new Intl.NumberFormat('he-IL').format(stats.totalAmount)}
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
          <DataTable
            data={authorizations}
            columns={columns}
          />
        </CardContent>
      </Card>
    </div>
  );
}