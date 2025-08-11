import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthActions } from "./AuthActions";
import {
  BarChart3,
  GraduationCap,
  Building2,
  Users,
  Activity,
  Store,
  ClipboardList,
  Menu,
  X,
  Home,
  Megaphone
} from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DataUploader } from "@/components/shared/DataUploader";
import { useAuth } from "@/context/AuthContext";
import GlobalLogo from "@/components/Layout/GlobalLogo";

const navigationItems = [
  { id: "overview", name: "סקירה כללית", icon: Home, url: "/" },
  { id: "tasks", name: "משימות", icon: ClipboardList, url: "/tasks" },
  { id: "projects", name: "פרויקטים", icon: Building2, url: "/projects" },
  { id: "grants", name: "קולות קוראים", icon: Megaphone, url: "/grants" },
  { id: "finance", name: "מחלקת פיננסים", icon: BarChart3, url: "/finance" },
  { id: "education", name: "מחלקת חינוך", icon: GraduationCap, url: "/education" },
  { id: "engineering", name: "מחלקת הנדסה", icon: Building2, url: "/engineering" },
  { id: "welfare", name: "מחלקת רווחה", icon: Users, url: "/welfare" },
  { id: "non-formal", name: "חינוך בלתי פורמאלי", icon: Activity, url: "/non-formal" },
  { id: "business", name: "רישוי עסקים", icon: Store, url: "/business" },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;
  const { role, departments } = useAuth();

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
            <div className="flex items-center gap-2">
              <GlobalLogo inline />
              <NavLink to="/" onClick={() => setIsOpen(false)} className="text-2xl font-bold text-foreground hover:underline focus:outline-none">
                דאשבורד עירוני
              </NavLink>
            </div>
            <div className="mt-3">
              <AuthActions />
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            {navigationItems
              .filter((item) => {
                if (!role || role === 'mayor' || role === 'ceo') return true;
                // Always allow overview and global modules
                if (['overview','tasks','grants','projects'].includes(item.id)) return true;
                // Allow only permitted departments for managers
                return departments.includes(item.id as any);
              })
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.url;

                return (
                  <Button
                    key={item.id}
                    asChild
                    variant={isActive ? "default" : "ghost"}
                    className={`
                    w-full justify-start h-12 text-right
                    ${isActive 
                      ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                      : 'hover:bg-secondary/80'
                    }
                  `}
                  >
                    <NavLink to={item.url} onClick={() => setIsOpen(false)}>
                      <span className="flex items-center w-full">
                        <Icon className="ml-3 h-5 w-5" />
                        <span className="flex-1">{item.name}</span>
                        {isActive && (
                          <Badge variant="secondary" className="bg-white/20 text-primary-foreground">
                            פעיל
                          </Badge>
                        )}
                      </span>
                    </NavLink>
                  </Button>
                );
              })}
          </nav>

          <div className="mt-4">
            <Button className="w-full" onClick={() => setImportOpen(true)}>
              ייבוא נתונים
            </Button>
          </div>

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

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ייבוא נתונים</DialogTitle>
            <DialogDescription>טעינת CSV/XLSX עם זיהוי יעד אוטומטי</DialogDescription>
          </DialogHeader>
          <DataUploader context="global" />
        </DialogContent>
      </Dialog>

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