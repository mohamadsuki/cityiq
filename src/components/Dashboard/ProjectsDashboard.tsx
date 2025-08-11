import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, ListChecks } from "lucide-react";

const ProjectItem = ({ name, status, progress }: { name: string; status: string; progress: number }) => (
  <div className="p-4 rounded-md bg-muted">
    <div className="flex items-center justify-between mb-2">
      <div className="font-medium">{name}</div>
      <Badge variant={status === 'בתהליך' ? 'default' : 'secondary'}>{status}</Badge>
    </div>
    <div className="flex items-center gap-2">
      <div className="w-40"><Progress value={progress} /></div>
      <span className="text-sm text-muted-foreground">{progress}%</span>
    </div>
  </div>
);

export default function ProjectsDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פרויקטים</h1>
          <p className="text-sm text-muted-foreground">מעקב אחר פרויקטים עירוניים מכלל המחלקות</p>
        </div>
      </header>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            פרויקטים לדוגמה
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProjectItem name="מבני ציבור - מרכז קהילתי חדש" status="בתהליך" progress={48} />
          <ProjectItem name="תשתיות - שדרוג רחובות ראשיים" status="בתהליך" progress={62} />
          <ProjectItem name="חינוך - פתיחת שנת לימודים 2025" status="מתוכנן" progress={10} />
          <ProjectItem name="קייטנת קיץ אלחוארנה" status="הושלם" progress={100} />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-muted-foreground" />
            פעולות הבאות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pr-5 text-sm text-muted-foreground space-y-1">
            <li>הוספת פילוח לפי תחום (מבני ציבור/תשתיות)</li>
            <li>חיבור למקור נתונים של פרויקטים (Supabase)</li>
            <li>טבלאות מפורטות וייצוא</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
