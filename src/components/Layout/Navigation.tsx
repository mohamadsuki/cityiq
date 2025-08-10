import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  GraduationCap,
  Building2,
  Users,
  Activity,
  Store,
  Menu,
  X,
  Home
} from "lucide-react";

interface NavigationProps {
  currentSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  { id: "overview", name: "סקירה כללית", icon: Home },
  { id: "finance", name: "מחלקת פיננסים", icon: BarChart3 },
  { id: "education", name: "מחלקת חינוך", icon: GraduationCap },
  { id: "engineering", name: "מחלקת הנדסה", icon: Building2 },
  { id: "welfare", name: "מחלקת רווחה", icon: Users },
  { id: "non-formal", name: "חינוך בלתי פורמאלי", icon: Activity },
  { id: "business", name: "רישוי עסקים", icon: Store },
];

export default function Navigation({ currentSection, onSectionChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 right-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* Navigation Sidebar */}
      <Card className={`
        fixed top-0 right-0 h-screen w-80 z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        md:relative md:w-80 md:transform-none
        border-l border-border shadow-elevated bg-card
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              דאשבורד עירוני
            </h1>
            <p className="text-muted-foreground">
              מערכת ניהול נתונים עירונית מתקדמת
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    w-full justify-start h-12 text-right
                    ${isActive 
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                      : 'hover:bg-secondary/80'
                    }
                  `}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="ml-3 h-5 w-5" />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
                      פעיל
                    </Badge>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Footer Info */}
          <div className="mt-8 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              מערכת דאשבורד עירונית
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              גרסה 1.0
            </p>
          </div>
        </div>
      </Card>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}