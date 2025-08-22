import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "react-router-dom";
import type { DepartmentSlug } from "@/lib/demoAccess";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DataUploader } from "@/components/shared/DataUploader";

// Grant types aligned with DB
export type GrantStatus = 'draft' | 'submitted' | 'pending' | 'approved' | 'rejected';

type Grant = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  department_slug: DepartmentSlug | null;
  name: string | null;
  ministry: string | null;
  amount: number | null;
  status: string | null; // free text in DB, we use labels above
  submitted_at: string | null; // date
  decision_at: string | null; // date
};

const STATUS_LABELS: Record<GrantStatus, string> = {
  draft: 'טיוטה',
  submitted: 'הוגש',
  pending: 'ממתין',
  approved: 'אושר',
  rejected: 'נדחה',
};

const statusVariant = (s: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch ((s || '').toLowerCase()) {
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'submitted':
    case 'pending': return 'secondary';
    case 'draft':
    default: return 'outline';
  }
};

export default function GrantsApp() {
  const { role, departments, user, session } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  
  const canCreate = role === 'mayor' || role === 'ceo' || role === 'manager';
  const visibleDepartments: DepartmentSlug[] = (role === 'mayor' || role === 'ceo') ?
    ['finance','education','engineering','welfare','non-formal','business'] : departments;

  const [loading, setLoading] = useState(false);
  const [grants, setGrants] = useState<Grant[]>([]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<'all' | GrantStatus>('all');
  const [department, setDepartment] = useState<'all' | DepartmentSlug>('all');

  // Handle filtering from "What's New" section
  const filter = searchParams.get("filter");
  const period = searchParams.get("period");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const filtered = useMemo(() => {
    return grants.filter((g) => {
      const text = `${g.name ?? ''} ${g.ministry ?? ''}`.toLowerCase();
      if (q && !text.includes(q.toLowerCase())) return false;
      if (status !== 'all' && (g.status || '').toLowerCase() !== status) return false;
      if (role === 'manager' && departments && !departments.includes((g.department_slug as DepartmentSlug))) return false;
      if (department !== 'all' && g.department_slug !== department) return false;
      
      // Apply filter from "What's New" section
      if (filter === 'new' && period) {
        const now = new Date();
        let from: Date, to: Date;
        
        if (period === 'custom' && fromParam && toParam) {
          from = new Date(fromParam);
          to = new Date(toParam);
        } else {
          // Calculate date range based on period
          to = now;
          switch (period) {
            case 'week':
              from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'year':
              from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
              break;
            default: // day
              from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          }
        }
        
        // Show only grants created in the time range
        const createdAt = new Date(g.created_at);
        if (createdAt < from || createdAt > to) return false;
      }
      
      return true;
    });
  }, [grants, q, status, department, role, departments, filter, period, fromParam, toParam]);

  type SortKey = 'name' | 'ministry' | 'amount' | 'status' | 'submitted_at' | 'decision_at';
  const [sortBy, setSortBy] = useState<SortKey>('decision_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const compare = (a: any, b: any) => {
      const getVal = (obj: any, key: SortKey) => obj?.[key];
      if (sortBy.includes('_at')) {
        const ta = getVal(a, sortBy) ? new Date(getVal(a, sortBy)).getTime() : 0;
        const tb = getVal(b, sortBy) ? new Date(getVal(b, sortBy)).getTime() : 0;
        return sortDir === 'asc' ? ta - tb : tb - ta;
      }
      const va = getVal(a, sortBy);
      const vb = getVal(b, sortBy);
      if (typeof va === 'number' || typeof vb === 'number') {
        const diff = Number(va || 0) - Number(vb || 0);
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = String(va || '').localeCompare(String(vb || ''), 'he');
      return sortDir === 'asc' ? diff : -diff;
    };
    arr.sort(compare);
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      } else {
        setSortDir('asc');
        return key;
      }
    });
  };

  async function fetchGrants() {
    setLoading(true);
    
    let query = supabase.from('grants').select('*').order('created_at', { ascending: false });
    if (department !== 'all') query = query.eq('department_slug', department as any);
    const { data, error } = await query;
    if (error) {
      console.error('Failed to load grants', error);
      toast({ title: 'שגיאה בטעינת קולות קוראים', description: error.message, variant: 'destructive' });
      setGrants([]);
    } else {
      setGrants((data || []) as Grant[]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchGrants(); }, []);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Grant | null>(null);
  const [form, setForm] = useState<Partial<Grant>>({
    name: '',
    ministry: '',
    amount: null,
    status: 'draft',
    department_slug: (visibleDepartments?.[0] ?? 'finance') as DepartmentSlug,
    submitted_at: '',
    decision_at: '',
  });

  function openCreate() {
    setEditing(null);
    setForm({
      name: '', ministry: '', amount: null, status: 'draft',
      department_slug: (visibleDepartments?.[0] ?? 'finance') as DepartmentSlug,
      submitted_at: '', decision_at: ''
    });
    setOpen(true);
  }
  function openEdit(g: Grant) { setEditing(g); setForm({ ...g }); setOpen(true); }

  async function saveGrant() {
    if (!form.name || !form.department_slug) {
      toast({ title: 'שדות חסרים', description: 'שם ומחלקה הינם חובה', variant: 'destructive' });
      return;
    }

    if (!user?.id) {
      toast({ title: 'נדרש להתחבר', description: 'יש להתחבר כדי לשמור', variant: 'destructive' });
      return;
    }

    const payload: any = {
      name: form.name,
      ministry: form.ministry,
      amount: form.amount,
      status: form.status,
      department_slug: form.department_slug,
      submitted_at: form.submitted_at || null,
      decision_at: form.decision_at || null,
      user_id: user.id,
    };
    let error;
    if (editing) {
      const resp = await supabase.from('grants').update(payload).eq('id', editing.id);
      error = resp.error as any;
    } else {
      const resp = await supabase.from('grants').insert([payload]);
      error = resp.error as any;
    }
    if (error) {
      toast({ title: 'שמירה נכשלה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'הצלחה', description: 'הקול הקורא נשמר בהצלחה' });
      setOpen(false);
      fetchGrants();
    }
  }

  async function deleteGrant(g: Grant) {
    if (!confirm('למחוק רשומת קול קורא זו?')) return;
    const { error } = await supabase.from('grants').delete().eq('id', g.id);
    if (error) toast({ title: 'מחיקה נכשלה', description: error.message, variant: 'destructive' });
    else { toast({ title: 'נמחק', description: 'נמחק בהצלחה' }); fetchGrants(); }
  }

  const daysLeft = (g: Grant) => {
    if (!g.decision_at) return null;
    const today = new Date();
    const due = new Date(g.decision_at);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000*60*60*24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">קולות קוראים</h1>
          <p className="text-sm text-muted-foreground">הוספה/עריכה, סטטוס ולו"ז</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>קול קורא חדש</Button>
        )}
      </header>

      {/* Data Uploader */}
      <DataUploader context="grants" onUploadSuccess={() => fetchGrants()} />

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label htmlFor="q">חיפוש</Label>
            <Input id="q" placeholder="שם/משרד" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="submitted">הוגש</SelectItem>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="approved">אושר</SelectItem>
                <SelectItem value="rejected">נדחה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>מחלקה</Label>
            <Select value={department} onValueChange={(v) => setDepartment(v as any)}>
              <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="all">הכל</SelectItem>
                {visibleDepartments.map((d) => (
                  <SelectItem key={d} value={d}>{deptLabel(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-4 overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                שם {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('ministry')}>
                משרד {sortBy === 'ministry' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('amount')}>
                סכום {sortBy === 'amount' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                סטטוס {sortBy === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('submitted_at')}>
                הוגש {sortBy === 'submitted_at' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2 cursor-pointer select-none" onClick={() => toggleSort('decision_at')}>
                החלטה {sortBy === 'decision_at' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th className="py-2">לו"ז</th>
              <th className="py-2">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="py-6" colSpan={8}>טוען…</td></tr>)}
            {!loading && sorted.length === 0 && (<tr><td className="py-6" colSpan={8}>אין נתונים</td></tr>)}
            {!loading && sorted.map((g) => (
              <tr key={g.id} className="border-b border-border">
                <td className="py-3 font-medium">{g.name}</td>
                <td className="py-3">{g.ministry || '—'}</td>
                <td className="py-3">{g.amount ? g.amount.toLocaleString('he-IL') : '—'}</td>
                <td className="py-3"><Badge variant={statusVariant(g.status)}>{labelForStatus(g.status)}</Badge></td>
                <td className="py-3">{g.submitted_at ? new Date(g.submitted_at).toLocaleDateString('he-IL') : '—'}</td>
                <td className="py-3">{g.decision_at ? new Date(g.decision_at).toLocaleDateString('he-IL') : '—'}</td>
                <td className="py-3">
                  {g.decision_at && (
                    <span className="text-sm text-muted-foreground">
                      {formatDays(daysLeft(g))}
                    </span>
                  )}
                </td>
                <td className="py-3 space-x-2 space-x-reverse">
                  <Button size="sm" variant="outline" onClick={() => openEdit(g)}>עריכה</Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteGrant(g)}>מחיקה</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'עריכת קול קורא' : 'קול קורא חדש'}</DialogTitle>
            <DialogDescription className="sr-only">אשף יצירה/עריכה</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div className="md:col-span-2">
              <Label>שם</Label>
              <Input value={form.name as string} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label>משרד</Label>
              <Input value={form.ministry as string} onChange={(e) => setForm((f) => ({ ...f, ministry: e.target.value }))} />
            </div>
            <div>
              <Label>סכום</Label>
              <Input type="number" value={(form.amount as number | null) ?? 0} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>סטטוס</Label>
              <Select value={(form.status as string) || 'draft'} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="draft">טיוטה</SelectItem>
                  <SelectItem value="submitted">הוגש</SelectItem>
                  <SelectItem value="pending">ממתין</SelectItem>
                  <SelectItem value="approved">אושר</SelectItem>
                  <SelectItem value="rejected">נדחה</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>מחלקה</Label>
              <Select value={(form.department_slug as DepartmentSlug) ?? 'finance'} onValueChange={(v) => setForm((f) => ({ ...f, department_slug: v as DepartmentSlug }))}>
                <SelectTrigger><SelectValue placeholder="מחלקה" /></SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {visibleDepartments.map((d) => (
                    <SelectItem key={d} value={d}>{deptLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך הגשה</Label>
              <Input type="date" value={form.submitted_at as string} onChange={(e) => setForm((f) => ({ ...f, submitted_at: e.target.value }))} />
            </div>
            <div>
              <Label>תאריך החלטה</Label>
              <Input type="date" value={form.decision_at as string} onChange={(e) => setForm((f) => ({ ...f, decision_at: e.target.value }))} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
            <Button onClick={saveGrant}>{editing ? 'שמירה' : 'יצירה'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function deptLabel(d: DepartmentSlug) {
  const map: Record<DepartmentSlug, string> = {
    finance: 'כספים', education: 'חינוך', engineering: 'הנדסה', welfare: 'רווחה', 'non-formal': 'חינוך בלתי פורמלי', business: 'עסקים', ceo: 'מנכ"ל'
  } as any;
  return map[d] || d;
}

function labelForStatus(s: string | null) {
  if (!s) return '—';
  const key = (s as string).toLowerCase() as GrantStatus;
  return STATUS_LABELS[key] || s;
}

function formatDays(diff: number | null) {
  if (diff === null) return '—';
  if (diff < 0) return `${Math.abs(diff)} ימים עברו`;
  if (diff === 0) return 'היום';
  return `עוד ${diff} ימים`;
}
