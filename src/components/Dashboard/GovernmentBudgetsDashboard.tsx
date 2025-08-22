import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone, FileCheck, DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

export default function GovernmentBudgetsDashboard() {
  const navigate = useNavigate();
  const [grants, setGrants] = useState<any[]>([]);
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // קבלת נתוני קולות קוראים
      const { data: grantsData, error: grantsError } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (grantsError) throw grantsError;
      
      // קבלת נתוני הרשאות תקציביות
      const { data: authData, error: authError } = await supabase
        .from('budget_authorizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (authError) throw authError;
      
      setGrants(grantsData || []);
      setAuthorizations(authData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setGrants([]);
      setAuthorizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // חישוב סטטיסטיקות
  const grantsStats = {
    total: grants.length,
    approved: grants.filter(g => g.status === 'approved').length,
    pending: grants.filter(g => g.status === 'pending').length,
    totalAmount: grants.filter(g => g.status === 'approved').reduce((sum, g) => sum + (g.approved_amount || 0), 0)
  };

  const authStats = {
    total: authorizations.length,
    approved: authorizations.filter(a => a.status === 'approved').length,
    pending: authorizations.filter(a => a.status === 'pending').length,
    totalAmount: authorizations.filter(a => a.status === 'approved').reduce((sum, a) => sum + (a.amount || 0), 0)
  };

  // נתוני גרפים
  const grantsStatusData = [
    { name: 'מאושרים', value: grantsStats.approved, color: '#22c55e' },
    { name: 'ממתינים', value: grantsStats.pending, color: '#f59e0b' },
    { name: 'בבדיקה', value: grants.filter(g => g.status === 'in_review').length, color: '#3b82f6' },
    { name: 'נדחו', value: grants.filter(g => g.status === 'rejected').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const authStatusData = [
    { name: 'מאושרות', value: authStats.approved, color: '#22c55e' },
    { name: 'ממתינות', value: authStats.pending, color: '#f59e0b' },
    { name: 'בבדיקה', value: authorizations.filter(a => a.status === 'in_review').length, color: '#3b82f6' },
    { name: 'נדחו', value: authorizations.filter(a => a.status === 'rejected').length, color: '#ef4444' }
  ].filter(item => item.value > 0);

  const sections = [
    {
      title: "קולות קוראים",
      description: "ניהול והגשת בקשות לקולות קוראים",
      icon: Megaphone,
      path: "/grants",
      color: "from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "הרשאות תקציביות",
      description: "ניהול הרשאות תקציביות ממשלתיות",
      icon: FileCheck,
      path: "/government-budgets/authorizations",
      color: "from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20",
      iconColor: "text-green-600 dark:text-green-400"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">תקציבים ממשלתיים ותמיכות</h1>
        <p className="text-muted-foreground">ניהול תקציבים ממשלתיים, קולות קוראים והרשאות תקציביות</p>
      </div>

      {/* מודולים */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.title}
              className={`group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br ${section.color} cursor-pointer`}
              onClick={() => navigate(section.path)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {section.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${section.iconColor} group-hover:scale-110 transition-transform`} />
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-right h-auto p-0 hover:bg-transparent group-hover:text-primary transition-colors"
                >
                  <span>כניסה למודול</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* כרטיסי סטטיסטיקות כללי */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">סה"כ קולות קוראים</CardTitle>
            <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{loading ? '-' : grantsStats.total}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">מתוכם {grantsStats.approved} מאושרים</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">סה"כ הרשאות</CardTitle>
            <FileCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{loading ? '-' : authStats.total}</div>
            <p className="text-xs text-green-700 dark:text-green-300">מתוכן {authStats.approved} מאושרות</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">סכום קולות קוראים</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {loading ? '-' : `₪${new Intl.NumberFormat('he-IL').format(grantsStats.totalAmount)}`}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">מאושר</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">סכום הרשאות</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {loading ? '-' : `₪${new Intl.NumberFormat('he-IL').format(authStats.totalAmount)}`}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">מאושר</p>
          </CardContent>
        </Card>
      </div>

      {/* גרף השוואה */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">השוואה בין קולות קוראים והרשאות תקציביות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { 
                      category: 'מאושרים',
                      'קולות קוראים': grantsStats.approved,
                      'הרשאות תקציביות': authStats.approved
                    },
                    { 
                      category: 'ממתינים',
                      'קולות קוראים': grantsStats.pending,
                      'הרשאות תקציביות': authStats.pending
                    },
                    { 
                      category: 'סה"כ',
                      'קולות קוראים': grantsStats.total,
                      'הרשאות תקציביות': authStats.total
                    }
                  ]} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}`, name]}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="קולות קוראים" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="הרשאות תקציביות" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* גרפי התפלגות סטטוס */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות קולות קוראים לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grantsStatusData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={grantsStatusData}
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
                      {grantsStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any) => [
                        `${value} קולות קוראים`,
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
            ) : (
              <div className="flex justify-center items-center h-80 text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">התפלגות הרשאות תקציביות לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : authStatusData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={authStatusData}
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
                      {authStatusData.map((entry, index) => (
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
            ) : (
              <div className="flex justify-center items-center h-80 text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* גרף הכנסות לעומת סכומים מבוקשים */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">תקציבים מאושרים לעומת סכומים מבוקשים</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[
                    { 
                      type: 'קולות קוראים',
                      'סכום מבוקש': grants.reduce((sum, g) => sum + (g.submission_amount || 0), 0),
                      'סכום מאושר': grantsStats.totalAmount
                    },
                    { 
                      type: 'הרשאות תקציביות',
                      'סכום מבוקש': authorizations.reduce((sum, a) => sum + (a.amount || 0), 0),
                      'סכום מאושר': authStats.totalAmount
                    }
                  ]} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="type" 
                    tick={{ fontSize: 12 }}
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `₪${new Intl.NumberFormat('he-IL', { notation: 'compact' }).format(value)}`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `₪${new Intl.NumberFormat('he-IL').format(value as number)}`,
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
                  <Legend />
                  <Bar 
                    dataKey="סכום מבוקש" 
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="סכום מאושר" 
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}