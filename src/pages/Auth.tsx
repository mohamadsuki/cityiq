import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { DEMO_USERS, emailForUsername, simpleUsernameFromEmail } from '@/lib/demoAccess';
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
    try {
      // תמיכה בשם משתמש (למשל "mayor") או באימייל מלא
      let loginEmail = email.trim();
      if (loginEmail && !loginEmail.includes('@')) {
        const mapped = emailForUsername(loginEmail);
        if (!mapped) {
          setBusy(false);
          toast({ title: 'שגיאת אימות', description: 'שם המשתמש לא מוכר בדמו. בחר/י מרשימת הדמו למטה או הזן/י אימייל.', variant: 'destructive' });
          return;
        }
        loginEmail = mapped;
      }

      if (mode === 'login') {
        // ניסיון התחברות רגיל
        const { error } = await signIn(loginEmail, password);
        if (!error) {
          toast({ title: 'הצלחה', description: 'התחברת בהצלחה' });
          nav('/');
          return;
        }

        // אם מדובר בפרטי דמו שלא קיימים עדיין, נבצע הרשמה אוטומטית ואז התחברות
        const demo = DEMO_USERS.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
        const isInvalidCreds = typeof error?.message === 'string' && error.message.toLowerCase().includes('invalid login credentials');
        if (demo && password === demo.password && isInvalidCreds) {
          const { error: signUpErr } = await signUp(loginEmail, password);
          if (signUpErr) {
            toast({
              title: 'הרשמה נכשלה',
              description: signUpErr.message + ' — אם אימות אימייל מופעל, כדאי לכבות אותו ב-Supabase לצורך בדיקות מהירות.',
              variant: 'destructive'
            });
            return;
          }
          // ניסיון התחברות חוזר לאחר הרשמה
          const { error: signInAfter } = await signIn(loginEmail, password);
          if (!signInAfter) {
            toast({ title: 'הצלחה', description: 'נוצר משתמש דמו והתחברת בהצלחה' });
            nav('/');
            return;
          }
          toast({ title: 'שגיאת אימות', description: signInAfter.message, variant: 'destructive' });
          return;
        }

        // שגיאה כללית
        toast({ title: 'שגיאת אימות', description: error.message, variant: 'destructive' });
        return;
      }

      // מצב הרשמה רגיל
      const { error } = await signUp(loginEmail, password);
      if (error) {
        toast({ title: 'שגיאת הרשמה', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'נרשמת בהצלחה', description: 'בדוק/י אימייל לאימות (מומלץ לכבות אימות למטרת בדיקות)' });
        nav('/');
      }
    } finally {
      setBusy(false);
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
            <Label htmlFor="email">שם משתמש או דוא"ל</Label>
            <Input id="email" type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="mayor או you@city.gov.il" />
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
              {DEMO_USERS.map(u => {
                const uname = simpleUsernameFromEmail(u.email);
                return (
                  <Button key={u.email} variant="outline" onClick={() => { setEmail(uname); setPassword(u.password); setMode('login'); }}>
                    {u.displayName} · {uname} · {u.password}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
