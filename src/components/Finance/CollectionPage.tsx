import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CollectionPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold mb-2">גביה</h1>
        <p className="text-muted-foreground">
          מעקב גביה וארנונה - נתונים מ"טיוטת מאזן RAW"
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>טבלת גביה שנתית</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              בפיתוח - תוצג כאן טבלת הגביה מקובץ "טיוטת מאזן RAW"
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>תקציב שנתי ארנונה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                עוגת חלוקה לפי סוג נכס
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תקציב יחסי ארנונה</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                עוגת חלוקה לפי סוג נכס
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>גביה בפועל</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                עוגת חלוקה לפי סוג נכס
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>עודף/גרעון</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                סטטיסטיקות עודף/גרעון
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>הכנסות אחרות (בפיתוח)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              הכנסות שלא מארנונה - בפיתוח עתידי
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}