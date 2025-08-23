import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone, FileCheck, DollarSign, TrendingUp, Users, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from "@/integrations/supabase/client";

// Enhanced 3D color palette for charts - vibrant colors
const CHART_COLORS = [
  'hsl(220, 91%, 55%)', // bright blue
  'hsl(142, 76%, 36%)', // emerald green
  'hsl(271, 81%, 56%)', // vibrant purple
  'hsl(47, 96%, 53%)', // golden yellow
  'hsl(346, 87%, 43%)', // rose red
  'hsl(199, 89%, 48%)', // sky blue
  'hsl(32, 95%, 44%)', // orange
  'hsl(302, 84%, 61%)', // pink
  'hsl(168, 76%, 42%)', // teal
  'hsl(262, 83%, 58%)', // indigo
  'hsl(120, 60%, 50%)', // lime green
  'hsl(14, 100%, 57%)', // coral
  'hsl(280, 100%, 70%)', // magenta
  'hsl(39, 100%, 50%)', // amber
  'hsl(210, 100%, 60%)', // light blue
];

export default function GovernmentBudgetsDashboard() {
  const navigate = useNavigate();
  const [grants, setGrants] = useState<any[]>([]);
  const [authorizations, setAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMinistryIndex, setActiveMinistryIndex] = useState<number | null>(null);

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
      
      // עיבוד נתוני הרשאות - אותה לוגיקה כמו בעמוד המקורי
      if (authData && authData.length > 0) {
        // סינון נתונים - הסרת השורה עם סיכום הכולל
        const filteredData = authData.filter(item => 
          item.program && 
          item.program.trim() && 
          item.amount !== 33413631 // הסרת שורת הסיכום הכללי
        );

        // מיפוי הנתונים לפי המבנה המקורי
        const cleanedData = filteredData.map(item => ({
          ...item,
          ministry: mapSequenceToMinistry(item.authorization_number, item.program),
        }));
        
        setAuthorizations(cleanedData);
      } else {
        setAuthorizations([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setGrants([]);
      setAuthorizations([]);
    } finally {
      setLoading(false);
    }
  };

  // פונקציית מיפוי משרדים - העתקה מהעמוד המקורי
  const mapSequenceToMinistry = (seqNumber: any, program: string): string => {
    const seq = seqNumber?.toString() || '';
    const prog = program || '';
    
    // מוסדות חינוך
    if (prog.includes('חט"ע') || prog.includes('כיתות לימוד') || prog.includes('בית ספר') || prog.includes('גן')) {
      return 'משרד החינוך';
    }
    
    // ספורט ותרבות
    if (prog.includes('ספורט') || prog.includes('אולם') || prog.includes('אצטדיון')) {
      return 'משרד התרבות והספורט';
    }
    
    // בריאות
    if (prog.includes('טיפת חלב') || prog.includes('בריאות')) {
      return 'משרד הבריאות';
    }
    
    // ביטחון ואכיפה
    if (prog.includes('אכיפה') || prog.includes('חירום') || prog.includes('בטחון')) {
      return 'משרד הבטחון הפנימי';
    }
    
    // תשתיות ובנייה
    if (prog.includes('בניה') || prog.includes('שיפוץ') || prog.includes('תשתית') || prog.includes('תכנון')) {
      return 'משרד הפנים';
    }
    
    // סביבה ואנרגיה
    if (prog.includes('אנרגיה') || prog.includes('סביבה')) {
      return 'משרד האנרגיה';
    }
    
    return 'משרד הפנים'; // ברירת מחדל
  };

  useEffect(() => {
    fetchData();
  }, []);

  // חישוב סטטיסטיקות
  const grantsStats = {
    total: grants.length,
    approved: grants.filter(g => g.status === 'approved').length,
    pending: grants.filter(g => g.status === 'pending').length,
    totalAmount: grants.filter(g => g.status === 'approved').reduce((sum, g) => {
      // נשתמש ב approved_amount אם קיים, אחרת ב amount
      const approvedAmount = g.approved_amount || g.amount || 0;
      return sum + approvedAmount;
    }, 0)
  };

  const authStats = {
    total: authorizations.length,
    approved: authorizations.filter(a => a.status === 'approved').length,
    pending: authorizations.filter(a => a.status === 'pending').length,
    totalAmount: authorizations.reduce((sum, a) => sum + (a.amount || 0), 0) // כל ההרשאות, לא רק מאושרות
  };

  // נתוני גרפים לפי משרדים
  const grantsByMinistry = grants.reduce((acc, grant) => {
    const ministry = grant.ministry || 'לא מוגדר';
    if (!acc[ministry]) {
      acc[ministry] = { ministry, total: 0, approved: 0, totalAmount: 0, approvedAmount: 0 };
    }
    acc[ministry].total++;
    if (grant.status === 'approved') {
      acc[ministry].approved++;
      acc[ministry].approvedAmount += (grant.approved_amount || grant.amount || 0);
    }
    acc[ministry].totalAmount += (grant.amount || 0);
    return acc;
  }, {} as Record<string, any>);

  const authsByMinistry = authorizations.reduce((acc, auth) => {
    const ministry = auth.ministry || 'לא מוגדר';
    if (!acc[ministry]) {
      acc[ministry] = { ministry, total: 0, approved: 0, totalAmount: 0, approvedAmount: 0 };
    }
    acc[ministry].total++;
    if (auth.status === 'approved') {
      acc[ministry].approved++;
      acc[ministry].approvedAmount += (auth.amount || 0);
    }
    acc[ministry].totalAmount += (auth.amount || 0);
    return acc;
  }, {} as Record<string, any>);

  // Ministry data for grants pie chart (like the grants page)
  const grantsMinistryData = grants.reduce((acc: any[], grant) => {
    const ministry = grant.ministry || 'לא צוין';
    const existing = acc.find(item => item.name === ministry);
    if (existing) {
      existing.count++;
      existing.amount += (grant.approved_amount || grant.amount || 0);
    } else {
      acc.push({
        name: ministry,
        count: 1,
        amount: grant.approved_amount || grant.amount || 0
      });
    }
    return acc;
  }, []);

  // Ministry data for authorizations (exact copy from budget authorizations page)
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

  const authsMinistryData = Object.values(authsByMinistry);

  // נתונים לגרף השוואה לפי משרדים - השוואת המספר הכולל לא רק מאושרים
  const ministryComparisonData = Object.keys({ ...grantsByMinistry, ...authsByMinistry }).map(ministry => ({
    ministry,
    'קולות קוראים': grantsByMinistry[ministry]?.total || 0,
    'הרשאות תקציביות': authsByMinistry[ministry]?.total || 0
  }));

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

      {/* גרף השוואה לפי משרדים */}
      <Card className="border-0 shadow-elevated bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">השוואה בין קולות קוראים והרשאות תקציביות לפי משרד ממשלתי</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ministryComparisonData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={ministryComparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="ministry" 
                    tick={{ fontSize: 11 }}
                    height={80}
                    angle={-45}
                    textAnchor="end"
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
          ) : (
            <div className="flex justify-center items-center h-80 text-muted-foreground">
              אין נתונים להצגה
            </div>
          )}
        </CardContent>
      </Card>

      {/* גרפים לפי משרדים */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">קולות קוראים - התפלגות לפי משרד מממן</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : grantsMinistryData.length > 0 ? (
              <div className="flex gap-6 h-96">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {CHART_COLORS.map((color, index) => (
                          <linearGradient key={index} id={`gradient-ministry-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={grantsMinistryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        innerRadius={20}
                        fill="#8884d8"
                        dataKey="count"
                        onMouseEnter={(_, index) => setActiveMinistryIndex(index)}
                        onMouseLeave={() => setActiveMinistryIndex(null)}
                        animationBegin={0}
                        animationDuration={800}
                        className="animate-fade-in drop-shadow-lg"
                      >
                        {grantsMinistryData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`url(#gradient-ministry-${index % CHART_COLORS.length})`}
                            className="hover:brightness-110 transition-all duration-300 cursor-pointer filter drop-shadow-md"
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                            style={{
                              filter: activeMinistryIndex === index 
                                ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.4)) brightness(1.2)' 
                                : 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                              transform: activeMinistryIndex === index ? 'scale(1.15)' : 'scale(1)',
                              transformOrigin: 'center'
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 animate-fade-in">
                                <p className="font-semibold text-foreground">{data.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  מספר: <span className="text-foreground font-medium">{data.count}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  סכום: <span className="text-foreground font-medium">₪{data.amount.toLocaleString('he-IL')}</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-56 border-r border-border pr-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">משרדים מממנים</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {grantsMinistryData.map((entry, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer border ${
                          activeMinistryIndex === index 
                            ? 'bg-primary/10 border-primary/30 shadow-md scale-105' 
                            : 'hover:bg-muted/50 border-transparent'
                        }`}
                        onMouseEnter={() => setActiveMinistryIndex(index)}
                        onMouseLeave={() => setActiveMinistryIndex(null)}
                      >
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm border-2 border-background/50 flex-shrink-0" 
                          style={{ 
                            background: `linear-gradient(135deg, ${CHART_COLORS[index % CHART_COLORS.length]}, ${CHART_COLORS[index % CHART_COLORS.length]}cc)` 
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground font-medium truncate text-sm">{entry.name}</div>
                          <div className="text-muted-foreground text-xs mt-1">
                            <div>{entry.count} קולות קוראים</div>
                            <div className="font-medium">₪{entry.amount.toLocaleString('he-IL')}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-96 text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated bg-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">הרשאות תקציביות - התפלגות לפי משרד מממן</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ministryData.length > 0 ? (
              <div className="flex gap-6 h-96">
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ministryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent }) => percent > 5 ? `${(percent * 100).toFixed(0)}%` : ''}
                        outerRadius={80}
                        innerRadius={20}
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
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
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
                              <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-xl border border-gray-200 animate-fade-in">
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
                <div className="w-56 border-r border-border pr-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border">משרדים מממנים</h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {ministryData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50 border border-transparent">
                        <div 
                          className="w-4 h-4 rounded-full shadow-sm border-2 border-background/50 flex-shrink-0" 
                          style={{ 
                            background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` 
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-foreground font-medium truncate text-sm" 
                            title={item.ministry}
                          >
                            {item.ministry}
                            <div className="font-medium">₪{new Intl.NumberFormat('he-IL').format(item.amount)}</div>
                          <div className="text-muted-foreground text-xs mt-1">
                            <div>{item.count} הרשאות</div>
                        </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-96 text-muted-foreground">
                אין נתונים להצגה
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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