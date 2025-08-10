import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navigation from "@/components/Layout/Navigation";
import OverviewDashboard from "@/components/Dashboard/OverviewDashboard";
import FinanceDashboard from "@/components/Dashboard/FinanceDashboard";
import EducationDashboard from "@/components/Dashboard/EducationDashboard";
import EngineeringDashboard from "@/components/Dashboard/EngineeringDashboard";
import WelfareDashboard from "@/components/Dashboard/WelfareDashboard";
import NonFormalDashboard from "@/components/Dashboard/NonFormalDashboard";
import BusinessDashboard from "@/components/Dashboard/BusinessDashboard";
import TasksApp from "@/components/Tasks/TasksApp";
import { useAuth } from "@/context/AuthContext";
export default function Dashboard() {
  const location = useLocation();
  const path = location.pathname;
  const { role, departments } = useAuth();

  const sectionByPath: Record<string, string> = {
    "/": "overview",
    "/overview": "overview",
    "/finance": "finance",
    "/education": "education",
    "/engineering": "engineering",
    "/welfare": "welfare",
    "/non-formal": "non-formal",
    "/business": "business",
    "/tasks": "tasks",
  };
  const currentSection = sectionByPath[path] || "overview";

  // Basic client-side permission gate: if manager tries to access other department, fallback to overview
  // Note: Full data-level enforcement remains via RLS (per-user rows)


  useEffect(() => {
    const titles: Record<string, string> = {
      "overview": "סקירה כללית - דאשבורד עירוני",
      "finance": "מחלקת פיננסים - דאשבורד עירוני",
      "education": "מחלקת חינוך - דאשבורד עירוני",
      "engineering": "מחלקת הנדסה - דאשבורד עירוני",
      "welfare": "מחלקת רווחה - דאשבורד עירוני",
      "non-formal": "חינוך בלתי פורמאלי - דאשבורד עירוני",
      "business": "רישוי עסקים - דאשבורד עירוני",
      "tasks": "משימות - דאשבורד עירוני",
    };
    const descriptions: Record<string, string> = {
      "overview": "סקירה כללית של מדדי העירייה וכל המחלקות במקום אחד.",
      "finance": "דאשבורד פיננסים: תקציב, ביצוע, מענקים והתראות חריגה.",
      "education": "דאשבורד חינוך: תלמידים, מוסדות, כיתות והתפלגויות.",
      "engineering": "דאשבורד הנדסה: תוכניות, סטטוסים, ייעודי קרקע ומפות.",
      "welfare": "דאשבורד רווחה: מקבלי שירות, שירותים, מגמות ופילוחים.",
      "non-formal": "חינוך בלתי פורמאלי: תוכניות, משתתפים, מגמות והשתתפות.",
      "business": "רישוי עסקים: סטטוס רישיונות, סוגי עסקים והתראות.",
      "tasks": "ניהול משימות בין ראש העיר לראשי מחלקות: תעדוף, סטטוס ודד-ליין.",
    };

    document.title = titles[currentSection] || "דאשבורד עירוני";

    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', descriptions[currentSection] || 'דאשבורד עירוני - מערכת נתונים עירונית.');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    const url = window.location.origin + path;
    canonical.setAttribute('href', url);
  }, [currentSection, path]);

  const renderDashboard = () => {
    // Access control: if not mayor and section is department not in permissions -> show overview
    if (role !== 'mayor' && role !== 'ceo' && [
      'finance','education','engineering','welfare','non-formal','business']
      .includes(currentSection) && !departments.includes(currentSection as any)) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">אין לך הרשאה לגשת למחלקה זו. הועברת לסקירה כללית.</div>
          <OverviewDashboard />
        </div>
      );
    }

    switch (currentSection) {
      case "overview":
        return <OverviewDashboard />;
      case "finance":
        return <FinanceDashboard />;
      case "education":
        return <EducationDashboard />;
      case "engineering":
        return <EngineeringDashboard />;
      case "welfare":
        return <WelfareDashboard />;
      case "non-formal":
        return <NonFormalDashboard />;
      case "business":
        return <BusinessDashboard />;
      case "tasks":
        return <TasksApp />;
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <Navigation />
      
      <main className="flex-1 p-6">
        <div className="container">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}