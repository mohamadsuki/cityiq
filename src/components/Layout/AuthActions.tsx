import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demoAccess";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const DEPT_LABELS: Record<DepartmentSlug, string> = {
  finance: "כספים",
  education: "חינוך",
  engineering: "הנדסה",
  welfare: "רווחה",
  "non-formal": "חינוך בלתי פורמלי",
  business: "עסקים",
  ceo: "מנכ\"ל",
};

export function AuthActions() {
  const { user, role, departments, signOut } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => nav('/')}
          aria-label="דף הבית">
          <Home className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => nav('/auth')}>
          התחברות
        </Button>
      </div>
    );
  }

  const email = user.email ?? '';
  const demo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  const displayName = (user as any)?.user_metadata?.full_name || demo?.displayName || (email.split('@')[0] || 'משתמש');
  const avatarUrl = (user as any)?.user_metadata?.avatar_url || '/placeholder.svg';
  const heRole = role === 'mayor' ? 'ראש העיר' : role === 'ceo' ? 'מנכ"ל' : 'מנהל/ת';
  const initials = displayName?.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() || 'U';
  const hebDepartments = (departments || []).map((d) => DEPT_LABELS[d] || d).join(', ');

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="ghost" onClick={() => nav('/')} aria-label="דף הבית">
        <Home className="h-4 w-4" />
      </Button>

      {role && <Badge variant="secondary" className="whitespace-nowrap">{heRole}</Badge>}

      {hebDepartments && (
        <Badge variant="outline" className="hidden md:inline-flex max-w-[12rem] truncate" title={hebDepartments}>
          {hebDepartments}
        </Badge>
      )}

      <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-border bg-background/60">
        <Avatar className="h-6 w-6">
          <AvatarImage src={avatarUrl} alt={`תמונת ${displayName}`} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm text-foreground max-w-[8rem] truncate" title={displayName}>{displayName}</span>
      </div>

      <Button size="sm" variant="ghost" onClick={() => nav('/profile')}>עריכת פרופיל</Button>
      <Button size="sm" variant="outline" onClick={signOut}>התנתקות</Button>
    </div>
  );
}
