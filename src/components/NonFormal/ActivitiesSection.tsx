import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export type Activity = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: 'non-formal';
  name: string | null;
  category: string | null;
  program: string | null;
  age_group: string | null;
  status: string | null;
  location: string | null;
  participants: number | null;
  scheduled_at: string | null;
};

const DEFAULT_FORM: Partial<Activity> = {
  name: "",
  category: "",
  program: "",
  age_group: "",
  status: "פעיל",
  location: "",
  participants: 0,
  scheduled_at: "",
};

export default function ActivitiesSection() {
  const { role, user, session, departments } = useAuth();
  const { toast } = useToast();

  const canManage = useMemo(() => {
    if (!session) return false;
    if (role === 'mayor' || role === 'ceo') return true;
    if (role === 'manager') return departments.includes('non-formal' as any);
    return false;
  }, [role, session, departments]);

  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [form, setForm] = useState<Partial<Activity>>(DEFAULT_FORM);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('department_slug', 'non-formal')
      .order('scheduled_at', { ascending: true, nullsFirst: false });
    if (error) {
      console.error(error);
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      setActivities([]);
    } else {
      setActivities((data || []) as Activity[]);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return activities;
    const s = q.toLowerCase();
    return activities.filter(a => `${a.name ?? ''} ${a.category ?? ''} ${a.program ?? ''}`.toLowerCase().includes(s));
  }, [q, activities]);

  function openCreate() {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setOpen(true);
  }

  function openEdit(a: Activity) {
    setEditing(a);
    setForm({ ...a });
    setOpen(true);
  }

  async function save() {
    if (!canManage || !user?.id) return;
    const payload: any = {
      name: form.name || null,
      category: form.category || null,
      program: form.program || null,
      age_group: form.age_group || null,
      status: form.status || null,
      location: form.location || null,
      participants: typeof form.participants === 'number' ? form.participants : Number(form.participants) || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      department_slug: 'non-formal',
    };
    let error;
    if (editing) {
      const resp = await supabase.from('activities').update(payload).eq('id', editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase.from('activities').insert([{ ...payload, user_id: user.id }]);
      error = resp.error as any;
    }
    if (error) {
      toast({ title: 'שמירה נכשלה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'נשמר', description: 'הפעילות נשמרה בהצלחה' });
      setOpen(false);
      load();
    }
  }

  async function remove(a: Activity) {
    if (!canManage) return;
    if (!confirm('למחוק פעילות זו?')) return;
    const { error } = await supabase.from('activities').delete().eq('id', a.id);
    if (error) toast({ title: 'מחיקה נכשלה', description: error.message, variant: 'destructive' });
    else { toast({ title: 'נמחק', description: 'הפעילות נמחקה' }); load(); }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">פעילויות חינוך בלתי־פורמלי</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="חיפוש פעילות..." value={q} onChange={(e)=>setQ(e.target.value)} className="w-48" />
            {canManage && (
              <Button size="sm" onClick={openCreate}>פעילות חדשה</Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="p-4 rounded-md bg-muted">טוען…</div>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-2">שם</th>
                  <th className="py-2">קטגוריה</th>
                  <th className="py-2">קבוצת גיל</th>
                  <th className="py-2">סטטוס</th>
                  <th className="py-2">מיקום/זמן</th>
                  <th className="py-2">משתתפים</th>
                  <th className="py-2">זמן מתוכנן</th>
                  {canManage && <th className="py-2">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td className="py-6 text-muted-foreground" colSpan={canManage ? 8 : 7}>לא נמצאו פעילויות</td></tr>
                )}
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border">
                    <td className="py-3 font-medium">{a.name || '—'}</td>
                    <td className="py-3">{a.category || '—'}</td>
                    <td className="py-3">{a.age_group || '—'}</td>
                    <td className="py-3">{a.status || '—'}</td>
                    <td className="py-3">{a.location || '—'}</td>
                    <td className="py-3">{a.participants ?? '—'}</td>
                    <td className="py-3">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleString('he-IL') : '—'}</td>
                    {canManage && (
                      <td className="py-3 space-x-2 space-x-reverse">
                        <Button variant="outline" size="sm" onClick={() => openEdit(a)}>עריכה</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(a)}>מחיקה</Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת פעילות' : 'פעילות חדשה'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם</Label>
              <Input value={form.name as string} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} />
            </div>
            <div>
              <Label>קטגוריה</Label>
              <Input value={form.category as string} onChange={(e)=>setForm(f=>({...f, category: e.target.value}))} />
            </div>
            <div>
              <Label>תוכנית</Label>
              <Input value={form.program as string} onChange={(e)=>setForm(f=>({...f, program: e.target.value}))} />
            </div>
            <div>
              <Label>קבוצת גיל</Label>
              <Input value={form.age_group as string} onChange={(e)=>setForm(f=>({...f, age_group: e.target.value}))} />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select value={(form.status as string) || 'פעיל'} onValueChange={(v)=>setForm(f=>({...f, status: v}))}>
                <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="פעיל">פעיל</SelectItem>
                  <SelectItem value="בהמתנה">בהמתנה</SelectItem>
                  <SelectItem value="נסגר">נסגר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>מיקום</Label>
              <Input value={form.location as string} onChange={(e)=>setForm(f=>({...f, location: e.target.value}))} />
            </div>
            <div>
              <Label>משתתפים</Label>
              <Input type="number" value={String(form.participants ?? 0)} onChange={(e)=>setForm(f=>({...f, participants: Number(e.target.value)}))} />
            </div>
            <div>
              <Label>תאריך ושעה</Label>
              <Input type="datetime-local" value={form.scheduled_at as string} onChange={(e)=>setForm(f=>({...f, scheduled_at: e.target.value}))} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>ביטול</Button>
            <Button onClick={save}>שמירה</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
