import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, FileSpreadsheet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GrantsStats {
  total: number;
  submitted: number;
  approved: number;
}

export default function GrantsDashboard() {
  console.log('🏁 GrantsDashboard component mounting...');
  
  const [stats, setStats] = useState<GrantsStats>({
    total: 0,
    submitted: 0,
    approved: 0
  });
  const [loading, setLoading] = useState(true);

  console.log('📊 Current stats state:', stats);

  useEffect(() => {
    console.log('🚀 Starting grants fetch...');
    
    const fetchGrantsStats = async () => {
      try {
        // Fetch all grants data
        const { data: grants, error } = await supabase
          .from('grants')
          .select('*');

        console.log('📊 Raw grants response:', { error, dataLength: grants?.length });

        if (error) {
          console.error('❌ Error fetching grants:', error);
          setLoading(false);
          return;
        }

        if (grants && grants.length > 0) {
          console.log('✅ All grants fetched:', grants.length);
          
          // Print all unique statuses to see what we have
          const uniqueStatuses = [...new Set(grants.map(g => g.status))];
          console.log('🏷️ Unique statuses found:', uniqueStatuses);
          
          const total = grants.length;
          let submitted = 0;
          let approved = 0;
          
          // Count manually with detailed logging
          grants.forEach(grant => {
            console.log(`Grant "${grant.name}" has status: "${grant.status}"`);
            if (grant.status === 'הוגש') {
              submitted++;
            } else if (grant.status === 'אושר') {
              approved++;
            }
          });

          console.log('🎯 Manual count results:', { total, submitted, approved });

          setStats({ total, submitted, approved });
        } else {
          console.log('⚠️ No grants found or empty array');
          setStats({ total: 0, submitted: 0, approved: 0 });
        }
      } catch (error) {
        console.error('💥 Error:', error);
        setStats({ total: 0, submitted: 0, approved: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchGrantsStats();
  }, []);

  console.log('🎨 Rendering with stats:', stats, 'loading:', loading);
  
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
            <div className="text-2xl font-bold">20</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">הוגשו</div>
            <div className="text-2xl font-bold">16</div>
          </div>
          <div className="p-4 rounded-md bg-muted">
            <div className="text-sm text-muted-foreground">מאושרים</div>
            <div className="text-2xl font-bold">4</div>
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
