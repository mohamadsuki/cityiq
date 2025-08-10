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
export default function Dashboard() {
  const location = useLocation();
  const path = location.pathname;

  const sectionByPath: Record<string, string> = {
    "/": "overview",
    "/overview": "overview",
    "/finance": "finance",
    "/education": "education",
    "/engineering": "engineering",
    "/welfare": "welfare",
    "/non-formal": "non-formal",
    "/business": "business",
  };
  const currentSection = sectionByPath[path] || "overview";

  useEffect(() => {
    const titles: Record<string, string> = {
      "overview": "סקירה כללית - דאשבורד עירוני",
      "finance": "מחלקת פיננסים - דאשבורד עירוני",
      "education": "מחלקת חינוך - דאשבורד עירוני",
      "engineering": "מחלקת הנדסה - דאשבורד עירוני",
      "welfare": "מחלקת רווחה - דאשבורד עירוני",
      "non-formal": "חינוך בלתי פורמאלי - דאשבורד עירוני",
      "business": "רישוי עסקים - דאשבורד עירוני",
    };
    document.title = titles[currentSection] || "דאשבורד עירוני";
  }, [currentSection]);

  const renderDashboard = () => {
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
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <Navigation />
      
      <main className="flex-1 p-6 mr-0 md:mr-80">
        <div className="max-w-7xl mx-auto">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}