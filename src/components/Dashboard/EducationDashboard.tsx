import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  TrendingUp,
  MapPin,
  FileSpreadsheet
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import MapboxMap from "@/components/shared/Map/MapboxMap";
import { MapboxTokenField } from "@/components/shared/Map/MapboxTokenField";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import ExecutiveTasksBanner from "@/components/Tasks/ExecutiveTasksBanner";

const educationData = [
  { level: "יסודי", students: 8420, institutions: 24, ratio: 35.1 },
  { level: "חט״ב", students: 3680, institutions: 12, ratio: 30.7 },
  { level: "תיכון", students: 4250, institutions: 8, ratio: 53.1 },
  { level: "חינוך מיוחד", students: 420, institutions: 3, ratio: 14.0 },
];

const institutionsData = [
  { name: "בית ספר אורט הרצליה", students: 1250, classes: 42, level: "תיכון", occupancy: 95 },
  { name: "יסודי בן גוריון", students: 580, classes: 24, level: "יסודי", occupancy: 87 },
  { name: "חט״ב רמז", students: 420, classes: 18, level: "חט״ב", occupancy: 78 },
  { name: "תיכון מקיף א'", students: 890, classes: 32, level: "תיכון", occupancy: 92 },
  { name: "יסודי הירדן", students: 360, classes: 16, level: "יסודי", occupancy: 75 },
  { name: "חינוך מיוחד אלון", students: 85, classes: 8, level: "מיוחד", occupancy: 68 },
];

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd'];

const getOccupancyColor = (occupancy: number) => {
  if (occupancy >= 90) return 'text-destructive';
  if (occupancy >= 80) return 'text-warning';
  return 'text-success';
};

const getLevelBadgeVariant = (level: string) => {
  switch (level) {
    case 'יסודי': return 'default';
    case 'חט״ב': return 'secondary';
    case 'תיכון': return 'outline';
    case 'מיוחד': return 'destructive';
    default: return 'default';
  }
};

export default function EducationDashboard() {
  const totalStudents = educationData.reduce((sum, item) => sum + item.students, 0);
  const totalInstitutions = educationData.reduce((sum, item) => sum + item.institutions, 0);
  const totalClasses = institutionsData.reduce((sum, item) => sum + item.classes, 0);
  const avgRatio = totalStudents / totalClasses;
  const overCapacity = institutionsData.filter(i => i.occupancy >= 90);

  type EduProject = { id: string; name: string | null; status: string | null; progress: number | null };
  const [eduProjects, setEduProjects] = useState<EduProject[]>([]);
  const [projLoading, setProjLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setProjLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('id,name,status,progress,department_slug')
        .eq('department_slug', 'education')
        .limit(6);
      if (isMounted) {
        if (!error && data) {
          setEduProjects(data as any);
        } else {
          setEduProjects([]);
        }
        setProjLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">מחלקת חינוך</h1>
          <p className="text-muted-foreground text-lg">ניהול ומעקב מערכת החינוך העירונית</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 ml-2" /> ייבוא נתונים
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ייבוא נתונים למחלקת חינוך</DialogTitle>
            </DialogHeader>
            <DataUploader context="education" />
          </DialogContent>
        </Dialog>
      </div>

      <ExecutiveTasksBanner department="education" />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">סה״כ תלמידים</p>
                <p className="text-3xl font-bold text-foreground">{totalStudents.toLocaleString()}</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">+2.3%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">מוסדות חינוך</p>
                <p className="text-3xl font-bold text-foreground">{totalInstitutions}</p>
                <p className="text-sm text-muted-foreground">פעילים</p>
              </div>
              <div className="h-12 w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">סה״כ כיתות</p>
                <p className="text-3xl font-bold text-foreground">{totalClasses}</p>
                <p className="text-sm text-muted-foreground">כיתות פעילות</p>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">יחס ממוצע</p>
                <p className="text-3xl font-bold text-foreground">{avgRatio.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">תלמידים לכיתה</p>
              </div>
              <div className="h-12 w-12 bg-warning rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-warning-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students by Level Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התפלגות תלמידים לפי שלבי חינוך</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={educationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="level" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    value.toLocaleString(),
                    name === 'students' ? 'תלמידים' : 'מוסדות'
                  ]}
                />
                <Bar dataKey="students" fill="hsl(var(--primary))" name="תלמידים" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התפלגות תלמידים</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={educationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="students"
                  label={({ level, students }) => `${level}: ${students}`}
                >
                  {educationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value.toLocaleString(), 'תלמידים']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {educationData.map((item, index) => (
          <Card key={index} className="shadow-card">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.level}</h3>
                  <Badge variant={getLevelBadgeVariant(item.level)}>
                    {item.institutions} מוסדות
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{item.students.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  יחס: {item.ratio} תלמידים לכיתה
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Projects Preview (Education) */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">פרויקטים במחלקת חינוך</CardTitle>
            <Button asChild>
              <Link to="/projects?department=education">ניהול פרויקטים</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projLoading && (
              <div className="p-4 rounded-md bg-muted">טוען פרויקטים…</div>
            )}
            {!projLoading && eduProjects.length === 0 && (
              <>
                <div className="p-4 rounded-md bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">פתיחת שנת לימודים 2025</div>
                    <Badge>בתהליך</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-40"><Progress value={48} /></div>
                    <span className="text-sm text-muted-foreground">48%</span>
                  </div>
                </div>
                <div className="p-4 rounded-md bg-muted">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">קייטנת קיץ אלחוארנה</div>
                    <Badge variant="secondary">הושלם</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-40"><Progress value={100} /></div>
                    <span className="text-sm text-muted-foreground">100%</span>
                  </div>
                </div>
              </>
            )}
            {!projLoading && eduProjects.map((p) => (
              <div key={p.id} className="p-4 rounded-md bg-muted">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{p.name}</div>
                  {p.status ? <Badge>{p.status}</Badge> : <span className="text-muted-foreground text-sm">—</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-40"><Progress value={p.progress ?? 0} /></div>
                  <span className="text-sm text-muted-foreground">{p.progress ?? 0}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

{/* Institutions Map */}
<Card className="shadow-card">
  <CardHeader><CardTitle className="text-xl">מפת מוסדות</CardTitle></CardHeader>
  <CardContent>
    <div className="space-y-3">
      <MapboxTokenField />
      <MapboxMap height={360} />
    </div>
  </CardContent>
</Card>

{/* התראות תפוסת יתר */}
{overCapacity.length > 0 && (
  <Card className="shadow-card">
    <CardHeader><CardTitle className="text-xl">אזהרות תפוסת יתר</CardTitle></CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {overCapacity.map((i, idx) => (
          <div key={idx} className="p-3 rounded-md border bg-card">
            <div className="flex items-center justify-between">
              <span className="font-medium">{i.name}</span>
              <Badge variant="destructive">{i.occupancy}%</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">מעל 90% תפוסה</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)}

{/* Institutions Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">מוסדות חינוך</CardTitle>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" size="sm">
                <MapPin className="h-4 w-4 mr-2" />
                מפה
              </Button>
              <Button variant="outline" size="sm">
                ייצוא
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {institutionsData.map((institution, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-foreground">{institution.name}</h3>
                    <Badge variant={getLevelBadgeVariant(institution.level)} className="mt-1">
                      {institution.level}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{institution.students}</p>
                    <p className="text-sm text-muted-foreground">תלמידים</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{institution.classes}</p>
                    <p className="text-sm text-muted-foreground">כיתות</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getOccupancyColor(institution.occupancy)}`}>
                      {institution.occupancy}%
                    </p>
                    <p className="text-sm text-muted-foreground">תפוסה</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}