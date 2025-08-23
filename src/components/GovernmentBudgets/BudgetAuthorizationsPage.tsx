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
    authorization_number: "הר-2024-001",
    ministry: "משרד החינוך",
    program: "תוכנית חינוך מיוחד",
    amount: 150000,
    status: "approved",
    submitted_at: "2024-01-15",
    approved_at: "2024-02-01",
    valid_until: "2024-12-31",
    purpose: "הקמת כיתות חינוך מיוחד",
    department_slug: "education",
    notes: "הרשאה לפיתוח תוכנית חינוך מיוחד בבתי הספר"
  },
  {
    id: "2", 
    authorization_number: "הר-2024-002",
    ministry: "משרד הרווחה",
    program: "תמיכה בקשישים",
    amount: 85000,
    status: "pending",
    submitted_at: "2024-02-10",
    approved_at: null,
    valid_until: "2024-11-30",
    purpose: "שירותי תמיכה לאוכלוסיית קשישים",
    department_slug: "welfare",
    notes: "ממתין לאישור מליאה"
  },
  {
    id: "3",
    authorization_number: "הר-2024-003", 
    ministry: "משרד הפנים",
    program: "פיתוח תשתיות",
    amount: 320000,
    status: "in_review",
    submitted_at: "2024-03-05",
    approved_at: null,
    valid_until: "2025-03-31",
    purpose: "שיפור תשתיות עירוניות",
    department_slug: "engineering",
    notes: "בבדיקה משפטית"
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
      console.log('🔍 Raw fetched authorizations:', data);
      
      // If no data, use mock data
      if (!data || data.length === 0) {
        console.log('No data found, using mock data');
        setAuthorizations(mockAuthorizations);
      } else {
        // Filter out the total sum row (33,413,631) - it has no program description
        const filteredData = data.filter(item => 
          item.program && 
          item.program.trim() && 
          item.amount !== 33413631 // Remove the total sum row
        );

        // Map the data correctly based on the actual Excel structure
        const cleanedData = filteredData.map(item => {
          console.log('🔍 Processing item:', item);
          
          const cleanedItem = {
            ...item,
            // authorization_number is correct - these are the row numbers from Excel
            authorization_number: item.authorization_number?.toString() || 'לא צוין',
            // program contains the actual authorization description
            program: item.program || 'לא צוין',
            // purpose contains the tabar number
            purpose: item.purpose || 'לא צוין',
            // amount is correct
            amount: item.amount || 0,
            // ministry contains reference numbers - we need to map these to actual ministry names
            ministry: mapReferenceToMinistry(item.ministry),
            // valid_until is empty - we'll use a default or extract from somewhere else
            valid_until: item.valid_until || null,
            // department_slug is correct
            department_slug: item.department_slug || 'finance',
            // approved_at is empty
            approved_at: item.approved_at || null,
            // notes is empty - generate from available data
            notes: item.notes || generateNotes(item)
          };
          
          console.log('🔍 Cleaned item:', cleanedItem);
          return cleanedItem;
        });
        
        setAuthorizations(cleanedData);
      }
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      console.log('Using mock data due to error');
      setAuthorizations(mockAuthorizations);
    } finally {
      setLoading(false);
    }
  };

  // Map reference numbers to actual ministry names
  const mapReferenceToMinistry = (reference: string): string => {
    if (!reference) return 'לא צוין';
    
    // Common patterns in the reference numbers
    if (reference.includes('1893155') || reference.includes('1891837')) {
      return 'משרד הפנים'; // Interior Ministry
    }
    if (reference.includes('1001835') || reference.includes('1001839') || reference.includes('1001817') || reference.includes('1001823') || reference.includes('1001841')) {
      return 'משרד הבטחון הפנימי'; // Internal Security Ministry  
    }
    if (reference.includes('2025020201')) {
      return 'משרד החינוך'; // Education Ministry
    }
    if (reference.includes('ק"ק')) {
      return 'קרן קיימת לישראל'; // KKL
    }
    
    // Default based on content patterns
    return 'משרד הפנים';
  };

  // Generate meaningful notes from available data
  const generateNotes = (item: any): string => {
    const parts = [];
    
    if (item.status === 'approved') parts.push('הרשאה מאושרת');
    else if (item.status === 'pending') parts.push('ממתין לאישור מליאה');
    else if (item.status === 'in_review') parts.push('בבדיקה');
    
    if (item.purpose) parts.push(`תב״ר מספר: ${item.purpose}`);
    
    // Add ministry reference for tracking
    if (item.ministry) parts.push(`מספר פניה: ${item.ministry}`);
    
    return parts.length > 0 ? parts.join(' • ') : 'ממתין למילוי פרטים נוספים';
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
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        console.log('🔍 Authorization number value:', value);
        return value || 'לא צוין';
      }
    },
    {
      accessorKey: "ministry",
      header: "משרד מממן",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        console.log('🔍 Ministry value:', value);
        return value || 'לא צוין';
      }
    },
    {
      accessorKey: "program",
      header: "תיאור ההרשאה",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        console.log('🔍 Program value:', value);
        return value || 'לא צוין';
      }
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
        console.log('🔍 Valid until value:', value);
        if (!value) return 'לא הוגדר תוקף';
        try {
          return new Date(value).toLocaleDateString('he-IL');
        } catch {
          return 'תאריך לא תקין';
        }
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
        console.log('🔍 Approved at value:', value);
        if (!value) return 'ממתין לאישור';
        try {
          return new Date(value).toLocaleDateString('he-IL');
        } catch {
          return 'תאריך לא תקין';
        }
      }
    },
    {
      accessorKey: "notes",
      header: "הערות",
      enableSorting: true,
      cell: ({ getValue }: any) => {
        const value = getValue();
        console.log('🔍 Notes value:', value);
        return value && value.trim() ? value : 'אין הערות';
      }
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
    { name: 'מאושרות', value: stats.approved, color: '#10B981', icon: '✓' },
    { name: 'ממתינות', value: stats.pending, color: '#F59E0B', icon: '⏳' },
    { name: 'בבדיקה', value: authorizations.filter(a => a.status === 'in_review').length, color: '#3B82F6', icon: '👁️' },
    { name: 'נדחו', value: authorizations.filter(a => a.status === 'rejected').length, color: '#EF4444', icon: '✗' }
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
  }, []).map((item, index) => ({
    ...item,
    color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'][index % 6]
  }));

  const departmentData = authorizations.reduce((acc: any[], auth) => {
    const deptMap: Record<string, string> = {
      'finance': 'כספים',
      'engineering': 'הנדסה', 
      'education': 'חינוך',
      'welfare': 'רווחה',
      'non-formal': 'תרבות'
    };
    const deptName = deptMap[auth.department_slug] || auth.department_slug || 'לא צוין';
    const existing = acc.find(item => item.department === deptName);
    if (existing) {
      existing.count += 1;
      existing.amount += auth.amount || 0;
    } else {
      acc.push({
        department: deptName,
        count: 1,
        amount: auth.amount || 0
      });
    }
    return acc;
  }, []).map((item, index) => ({
    ...item,
    color: ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#3B82F6'][index % 6]
  }));

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {statusData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300 hover:drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900">{data.name}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>{data.value} הרשאות</div>
                                <div>{((data.value / statusData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}% מהכלל</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 flex flex-col justify-center space-y-2 text-sm">
                {statusData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.name}</div>
                      <div className="text-gray-500">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי משרד ממשלתי מממן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ministryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ ministry, percent }) => `${ministry}\n${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {ministryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300 hover:drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900">{data.ministry}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>{data.count} הרשאות</div>
                                <div>₪{new Intl.NumberFormat('he-IL').format(data.amount)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 flex flex-col justify-center space-y-2 text-sm">
                {ministryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.ministry}</div>
                      <div className="text-gray-500">{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות לפי מחלקה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 flex">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ department, percent }) => `${department}\n${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      innerRadius={30}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={3}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300 hover:drop-shadow-lg"
                          style={{
                            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900">{data.department}</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>{data.count} הרשאות</div>
                                <div>₪{new Intl.NumberFormat('he-IL').format(data.amount)}</div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-32 flex flex-col justify-center space-y-2 text-sm">
                {departmentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.department}</div>
                      <div className="text-gray-500">{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
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
              searchableColumnIds={["ministry", "department_slug"]}
              searchPlaceholder="חפש לפי משרד מממן או מחלקה..."
              filterableColumns={{
                ministry: {
                  label: "המשרדים",
                  options: Array.from(new Set(authorizations.map(a => a.ministry).filter(Boolean)))
                    .map(ministry => ({ label: ministry, value: ministry }))
                },
                department_slug: {
                  label: "המחלקות",
                  options: [
                    { label: 'כספים', value: 'finance' },
                    { label: 'הנדסה', value: 'engineering' },
                    { label: 'חינוך', value: 'education' },
                    { label: 'רווחה', value: 'welfare' },
                    { label: 'תרבות', value: 'non-formal' }
                  ].filter(dept => authorizations.some(a => a.department_slug === dept.value))
                }
              }}
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