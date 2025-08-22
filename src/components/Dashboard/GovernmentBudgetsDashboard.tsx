import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Megaphone, FileCheck } from "lucide-react";

export default function GovernmentBudgetsDashboard() {
  const navigate = useNavigate();

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
    </div>
  );
}