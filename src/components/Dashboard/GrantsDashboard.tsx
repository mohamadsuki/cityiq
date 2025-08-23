import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function GrantsDashboard() {
  const [total, setTotal] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [approved, setApproved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  console.log('🏁 GrantsDashboard mounting with refreshKey:', refreshKey);

  const fetchStats = useCallback(async () => {
    console.log('🔄 Starting fetchStats...');
    setLoading(true);
    
    try {
      // Clear any potential cache
      const { data, error } = await supabase
        .from('grants')
        .select('status')
        .order('created_at', { ascending: false });

      console.log('📊 Raw data from supabase:', data);

      if (error) {
        console.error('❌ Supabase error:', error);
        toast({
          title: "שגיאה",
          description: "שגיאה בטעינת הנתונים",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        // Count each status explicitly
        const totalCount = data.length;
        const submittedCount = data.filter(item => item.status === 'הוגש').length;
        const approvedCount = data.filter(item => item.status === 'אושר').length;
        
        console.log('🔢 Calculated counts:', { 
          totalCount, 
          submittedCount, 
          approvedCount,
          allStatuses: data.map(d => d.status)
        });
        
        // Force update with new values
        setTotal(totalCount);
        setSubmitted(submittedCount);
        setApproved(approvedCount);
        
        toast({
          title: "עודכן בהצלחה",
          description: `נטענו ${totalCount} בקשות`,
        });
      }
    } catch (err) {
      console.error('💥 Fetch error:', err);
      toast({
        title: "שגיאה",
        description: "שגיאה בחיבור למסד הנתונים",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setRefreshKey(prev => prev + 1);
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    console.log('⚡ useEffect triggered, refreshKey:', refreshKey);
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh every 10 seconds for debugging
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchStats]);

  console.log('🎨 Rendering with stats:', { total, submitted, approved }, 'loading:', loading);
  
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">קולות קוראים</h1>
          <p className="text-sm text-muted-foreground">מעקב אחר בקשות, סטטוסים והחלטות</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          רענן נתונים
        </Button>
      </header>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            סקירה מהירה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">סה"כ בקשות</div>
            <div className="text-2xl font-bold">{loading ? '...' : total}</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">הוגשו</div>
            <div className="text-2xl font-bold">{loading ? '...' : submitted}</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">מאושרים</div>
            <div className="text-2xl font-bold">{loading ? '...' : approved}</div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
            נתונים לדוגמה
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            זהו מסך התחלתי. ניתן להרחיב בהמשך לטבלאות מפורטות, פילוחים וייצוא נתונים.
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">פיננסים</Badge>
            <Badge variant="secondary">חינוך</Badge>
            <Badge variant="secondary">רווחה</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button asChild>
          <a href="/finance" aria-label="נווט אל מחלקת פיננסים">לצפייה בתקציבים קשורים</a>
        </Button>
      </div>
    </div>
  );
}
