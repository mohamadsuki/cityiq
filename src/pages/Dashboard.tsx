import { useState } from "react";
import Navigation from "@/components/Layout/Navigation";
import OverviewDashboard from "@/components/Dashboard/OverviewDashboard";
import FinanceDashboard from "@/components/Dashboard/FinanceDashboard";
import EducationDashboard from "@/components/Dashboard/EducationDashboard";

export default function Dashboard() {
  const [currentSection, setCurrentSection] = useState("overview");

  const renderDashboard = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewDashboard />;
      case "finance":
        return <FinanceDashboard />;
      case "education":
        return <EducationDashboard />;
      case "engineering":
        return (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">מחלקת הנדסה</h1>
            <p className="text-muted-foreground">דאשבורד זה יפותח בשלב הבא</p>
          </div>
        );
      case "welfare":
        return (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">מחלקת רווחה</h1>
            <p className="text-muted-foreground">דאשבורד זה יפותח בשלב הבא</p>
          </div>
        );
      case "non-formal":
        return (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">חינוך בלתי פורמאלי</h1>
            <p className="text-muted-foreground">דאשבורד זה יפותח בשלב הבא</p>
          </div>
        );
      case "business":
        return (
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">רישוי עסקים</h1>
            <p className="text-muted-foreground">דאשבורד זה יפותח בשלב הבא</p>
          </div>
        );
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      <Navigation 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection} 
      />
      
      <main className="flex-1 p-6 mr-0 md:mr-80">
        <div className="max-w-7xl mx-auto">
          {renderDashboard()}
        </div>
      </main>
    </div>
  );
}