import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export type Institution = {
  id: string;
  user_id: string;
  department_slug: 'education';
  created_at: string;
  updated_at: string;
  name: string | null;
  level: string | null;
  address: string | null;
  students: number | null;
  classes: number | null;
  occupancy: number | null;
  lat: number | null;
  lng: number | null;
};

const DEFAULT_FORM: Partial<Institution> = {
  name: "",
  level: "",
  address: "",
  students: 0,
  classes: 0,
  occupancy: 0,
  lat: null,
  lng: null,
};

export default function InstitutionsSection() {
  const { role, user, session, departments } = useAuth();
  const { toast } = useToast();
  const canManage = useMemo(() => {
    if (!session) return false;
    if (role === 'mayor' || role === 'ceo') return true;
    if (role === 'manager') return departments.includes('education' as any);
    return false;
  }, [role, session, departments]);

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Institution[]>([]);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Institution | null>(null);
  const [form, setForm] = useState<Partial<Institution>>(DEFAULT_FORM);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .eq('department_slug', 'education')
      .order('name', { ascending: true });
    if (error) {
      console.error(error);
      toast({ title: 'שגיאה', description: error.message, variant: 'destructive' });
      setItems([]);
    } else {
      setItems((data || []) as Institution[]);
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return items;
    const s = q.toLowerCase();
    return items.filter(i => `${i.name ?? ''} ${i.level ?? ''} ${i.address ?? ''}`.toLowerCase().includes(s));
  }, [q, items]);

  function openCreate() { setEditing(null); setForm(DEFAULT_FORM); setOpen(true); }
  function openEdit(i: Institution) { setEditing(i); setForm({ ...i }); setOpen(true); }

  async function save() {
    if (!canManage || !user?.id) return;
    const payload: any = {
      name: form.name || null,
      level: form.level || null,
      address: form.address || null,
      students: typeof form.students === 'number' ? form.students : Number(form.students) || null,
      classes: typeof form.classes === 'number' ? form.classes : Number(form.classes) || null,
      occupancy: typeof form.occupancy === 'number' ? form.occupancy : Number(form.occupancy) || null,
      lat: form.lat === null || form.lat === undefined ? null : Number(form.lat),
      lng: form.lng === null || form.lng === undefined ? null : Number(form.lng),
      department_slug: 'education',
    };
    let error;
    if (editing) {
      const resp = await supabase.from('institutions').update(payload).eq('id', editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase.from('institutions').insert([{ ...payload, user_id: user.id }]);
      error = resp.error as any;
    }
    if (error) {
      toast({ title: 'שמירה נכשלה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'נשמר', description: 'המוסד נשמר בהצלחה' });
      setOpen(false);
      load();
    }
  }

  async function remove(i: Institution) {
    if (!canManage) return;
    if (!confirm('למחוק מוסד זה?')) return;
    const { error } = await supabase.from('institutions').delete().eq('id', i.id);
    if (error) toast({ title: 'מחיקה נכשלה', description: error.message, variant: 'destructive' });
    else { toast({ title: 'נמחק', description: 'המוסד נמחק' }); load(); }
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">מוסדות חינוך</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="חיפוש מוסד..." value={q} onChange={(e)=>setQ(e.target.value)} className="w-48" />
            {canManage && (<Button size="sm" onClick={openCreate}>מוסד חדש</Button>)}
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
                  <th className="py-2">שלב</th>
                  <th className="py-2">כתובת</th>
                  <th className="py-2">תלמידים</th>
                  <th className="py-2">כיתות</th>
                  <th className="py-2">תפוסה</th>
                  <th className="py-2">מיקום (lat,lng)</th>
                  {canManage && <th className="py-2">פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td className="py-6 text-muted-foreground" colSpan={canManage ? 8 : 7}>לא נמצאו מוסדות</td></tr>
                )}
                {filtered.map((i) => (
                  <tr key={i.id} className="border-b border-border">
                    <td className="py-3 font-medium">{i.name || '—'}</td>
                    <td className="py-3">{i.level || '—'}</td>
                    <td className="py-3">{i.address || '—'}</td>
                    <td className="py-3">{i.students ?? '—'}</td>
                    <td className="py-3">{i.classes ?? '—'}</td>
                    <td className="py-3">{i.occupancy ?? '—'}%</td>
                    <td className="py-3">{i.lat ?? '—'},{' '}{i.lng ?? '—'}</td>
                    {canManage && (
                      <td className="py-3 space-x-2 space-x-reverse">
                        <Button variant="outline" size="sm" onClick={() => openEdit(i)}>עריכה</Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(i)}>מחיקה</Button>
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
            <DialogTitle>{editing ? 'עריכת מוסד' : 'מוסד חדש'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם</Label>
              <Input value={form.name as string} onChange={(e)=>setForm(f=>({...f, name: e.target.value}))} />
            </div>
            <div>
              <Label>שלב</Label>
              <Input value={form.level as string} onChange={(e)=>setForm(f=>({...f, level: e.target.value}))} />
            </div>
            <div className="md:col-span-2">
              <Label>כתובת</Label>
              <Input value={form.address as string} onChange={(e)=>setForm(f=>({...f, address: e.target.value}))} />
            </div>
            <div>
              <Label>תלמידים</Label>
              <Input type="number" value={String(form.students ?? 0)} onChange={(e)=>setForm(f=>({...f, students: Number(e.target.value)}))} />
            </div>
            <div>
              <Label>כיתות</Label>
              <Input type="number" value={String(form.classes ?? 0)} onChange={(e)=>setForm(f=>({...f, classes: Number(e.target.value)}))} />
            </div>
            <div>
              <Label>תפוסה (%)</Label>
              <Input type="number" value={String(form.occupancy ?? 0)} onChange={(e)=>setForm(f=>({...f, occupancy: Number(e.target.value)}))} />
            </div>
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="any" value={form.lat === null || form.lat === undefined ? '' : String(form.lat)} onChange={(e)=>setForm(f=>({...f, lat: e.target.value === '' ? null : Number(e.target.value)}))} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="any" value={form.lng === null || form.lng === undefined ? '' : String(form.lng)} onChange={(e)=>setForm(f=>({...f, lng: e.target.value === '' ? null : Number(e.target.value)}))} />
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
