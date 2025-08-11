import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demoAccess";
import { useNavigate } from "react-router-dom";

export function AuthActions() {
  const { user, role, signOut } = useAuth();
  const nav = useNavigate();

  if (!user) {
    return (
      <Button size="sm" variant="outline" onClick={() => nav('/auth')}>
        התחברות
      </Button>
    );
  }

  const email = user.email ?? '';
  const demo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  const displayName = (user as any)?.user_metadata?.full_name || demo?.displayName || (email.split('@')[0] || 'משתמש');
  const avatarUrl = (user as any)?.user_metadata?.avatar_url || '/placeholder.svg';
  const heRole = role === 'mayor' ? 'ראש העיר' : role === 'ceo' ? 'מנכ"ל' : 'מנהל/ת';
  const initials = displayName?.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() || 'U';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={`תמונת ${displayName}`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <div className="text-sm font-medium text-foreground">{displayName}</div>
          {role && <div className="text-xs text-muted-foreground">{heRole}</div>}
        </div>
      </div>
      {role && <Badge variant="secondary">{heRole}</Badge>}
      <Button size="sm" variant="ghost" onClick={() => nav('/profile')}>עריכת פרופיל</Button>
      <Button size="sm" variant="outline" onClick={signOut}>התנתקות</Button>
    </div>
  );
}
