import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DEMO_USERS } from '@/lib/demoAccess';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const action = mode === 'login' ? signIn : signUp;
    const { error } = await action(email, password);
    setBusy(false);
    if (error) {
      toast({ title: 'שגיאת אימות', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'הצלחה', description: mode === 'login' ? 'התחברת בהצלחה' : 'נרשמת בהצלחה, בדוק/י אימייל לאימות' });
      nav('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{mode === 'login' ? 'התחברות' : 'הרשמה'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">דוא"ל</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@city.gov.il" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'מבצע...' : mode === 'login' ? 'התחבר/י' : 'הרשמה'}
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <button className="underline" onClick={() => setMode('signup')}>אין משתמש? הרשמה</button>
            ) : (
              <button className="underline" onClick={() => setMode('login')}>יש משתמש? התחברות</button>
            )}
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium mb-2">בחר/י משתמש דמו למילוי אוטומטי</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map(u => (
                <Button key={u.email} variant="outline" onClick={() => { setEmail(u.email); setPassword(u.password); setMode('login'); }}>
                  {u.displayName} · {u.email} · {u.password}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
