import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddTabarDialog from "./AddTabarDialog";

export default function TabarimPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">תב"רים</h1>
          <p className="text-muted-foreground">
            ניהול תב"רים עירוניים - הוספה, עריכה ומעקב סטטוס
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-2" />
          הוסף תב"ר
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>רשימת תב"רים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              בפיתוח - תוצג כאן טבלת תב"רים עם אפשרות סינון ועריכה
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>תב"רים לפי תחום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                עוגת חלוקה
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>תב"רים לפי סטטוס</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                גרף עמודות
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סיכום תקציבי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                KPIs תקציביים
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddTabarDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSaved={() => setShowAddDialog(false)}
      />
    </div>
  );
}