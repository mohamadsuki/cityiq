import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GrantsDashboard() {
  const [total, setTotal] = useState(0);
  const [submitted, setSubmitted] = useState(0);
  const [approved, setApproved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('grants')
          .select('status');

        if (!isMounted) return;

        if (error) {
          console.error('Error:', error);
          return;
        }

        if (data) {
          // Count directly
          const totalCount = data.length;
          const submittedCount = data.filter(item => item.status === 'הוגש').length;
          const approvedCount = data.filter(item => item.status === 'אושר').length;
          
          setTotal(totalCount);
          setSubmitted(submittedCount);
          setApproved(approvedCount);
          
          console.log('Updated stats:', { totalCount, submittedCount, approvedCount });
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStats();
    
    return () => {
      isMounted = false;
    };
  }, []);

  console.log('🎨 Rendering with stats:', { total, submitted, approved }, 'loading:', loading);
  
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">קולות קוראים</h1>
          <p className="text-sm text-muted-foreground">מעקב אחר בקשות, סטטוסים והחלטות</p>
        </div>
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
