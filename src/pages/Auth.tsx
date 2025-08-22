import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

export default function AuthPage() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const { error } = await signIn(username, password);
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
    } finally {
      setBusy(false);
    }
  };

  // Preset login credentials for the existing users
  const presetUsers = [
    { username: 'mayor', password: 'mayor123', displayName: 'ראש העיר' },
    { username: 'ceo', password: 'ceo123', displayName: 'מנכ"ל העירייה' },
    { username: 'finance', password: 'finance123', displayName: 'מנהל/ת פיננסים' },
    { username: 'education', password: 'education123', displayName: 'מנהל/ת חינוך' },
    { username: 'engineering', password: 'engineering123', displayName: 'מנהל/ת הנדסה' },
    { username: 'welfare', password: 'welfare123', displayName: 'מנהל/ת רווחה' },
    { username: 'nonformal', password: 'nonformal123', displayName: 'מנהל/ת חינוך בלתי פורמאלי' },
    { username: 'business', password: 'business123', displayName: 'מנהל/ת רישוי עסקים' },
    { username: 'inquiries', password: 'inquiry123', displayName: 'מנהל/ת פניות ציבור' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            התחברות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">שם משתמש</Label>
            <Input 
              id="username" 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="הכנס שם משתמש" 
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
            {busy ? 'מבצע...' : 'התחבר/י'}
          </Button>

          <div className="pt-2">
            <p className="text-sm font-medium mb-2">בחר/י משתמש למילוי אוטומטי</p>
            <div className="grid grid-cols-1 gap-2">
              {presetUsers.map(u => (
                <Button 
                  key={u.username} 
                  variant="outline" 
                  onClick={() => {
                    setUsername(u.username);
                    setPassword(u.password);
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