import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Cell,
  LineChart,
  Line
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

const budgetData = [
  { name: "חינוך", approved: 890, actual: 720, percentage: 81 },
  { name: "הנדסה", approved: 650, actual: 435, percentage: 67 },
  { name: "רווחה", approved: 320, actual: 285, percentage: 89 },
  { name: "תרבות", approved: 180, actual: 137, percentage: 76 },
  { name: "ביטחון", approved: 240, actual: 221, percentage: 92 },
];

const projectsData = [
  { name: "תב״ר 2024-001", title: "שיפוץ בתי ספר", budget: "12M", spent: "8.5M", progress: 71, status: "בביצוע" },
  { name: "תב״ר 2024-002", title: "פארק עירוני חדש", budget: "25M", spent: "15.2M", progress: 61, status: "בביצוע" },
  { name: "תב״ר 2024-003", title: "מרכז קהילתי", budget: "8M", spent: "7.9M", progress: 99, status: "כמעט הושלם" },
  { name: "תב״ר 2024-004", title: "תשתיות דיגיטליות", budget: "18M", spent: "4.2M", progress: 23, status: "התחלה" },
];

const grantsData = [
  { ministry: "משרד החינוך", amount: "45M", status: "approved" },
  { ministry: "משרד הפנים", amount: "32M", status: "pending" },
  { ministry: "משרד הבריאות", status: "rejected", amount: "12M" },
  { ministry: "משרד התחבורה", amount: "67M", status: "approved" },
];

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'bg-success text-success-foreground';
    case 'pending': return 'bg-warning text-warning-foreground';
    case 'rejected': return 'bg-destructive text-destructive-foreground';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'approved': return 'אושר';
    case 'pending': return 'בהמתנה';
    case 'rejected': return 'נדחה';
    default: return 'לא ידוע';
  }
};

export default function FinanceDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">מחלקת פיננסים</h1>
        <p className="text-muted-foreground text-lg">
          ניהול תקציב ומעקב פיננסי עירוני
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">תקציב שנתי מאושר</p>
                <p className="text-3xl font-bold text-foreground">₪2.4B</p>
              </div>
              <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">ביצוע מצטבר</p>
                <p className="text-3xl font-bold text-foreground">₪1.8B</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">75%</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                <BarChart className="h-6 w-6 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">עודף/גרעון</p>
                <p className="text-3xl font-bold text-success">₪320M</p>
                <p className="text-sm text-muted-foreground">עודף</p>
              </div>
              <div className="h-12 w-12 bg-success rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">פרויקטים פעילים</p>
                <p className="text-3xl font-bold text-foreground">47</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">תב״רים</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Execution Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">ביצוע תקציב לפי מחלקות</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `₪${value}M`, 
                    name === 'approved' ? 'מאושר' : 'בוצע'
                  ]}
                />
                <Bar dataKey="approved" fill="hsl(var(--muted))" name="מאושר" />
                <Bar dataKey="actual" fill="hsl(var(--primary))" name="בוצע" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Budget Distribution Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">התפלגות תקציב</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="actual"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {budgetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₪${value}M`, 'תקציב']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projects Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">תב״רים ופרויקטים מיוחדים</CardTitle>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              ייצוא דוח
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectsData.map((project, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{project.title}</h3>
                    <p className="text-sm text-muted-foreground">{project.name}</p>
                  </div>
                  <Badge variant="outline">
                    {project.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">תקציב מאושר</p>
                    <p className="font-semibold">₪{project.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">בוצע עד כה</p>
                    <p className="font-semibold">₪{project.spent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">התקדמות</p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Progress value={project.progress} className="flex-1" />
                      <span className="text-sm font-medium">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grants and Funding */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">קולות קוראים ומענקים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {grantsData.map((grant, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{grant.ministry}</h3>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {grant.status === 'approved' && <CheckCircle className="h-4 w-4 text-success" />}
                    {grant.status === 'pending' && <Clock className="h-4 w-4 text-warning" />}
                    {grant.status === 'rejected' && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                </div>
                <p className="text-lg font-bold">₪{grant.amount}</p>
                <Badge className={getStatusColor(grant.status)}>
                  {getStatusText(grant.status)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}