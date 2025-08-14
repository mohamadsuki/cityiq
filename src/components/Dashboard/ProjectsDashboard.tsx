import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Building2, ListChecks, BarChart3, Target, Calendar, CheckCircle } from "lucide-react";

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

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  variant = "default" 
}: { 
  title: string; 
  value: string; 
  description: string; 
  icon: any; 
  variant?: "default" | "active" | "completed" | "outlined" 
}) => {
  const getCardStyles = () => {
    switch (variant) {
      case "active":
        return "bg-primary/10 border-primary";
      case "completed":
        return "bg-green-50 border-green-200";
      case "outlined":
        return "bg-background border-2 border-dashed border-muted-foreground/30";
      default:
        return "bg-muted/50 border-muted";
    }
  };

  return (
    <Card className={`${getCardStyles()} transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
          <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
        <div className="space-y-1">
          <div className="font-medium text-sm text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground leading-relaxed">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ProjectsDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">פרויקטים</h1>
          <p className="text-sm text-muted-foreground">ניהול פרויקטים עירוניים לפי מחלקות</p>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-red-700">12</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-red-800">פרויקטים בעיכוב</div>
              <div className="text-sm text-red-600">התקדמות פחות מ-10% כבר יותר מחודש</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <ListChecks className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold text-blue-700">85</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-blue-800">פרויקטים בביצוע ותכנון</div>
              <div className="text-sm text-blue-600">45 בביצוע, 40 בתכנון</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-green-700">₪180M</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-green-800">התפלגות לפי מחלקות</div>
              <div className="text-sm text-green-600">הנדסה: ₪120M, חינוך: ₪35M, רווחה: ₪25M</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="text-3xl font-bold text-purple-700">127</div>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-purple-800">סה״כ פרויקטים פעילים</div>
              <div className="text-sm text-purple-600">פרויקטים פעילים בכל המחלקות</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">חתום</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="signed">חתום</SelectItem>
                  <SelectItem value="unsigned">לא חתום</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">סטטוס</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="planning">תכנון</SelectItem>
                  <SelectItem value="active">בביצוע</SelectItem>
                  <SelectItem value="completed">הושלם</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">מחלקה</label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="הכל" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="engineering">הנדסה</SelectItem>
                  <SelectItem value="education">חינוך</SelectItem>
                  <SelectItem value="welfare">רווחה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">חיפוש</label>
              <Input placeholder="חיפוש לפי שם/קוד" className="bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Projects Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            פרויקטים
            <span className="text-sm text-muted-foreground mr-auto">ניהול פרויקטים עירוניים לפי מחלקות</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-2 font-medium text-foreground">שם</th>
                  <th className="text-right p-2 font-medium text-foreground">קוד</th>
                  <th className="text-right p-2 font-medium text-foreground">מחלקה</th>
                  <th className="text-right p-2 font-medium text-foreground">סטטוס</th>
                  <th className="text-right p-2 font-medium text-foreground">תחום</th>
                  <th className="text-right p-2 font-medium text-foreground">תקציב מאושר</th>
                  <th className="text-right p-2 font-medium text-foreground">תקציב מבוצע</th>
                  <th className="text-right p-2 font-medium text-foreground">התקדמות</th>
                  <th className="text-right p-2 font-medium text-foreground">פעילות</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-muted/50">
                  <td className="p-2 text-foreground">צוף מסחרי</td>
                  <td className="p-2 text-muted-foreground">—</td>
                  <td className="p-2 text-muted-foreground">הנדסה</td>
                  <td className="p-2">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">תכנון</Badge>
                  </td>
                  <td className="p-2 text-muted-foreground">מבני ציבור</td>
                  <td className="p-2 text-muted-foreground">₪58,000,000</td>
                  <td className="p-2 text-muted-foreground">₪600</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Progress value={7} className="w-20" />
                      <span className="text-sm text-muted-foreground">7%</span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Badge variant="destructive" className="text-xs">מחיקה</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
