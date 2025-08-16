import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegularBudgetPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold mb-2">תקציב רגיל</h1>
        <p className="text-muted-foreground">
          תצוגה מפורטת של התקציב הרגיל עם גרפים וניתוחים
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>טבלת תקציב רגיל</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              בפיתוח - יוצג כאן נתוני התקציב הרגיל מהאקסל
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>הכנסות - תקציב מול ביצוע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                גרף עמודות הכנסות
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הוצאות - תקציב מול ביצוע</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                גרף עמודות הוצאות
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}