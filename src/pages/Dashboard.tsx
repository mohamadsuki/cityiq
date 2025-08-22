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
import GovernmentBudgetsDashboard from "@/components/Dashboard/GovernmentBudgetsDashboard";
import GrantsApp from "@/components/Grants/GrantsApp";
import ProjectsApp from "@/components/Projects/ProjectsApp";
import TasksApp from "@/components/Tasks/TasksApp";
import RegularBudgetPage from "@/components/Finance/RegularBudgetPage";
import TabarimPage from "@/components/Finance/TabarimPage";
import CollectionPage from "@/components/Finance/CollectionPage";
import SalaryPage from "@/components/Finance/SalaryPage";
import BudgetAuthorizationsPage from "@/components/GovernmentBudgets/BudgetAuthorizationsPage";
import { useAuth } from "@/context/AuthContext";
import ProfilePage from "@/components/Profile/ProfilePage";
import { PublicInquiriesPage } from "@/components/PublicInquiries/PublicInquiriesPage";
export default function Dashboard() {
  const location = useLocation();
  const path = location.pathname;
  const { role, departments } = useAuth();

  const sectionByPath: Record<string, string> = {
    "/": "overview",
    "/overview": "overview",
    "/finance": "finance",
    "/finance/regular-budget": "finance-regular-budget",
    "/finance/tabarim": "finance-tabarim",
    "/finance/collection": "finance-collection",
    "/finance/salary": "finance-salary",
    "/education": "education",
    "/engineering": "engineering",
    "/welfare": "welfare",
    "/non-formal": "non-formal",
    "/business": "business",
    "/government-budgets": "government-budgets",
    "/government-budgets/authorizations": "government-budgets-authorizations",
    "/grants": "grants",
    "/projects": "projects",
    "/tasks": "tasks",
    "/inquiries": "inquiries",
    "/profile": "profile",
  };
  const currentSection = sectionByPath[path] || "overview";

  // Basic client-side permission gate: if manager tries to access other department, fallback to overview
  // Note: Full data-level enforcement remains via RLS (per-user rows)


  useEffect(() => {
    const titles: Record<string, string> = {
      "overview": "סקירה כללית - דאשבורד עירוני",
      "finance": "מחלקת פיננסים - דאשבורד עירוני",
      "finance-regular-budget": "תקציב רגיל - מחלקת פיננסים",
      "finance-tabarim": "תב\"רים - מחלקת פיננסים",
      "finance-collection": "גביה - מחלקת פיננסים",
      "finance-salary": "שכר - מחלקת פיננסים",
      "education": "מחלקת חינוך - דאשבורד עירוני",
      "engineering": "מחלקת הנדסה - דאשבורד עירוני",
      "welfare": "מחלקת רווחה - דאשבורד עירוני",
      "non-formal": "חינוך בלתי פורמאלי - דאשבורד עירוני",
      "business": "רישוי עסקים - דאשבורד עירוני",
      "government-budgets": "תקציבים ממשלתיים ותמיכות - דאשבורד עירוני",
      "government-budgets-authorizations": "הרשאות תקציביות - דאשבורד עירוני",
      "grants": "קולות קוראים - דאשבורד עירוני",
      "projects": "פרויקטים - דאשבורד עירוני",
      "tasks": "משימות - דאשבורד עירוני",
      "inquiries": "פניות ציבור - דאשבורד עירוני",
      "profile": "פרופיל משתמש - דאשבורד עירוני",
    };
    const descriptions: Record<string, string> = {
      "overview": "סקירה כללית של מדדי העירייה וכל המחלקות במקום אחד.",
      "finance": "דאשבורד פיננסים: תקציב, ביצוע, מענקים והתראות חריגה.",
      "finance-regular-budget": "תצוגה מפורטת של התקציב הרגיל עם גרפים ותחזיות.",
      "finance-tabarim": "ניהול תב\"רים עירוניים: הוספה, עריכה ומעקב סטטוס.",
      "finance-collection": "מעקב גביה וארנונה: נתונים מהמאזן והתראות פיגורים.",
      "finance-salary": "מעקב נתוני שכר: התפלגות לפי מחלקות ומגמות עלויות.",
      "education": "דאשבורד חינוך: תלמידים, מוסדות, כיתות והתפלגויות.",
      "engineering": "דאשבורד הנדסה: תוכניות, סטטוסים, ייעודי קרקע ומפות.",
      "welfare": "דאשבורד רווחה: מקבלי שירות, שירותים, מגמות ופילוחים.",
      "non-formal": "חינוך בלתי פורמאלי: תוכניות, משתתפים, מגמות והשתתפות.",
      "business": "רישוי עסקים: סטטוס רישיונות, סוגי עסקים והתראות.",
      "government-budgets": "תקציבים ממשלתיים ותמיכות: ניהול קולות קוראים והרשאות תקציביות.",
      "government-budgets-authorizations": "הרשאות תקציביות: ניהול הרשאות תקציביות ממשלתיות ומעקב סטטוס.",
      "grants": "קולות קוראים: סטטוס בקשות, החלטות ומשרדים.",
      "projects": "פרויקטים עירוניים: סטטוס, התקדמות ועלויות.",
      "tasks": "ניהול משימות בין ראש העיר לראשי מחלקות: תעדוף, סטטוס ודד-ליין.",
      "inquiries": "ניהול פניות ציבור: טיפול בפניות מוותסאפ, אימייל ופניות ישירות.",
      "profile": "עריכת פרופיל משתמש: שם ותמונת פרופיל.",
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
      'finance','education','engineering','welfare','non-formal','business','government-budgets']
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
      case "finance-regular-budget":
        return <RegularBudgetPage />;
      case "finance-tabarim":
        return <TabarimPage />;
      case "finance-collection":
        return <CollectionPage />;
      case "finance-salary":
        return <SalaryPage />;
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
      case "government-budgets":
        return <GovernmentBudgetsDashboard />;
      case "government-budgets-authorizations":
        return <BudgetAuthorizationsPage />;
      case "grants":
        return <GrantsApp />;
      case "projects":
        return <ProjectsApp />;
      case "tasks":
        return <TasksApp />;
      case "inquiries":
        return <PublicInquiriesPage />;
      case "profile":
        return <ProfilePage />;
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