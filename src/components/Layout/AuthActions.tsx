import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { DEMO_USERS } from "@/lib/demoAccess";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import PageSettingsDialog from "@/components/Layout/PageSettingsDialog";

const DEPT_LABELS: Record<DepartmentSlug, string> = {
  finance: "כספים",
  education: "חינוך",
  engineering: "הנדסה",
  welfare: "רווחה",
  "non-formal": "חינוך בלתי פורמלי",
  business: "עסקים",
  "government-budgets": "תקציבים ממשלתיים ותמיכות",
  "city-improvement": "מחלקת שיפור פני העיר",
  enforcement: "אכיפה",
  ceo: "מנכ\"ל",
  inquiries: "פניות ציבור",
};

export function AuthActions() {
  const { user, role, departments, signOut, session } = useAuth();
  const nav = useNavigate();
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const isUuid = (v: string) => /^[0-9a-fA-F-]{36}$/.test(v);
    // Demo mode or non-UUID ids: load from per-user localStorage key
    if (!session || !user?.id || !isUuid(user.id)) {
      try {
        const emailKey = user?.email?.toLowerCase();
        const key = emailKey ? `demo_profile:${emailKey}` : "demo_profile";
        const raw = localStorage.getItem(key);
        const p = raw ? (JSON.parse(raw) as { display_name?: string; avatar_url?: string }) : null;
        setProfileName(p?.display_name || "");
        setProfileAvatar(p?.avatar_url || "");
      } catch {
        setProfileName("");
        setProfileAvatar("");
      }
      return;
    }
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfileName(data.display_name || "");
          setProfileAvatar(data.avatar_url || "");
        }
      });
  }, [user?.id, user?.email, session]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => nav('/auth')}>
          התחברות
        </Button>
      </div>
    );
  }

  const email = user.email ?? '';
  const demo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
  const displayName = profileName || ( (user as any)?.user_metadata?.full_name || demo?.displayName || (email.split('@')[0] || 'משתמש'));
  const avatarUrl = profileAvatar || (user as any)?.user_metadata?.avatar_url || '/placeholder.svg';
  const heRole = role === 'mayor' ? 'ראש העיר' : role === 'ceo' ? 'מנכ"ל' : 'מנהל/ת';
  const initials = displayName?.split(' ').map((p: string) => p[0]).slice(0,2).join('').toUpperCase() || 'U';
  const hebDepartments = (departments || []).map((d) => DEPT_LABELS[d] || d).join(', ');

  return (
    <div className="flex items-center gap-2 flex-nowrap">

      {role && <Badge variant="secondary" className="whitespace-nowrap">{heRole}</Badge>}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="flex items-center gap-2 max-w-[12rem] overflow-hidden">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={avatarUrl || undefined} alt={`תמונת ${displayName}`} />
              <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm" title={displayName}>{displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => nav('/profile')}>עריכת פרופיל</DropdownMenuItem>
          {(role === 'mayor' || role === 'ceo' || (role === 'manager' && departments?.includes('business'))) && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>עריכת דף</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={signOut}>התנתקות</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {(role === 'mayor' || role === 'ceo' || (role === 'manager' && departments?.includes('business'))) && (
        <PageSettingsDialog open={editOpen} onOpenChange={setEditOpen} />
      )}
    </div>
  );
}
