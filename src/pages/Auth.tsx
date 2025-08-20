import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
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
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'שגיאת אימות',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }
        
        toast({
          title: 'הצלחה',
          description: 'התחברת בהצלחה'
        });
        nav('/');
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: 'שגיאת הרשמה',
            description: error.message,
            variant: 'destructive'
          });
          return;
        }
        
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

  // Preset login credentials for the existing users
  const presetUsers = [
    { email: 'mayor@city.gov.il', password: 'mayor123', displayName: 'ראש העיר' },
    { email: 'ceo@city.gov.il', password: 'ceo123', displayName: 'מנכ"ל העירייה' },
    { email: 'finance@city.gov.il', password: 'finance123', displayName: 'מנהל/ת פיננסים' },
    { email: 'education@city.gov.il', password: 'education123', displayName: 'מנהל/ת חינוך' },
    { email: 'engineering@city.gov.il', password: 'engineering123', displayName: 'מנהל/ת הנדסה' },
    { email: 'welfare@city.gov.il', password: 'welfare123', displayName: 'מנהל/ת רווחה' },
    { email: 'non-formal@city.gov.il', password: 'nonformal123', displayName: 'מנהל/ת חינוך בלתי פורמאלי' },
    { email: 'business@city.gov.il', password: 'business123', displayName: 'מנהל/ת רישוי עסקים' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {mode === 'login' ? 'התחברות' : 'הרשמה'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">דוא"ל</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@city.gov.il" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'מבצע...' : mode === 'login' ? 'התחבר/י' : 'הרשמה'}
          </Button>
          
          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'אין לך חשבון? הרשם/י כאן' : 'יש לך חשבון? התחבר/י כאן'}
            </Button>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium mb-2">בחר/י משתמש למילוי אוטומטי</p>
            <div className="grid grid-cols-1 gap-2">
              {presetUsers.map(u => (
                <Button 
                  key={u.email} 
                  variant="outline" 
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(u.password);
                    setMode('login');
                  }}
                >
                  {u.displayName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}