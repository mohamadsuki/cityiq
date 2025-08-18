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
  const {
    signIn,
    signUp,
    demoSignIn
  } = useAuth();
  const {
    toast
  } = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      // תמיכה בשם משתמש (למשל "mayor") או באימייל מלא
      let input = email.trim();
      let usernameNorm = input;
      let loginEmail = input;
      if (input && !input.includes('@')) {
        // מיפוי שם משתמש לאימייל הדמו האמיתי (למשל mayor -> mayor@city.gov.il)
        usernameNorm = simpleUsernameFromEmail(input);
        const mapped = emailForUsername(usernameNorm);
        // נשתמש במיפוי אם קיים, אחרת נשאיר מייל דמה לזרימה קיימת (לא קריטי כי נבצע דמו)
        loginEmail = mapped || `${usernameNorm}@example.com`;
      } else if (input) {
        usernameNorm = simpleUsernameFromEmail(input);
      }
      const findDemoByCreds = (uname: string, pass: string) => {
        const demo = DEMO_USERS.find(u => simpleUsernameFromEmail(u.email) === uname);
        return demo && pass === demo.password ? demo : null;
      };
      if (mode === 'login') {
        // מסלול מהיר: אם הוזן שם משתמש ללא אימייל ותואם לדמו — כניסה מיידית ללא Supabase
        if (input && !input.includes('@')) {
          const demo = findDemoByCreds(usernameNorm, password);
          if (demo) {
            demoSignIn(usernameNorm);
            toast({
              title: 'הצלחה',
              description: `התחברת כ־${demo.displayName}`
            });
            nav('/');
            return;
          }
        }

        // ניסיון התחברות ב-Supabase (אם ספק האימייל מושבת יטופל מטה)
        const {
          error
        } = await signIn(loginEmail, password);
        if (!error) {
          toast({
            title: 'הצלחה',
            description: 'התחברת בהצלחה'
          });
          nav('/');
          return;
        }
        const msg = String(error?.message || '').toLowerCase();
        const providerDisabled = msg.includes('email logins are disabled') || msg.includes('email_provider_disabled');

        // אם ספק האימייל מושבת או שמדובר בשם משתמש — ננסה דמו לפי שם משתמש/סיסמה
        if (providerDisabled || input && !input.includes('@')) {
          const demo = findDemoByCreds(usernameNorm, password);
          if (demo) {
            demoSignIn(usernameNorm);
            toast({
              title: 'הצלחה',
              description: `התחברת כ־${demo.displayName} (מצב דמו)`
            });
            nav('/');
            return;
          }
          toast({
            title: 'שגיאת אימות',
            description: 'כניסה באימייל מושבתת. השתמש/י בשם המשתמש והסיסמה של הדמו מהרשימה למטה.',
            variant: 'destructive'
          });
          return;
        }

        // אם זו שגיאת פרטים שגויים, עדיין ננסה לאפשר דמו לפי שם משתמש/סיסמה
        if (msg.includes('invalid login credentials')) {
          const demo = findDemoByCreds(usernameNorm, password);
          if (demo) {
            demoSignIn(usernameNorm);
            toast({
              title: 'הצלחה',
              description: `התחברת כ־${demo.displayName} (דמו)`
            });
            nav('/');
            return;
          }
        }

        // שגיאה כללית
        toast({
          title: 'שגיאת אימות',
          description: error.message,
          variant: 'destructive'
        });
        return;
      }

      // מצב הרשמה רגיל
      const {
        error
      } = await signUp(loginEmail, password);
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('email logins are disabled') || msg.includes('email_provider_disabled')) {
          toast({
            title: 'הרשמה באימייל מושבתת',
            description: 'להדגמה השתמש/י במשתמשי הדמו (שם וסיסמה).',
            variant: 'destructive'
          });
          return;
        }
        if (msg.includes('email address') && msg.includes('invalid') || msg.includes('domain') || msg.includes('not allowed') || msg.includes('disabled')) {
          const fallbackEmail = `${usernameNorm}@example.com`;
          const {
            error: e2
          } = await signUp(fallbackEmail, password);
          if (!e2) {
            toast({
              title: 'נרשמת בהצלחה',
              description: 'נוצר חשבון עם כתובת example.com'
            });
            nav('/');
            return;
          }
        }
        toast({
          title: 'שגיאת הרשמה',
          description: error.message,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'נרשמת בהצלחה',
          description: 'בדוק/י אימייל לאימות (אם מאופשר)'
        });
        nav('/');
      }
    } finally {
      setBusy(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
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
          


          <div className="pt-2">
            <p className="text-sm font-medium mb-2">בחר/י משתמש למילוי אוטומטי</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => {
                setEmail('mayor');
                setPassword('password');
                setMode('login');
              }}>
                ראש העיר · mayor · password
              </Button>
              <Button variant="outline" onClick={() => {
                setEmail('ceo');
                setPassword('password'); 
                setMode('login');
              }}>
                מנכ"ל · ceo · password
              </Button>
              <Button variant="outline" onClick={() => {
                setEmail('00000000-0000-0000-0000-000000000003');
                setPassword('password');
                setMode('login');
              }}>
                מנהל כספים · finance · password
              </Button>
              <Button variant="outline" onClick={() => {
                setEmail('00000000-0000-0000-0000-000000000008');
                setPassword('password');
                setMode('login');
              }}>
                מנהל עסקים · business · password
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {DEMO_USERS.slice(4).map(u => {
              const uname = simpleUsernameFromEmail(u.email);
              return <Button key={u.email} variant="outline" size="sm" onClick={() => {
                setEmail(uname);
                setPassword(u.password);
                setMode('login');
              }}>
                    {u.displayName}
                  </Button>;
            })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}