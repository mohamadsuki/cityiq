import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/DataTable";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { DataUploader } from "@/components/shared/DataUploader";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Plus, FileCheck, AlertCircle, Clock, CheckCircle, DollarSign, Upload, CalendarIcon, Edit, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusUpdateId, setStatusUpdateId] = useState<string>('');
  const [showNewAuthDialog, setShowNewAuthDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAuth, setEditingAuth] = useState<any>(null);
  const [filteredAuthorizations, setFilteredAuthorizations] = useState<any[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [newAuthData, setNewAuthData] = useState({
    authorization_number: '',
    ministry: '',
    program: '',
    purpose: '',
    amount: '',
    valid_until: '',
    department_slug: 'finance',
    notes: ''
  });
  const { toast } = useToast();

  const fetchAuthorizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('budget_authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If no data, use mock data
      if (!data || data.length === 0) {
        setAuthorizations(mockAuthorizations);
      } else {
        const cleanedData = data.map(item => ({
          ...item,
          authorization_number: item.ministry || item.authorization_number?.toString() || 'לא צוין',
          program: item.program || 'לא צוין',
          purpose: item.purpose || '',
          amount: item.amount || 0,
          ministry: item.authorization_number || 'לא צוין',
          valid_until: item.valid_until || null,
          department_slug: item.department_slug || 'finance',
          approved_at: item.approved_at || null,
          status: item.approved_at ? 'approved' : (item.status || 'pending'),
          notes: item.notes || ''
        }));
        
        setAuthorizations(cleanedData);
      }
    } catch (error) {
      console.error('Error fetching authorizations:', error);
      setAuthorizations(mockAuthorizations);
    } finally {
      setLoading(false);
    }
  };

  // Function to filter authorizations by category
  const handleFilterByCategory = (category: string) => {
    const today = new Date();
    const filtered = authorizations.filter(auth => {
      if (!auth.valid_until) return false;
      
      const validUntil = new Date(auth.valid_until);
      const monthsDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
      
      let authCategory = '';
      if (monthsDiff < 0) {
        authCategory = 'פג תוקף';
      } else if (monthsDiff <= 3) {
        authCategory = 'פג תוקף עד 3 חודשים';
      } else if (monthsDiff <= 6) {
        authCategory = 'פג תוקף עד 6 חודשים';
      } else if (monthsDiff <= 12) {
        authCategory = 'פג תוקף עד שנה';
      } else {
        authCategory = 'תקף למעלה משנה';
      }
      
      return authCategory === category;
    });
    
    setFilteredAuthorizations(filtered);
    setFilterCategory(category);
  };

  // Function to clear filter
  const clearFilter = () => {
    setFilteredAuthorizations([]);
    setFilterCategory('');
  };

  const fetchGrants = async () => {
    try {
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setGrants(data || []);
    } catch (error) {
      console.error('Error fetching grants:', error);
      setGrants([]);
    }
  };

  useEffect(() => {
    fetchAuthorizations();
    fetchGrants();
  }, []);

  const columns = [
    {
      accessorKey: "authorization_number",
      header: "מספר הרשאה",
      enableSorting: true,
    },
    {
      accessorKey: "ministry",
      header: "משרד מממן",
      enableSorting: true,
    },
    {
      accessorKey: "program",
      header: "תיאור ההרשאה",
      enableSorting: true,
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
        if (!value) return 'לא הוגדר תוקף';
        try {
          const date = new Date(value);
          return date.toLocaleDateString('he-IL');
        } catch {
          return 'תאריך לא תקין';
        }
      }
    }
  ];

  const handleExport = () => {
    console.log(`Exporting authorizations`);
  };

  // סטטיסטיקות מהירות
  const validAuthorizations = authorizations.filter(auth => 
    auth.program && 
    auth.program.trim() && 
    typeof auth.amount === 'number' && 
    auth.amount > 0
  );

  const approvedGrants = grants.filter(g => g.status === 'אושר');
  const approvedGrantsAmount = approvedGrants.reduce((sum, g) => sum + (g.amount || 0), 0);
  
  const stats = {
    total: validAuthorizations.length,
    approved: validAuthorizations.filter(a => a.approved_at).length,
    pending: validAuthorizations.filter(a => !a.approved_at).length,
    totalAmount: validAuthorizations.reduce((sum, a) => sum + (a.amount || 0), 0),
    approvedAmount: validAuthorizations.filter(a => a.approved_at).reduce((sum, a) => sum + (a.amount || 0), 0),
  };

  // נתוני גרפים
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

  // נתונים לתרשים תוקף ההרשאות - בסגנון Progress Bar
  const createTimelineData = () => {
    const currentDate = new Date();
    
    // קיבוץ הרשאות לפי תאריך סיום תוקף
    const authsByExpiry = authorizations
      .filter(auth => auth.valid_until)
      .reduce((acc, auth) => {
        const expiryDate = new Date(auth.valid_until);
        const monthYear = `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthYear]) {
          acc[monthYear] = {
            date: expiryDate,
            dateLabel: monthYear,
            authorizations: [],
            count: 0,
            totalAmount: 0,
            daysFromNow: Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
          };
        }
        
        acc[monthYear].authorizations.push(auth);
        acc[monthYear].count += 1;
        acc[monthYear].totalAmount += auth.amount || 0;
        
        return acc;
      }, {});

    // המרה למערך וסידור לפי תאריך, הצגת 10 ראשונים
    const allTimelineData = Object.values(authsByExpiry)
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime());
    
    // חישוב אורך מקסימלי לנורמליזציה
    const maxDays = Math.max(...allTimelineData.map((item: any) => Math.abs(item.daysFromNow)));
    
    const timelineData = allTimelineData
      .slice(0, 10)
      .map((item: any, index) => {
        // חישוב אחוז התקדמות (0-100%)
        const progressPercentage = maxDays > 0 ? Math.min(100, Math.max(5, (Math.abs(item.daysFromNow) / maxDays) * 100)) : 50;
        
        return {
          ...item,
          y: index + 1,
          progressPercentage,
          isExpired: item.daysFromNow < 0,
          color: item.daysFromNow < 0 ? '#dc2626' : 
                 item.daysFromNow <= 90 ? '#ea580c' :
                 item.daysFromNow <= 180 ? '#ca8a04' :
                 item.daysFromNow <= 365 ? '#16a34a' : '#2563eb'
        };
      });

    return { timelineData, allTimelineData };
  };

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
          <Button 
            className="bg-gradient-primary text-primary-foreground shadow-glow"
            onClick={() => setShowNewAuthDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            הרשאה חדשה
          </Button>
        </div>
      </div>

      {/* כרטיסי סטטיסטיקות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">סה"כ הרשאות</CardTitle>
            <FileCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">סה"כ סכום הרשאות תקציביות</CardTitle>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* תרשים משרדים */}
        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">התפלגות לפי משרד ממשלתי מממן</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 h-64">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ministryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={60}
                      innerRadius={25}
                      fill="#8884d8"
                      dataKey="count"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {ministryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color}
                          className="hover:opacity-80 transition-all duration-300"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-gray-200">
                              <div className="flex items-center gap-2 mb-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: data.color }}
                                />
                                <span className="font-medium text-gray-900 text-sm">{data.ministry}</span>
                              </div>
                              <div className="text-xs text-gray-600">
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
            </div>
          </CardContent>
        </Card>

        {/* ציר זמן תוקף הרשאות - בסגנון Progress Bar */}
        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">ציר זמן תוקף הרשאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              {(() => {
                const { timelineData, allTimelineData } = createTimelineData();

                if (timelineData.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      אין נתונים להצגה
                    </div>
                  );
                }

                return (
                  <div className="relative w-full h-full bg-gradient-to-br from-slate-50 to-white rounded-xl overflow-hidden border border-slate-200">
                    {/* כותרת */}
                    <div className="absolute top-0 left-0 right-0 h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6">
                      <div className="text-sm font-semibold text-slate-700">ציר זמן תוקף הרשאות</div>
                      <div className="text-xs text-slate-500">מהיום עד פג התוקף</div>
                    </div>
                    
                    {/* פסי התקדמות עם חצים */}
                    <div className="pt-16 pb-8 px-8 space-y-4 overflow-y-auto max-h-full">
                      {timelineData.map((item: any, index) => {
                        return (
                          <div 
                            key={index}
                            className="relative group animate-fade-in"
                            style={{ marginBottom: '16px' }}
                          >
                            {/* פס התקדמות עם חץ */}
                            <div className="relative w-full h-12 bg-slate-100 rounded-lg overflow-hidden shadow-sm">
                              {/* פס התקדמות צבעוני */}
                              <div
                                className="relative h-full flex items-center transition-all duration-500 hover:brightness-110"
                                style={{
                                  background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                                  width: `${item.progressPercentage}%`,
                                  clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)',
                                  boxShadow: `0 4px 12px ${item.color}30`
                                }}
                              >
                                {/* תוכן הפס */}
                                <div className="px-4 text-white font-semibold text-sm flex items-center gap-2">
                                  <span>{item.count} הרשאות</span>
                                  <span className="text-xs opacity-90">
                                    (₪{new Intl.NumberFormat('he-IL', { notation: 'compact' }).format(item.totalAmount)})
                                  </span>
                                </div>
                                
                                {/* מספר ימים במקום החץ */}
                                <div 
                                  className="absolute left-full top-1/2 transform -translate-y-1/2 bg-white text-slate-700 px-2 py-1 rounded shadow-sm font-bold text-xs border-2 ml-2"
                                  style={{ borderColor: item.color }}
                                >
                                  {Math.abs(item.daysFromNow)}d
                                </div>
                              </div>
                              
                              {/* תווית תאריך */}
                              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-600 text-sm font-medium">
                                {new Date(item.date).toLocaleDateString('he-IL', { 
                                  day: 'numeric',
                                  month: 'short',
                                  year: '2-digit'
                                })}
                                {item.isExpired && <span className="text-red-500 mr-1">⚠</span>}
                              </div>
                            </div>
                            
                            {/* Tooltip מפורט */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-2xl border border-slate-200 min-w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40">
                              <div className="text-center mb-3">
                                <div className="font-bold text-slate-900 text-lg flex items-center justify-center gap-2">
                                  {item.isExpired && <span className="text-red-500">⚠️</span>}
                                  {new Date(item.date).toLocaleDateString('he-IL')}
                                  {item.isExpired ? ' (פג תוקף)' : ''}
                                </div>
                                <div className="text-sm text-slate-600">
                                  {item.isExpired ? 'פג תוקף לפני' : 'פג תוקף בעוד'} {Math.abs(item.daysFromNow)} ימים
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                                  <div className="text-xs text-slate-600">מספר הרשאות</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="text-lg font-bold text-green-600">
                                    ₪{new Intl.NumberFormat('he-IL', { notation: 'compact' }).format(item.totalAmount)}
                                  </div>
                                  <div className="text-xs text-slate-600">סה"כ תקציב</div>
                                </div>
                              </div>
                              
                              <div className="border-t pt-3 mb-3">
                                <div className="text-sm font-medium text-slate-700 mb-2">רשימת הרשאות:</div>
                                <div className="max-h-24 overflow-y-auto space-y-1">
                                  {item.authorizations.slice(0, 3).map((auth: any, i: number) => (
                                    <div key={i} className="text-xs text-slate-600 bg-slate-50 p-2 rounded border">
                                      • {auth.program?.substring(0, 45)}{auth.program?.length > 45 ? '...' : ''}
                                    </div>
                                  ))}
                                  {item.authorizations.length > 3 && (
                                    <div className="text-xs text-slate-500 italic text-center py-1">
                                      +{item.authorizations.length - 3} הרשאות נוספות...
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="border-t pt-3">
                                <button
                                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={() => {
                                    const today = new Date();
                                    const validUntil = new Date(item.date);
                                    const monthsDiff = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30));
                                    
                                    let category = '';
                                    if (monthsDiff < 0) {
                                      category = 'פג תוקף';
                                    } else if (monthsDiff <= 3) {
                                      category = 'פג תוקף עד 3 חודשים';
                                    } else if (monthsDiff <= 6) {
                                      category = 'פג תוקף עד 6 חודשים';
                                    } else if (monthsDiff <= 12) {
                                      category = 'פג תוקף עד שנה';
                                    } else {
                                      category = 'תקף למעלה משנה';
                                    }
                                    
                                    handleFilterByCategory(category);
                                  }}
                                >
                                  הצג בטבלה
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* הודעה על גלילה */}
                    {allTimelineData.length > 10 && (
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-sm text-slate-600 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200">
                        מציג 10 תקופות ראשונות מתוך {allTimelineData.length}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* סינון פעיל */}
      {filterCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">
                מציג הרשאות: {filterCategory}
              </span>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {filteredAuthorizations.length} הרשאות
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilter}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              נקה סינון
            </Button>
          </div>
        </div>
      )}

      {/* טבלת הרשאות */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold text-foreground">
              {filterCategory ? `הרשאות: ${filterCategory}` : 'כל ההרשאות'}
            </CardTitle>
            <ExportButtons data={filterCategory ? filteredAuthorizations : authorizations} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filterCategory ? filteredAuthorizations : authorizations}
          />
        </CardContent>
      </Card>

      {/* חלונות דיאלוג */}
      {showUploader && (
        <Dialog open={showUploader} onOpenChange={setShowUploader}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>העלה קובץ הרשאות תקציביות</DialogTitle>
            </DialogHeader>
            <DataUploader
              context="budget_authorizations"
              onUploadSuccess={() => {
                setShowUploader(false);
                fetchAuthorizations();
                toast({
                  title: "הצלחה",
                  description: "הקובץ הועלה בהצלחה והנתונים נשמרו",
                });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}