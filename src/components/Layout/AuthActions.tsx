import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
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

  return (
    <div className="flex items-center gap-2">
      {role && <Badge variant="secondary">{role === 'mayor' ? 'ראש העיר' : 'מנהל/ת'}</Badge>}
      <Button size="sm" variant="outline" onClick={signOut}>התנתקות</Button>
    </div>
  );
}
