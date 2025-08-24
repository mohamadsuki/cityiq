import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GrantsDashboard() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrants = async () => {
    try {
      console.log('🔍 GrantsDashboard: Fetching grants from database...');
      const { data, error } = await supabase
        .from('grants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      console.log('✅ GrantsDashboard: Grants fetched successfully:', data);
      setGrants(data || []);
    } catch (error) {
      console.error('❌ GrantsDashboard: Error fetching grants:', error);
      setGrants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrants();
  }, []);

  const totalGrants = grants.length;
  const submittedGrants = grants.filter(g => g.status === 'הוגש' || g.status === 'אושר' || g.status === 'נדחה').length;
  const approvedGrants = grants.filter(g => g.status === 'אושר').length;
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
            <div className="text-sm text-muted-foreground">סה"כ קולות קוראים</div>
            <div className="text-2xl font-bold">{loading ? '...' : totalGrants}</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">הוגשו</div>
            <div className="text-2xl font-bold">{loading ? '...' : submittedGrants}</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">מאושרים</div>
            <div className="text-2xl font-bold">{loading ? '...' : approvedGrants}</div>
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
