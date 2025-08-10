import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { Building2, MapPin, Layers, CheckCircle2, Clock, Wrench } from "lucide-react";

const statusData = [
  { status: "בהכנה", value: 12 },
  { status: "בהליך אישור", value: 8 },
  { status: "אושרה", value: 5 },
  { status: "בביצוע", value: 3 },
  { status: "הושלמה", value: 2 },
];

const landUseData = [
  { use: "מגורים", area: 420 },
  { use: "מסחר", area: 180 },
  { use: "תעשייה", area: 120 },
  { use: "ציבור", area: 90 },
  { use: "שטח פתוח", area: 260 },
];

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--warning))"];

export default function EngineeringDashboard() {
  const totalPlans = statusData.reduce((s, i) => s + i.value, 0);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">מחלקת הנדסה</h1>
        <p className="text-muted-foreground text-lg">תכנון, סטטוסים וייעודי קרקע</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">סה"כ תוכניות</p>
                <p className="text-3xl font-bold text-foreground">{totalPlans}</p>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">בתהליך אישור</p>
                <p className="text-3xl font-bold text-foreground">{statusData[1].value}</p>
              </div>
              <div className="h-12 w-12 bg-warning rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">אושרו השנה</p>
                <p className="text-3xl font-bold text-foreground">{statusData[2].value}</p>
              </div>
              <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">שטח בתכנון (דונם)</p>
                <p className="text-3xl font-bold text-foreground">{landUseData.reduce((s,i)=>s+i.area,0)}</p>
              </div>
              <div className="h-12 w-12 bg-accent rounded-lg flex items-center justify-center">
                <Layers className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">סטטוס תוכניות (דונאט)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">ייעודי קרקע (מוערם)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={landUseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="use" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="area" name="שטח" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">מפת תוכניות <Badge variant="secondary" className="ml-2">דמו</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> מפה תתווסף בהמשך</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
