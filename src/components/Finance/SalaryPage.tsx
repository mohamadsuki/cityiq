import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SalaryPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold mb-2">שכר</h1>
        <p className="text-muted-foreground">
          מעקב נתוני שכר - מתעדכן רבעונית מתקציב רגיל
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>מספר עובדים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">530</div>
            <div className="text-sm text-muted-foreground">עובדים פעילים</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שכר כללי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              נתונים מתא F27
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שכר חינוך</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              נתונים מתא F32
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>שכר רווחה</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-muted-foreground">
              נתונים מתא F35
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>התפלגות שכר לפי מחלקות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              עוגת חלוקה של עלויות שכר
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>מגמות שכר רבעוניות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              גרף קווים של התפתחות עלויות השכר
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>השוואות היסטוריות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            טבלה של נתוני שכר לאורך זמן עם אחוזי שינוי
          </div>
        </CardContent>
      </Card>
    </div>
  );
}