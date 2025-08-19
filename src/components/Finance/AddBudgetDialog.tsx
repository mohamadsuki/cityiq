import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { DepartmentSlug } from "@/lib/demoAccess";

const DEPARTMENTS: DepartmentSlug[] = [
  "finance",
  "education",
  "engineering",
  "welfare",
  "non-formal",
  "business",
];

function isUuid(v?: string | null) {
  return !!v && /^[0-9a-fA-F-]{36}$/.test(v);
}

export default function AddBudgetDialog({ onSaved }: { onSaved?: () => void }) {
  const { user, session, departments } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [department, setDepartment] = useState<DepartmentSlug>("finance");
  const [approved, setApproved] = useState<string>("");
  const [spent, setSpent] = useState<string>("");
  const [notes, setNotes] = useState("");

  const canPickDept = (dep: DepartmentSlug) => departments.includes(dep) || departments.length === 0; // mayor/ceo see all
  const isDemo = !session || !isUuid(user?.id);

  async function handleSubmit() {
    if (!itemName) {
      toast({ title: "שם חסר", description: "יש להזין שם תקציב", variant: "destructive" });
      return;
    }

    const payload = {
      id: `demo-${Date.now()}`,
      user_id: user?.id || "",
      department_slug: department,
      year,
      item_name: itemName,
      amount_approved: approved ? Number(approved) : null,
      amount_spent: spent ? Number(spent) : null,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;

    try {
      if (!user?.id) {
        toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
        return;
      }

      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        department_slug: department,
        year,
        item_name: itemName,
        amount_approved: approved ? Number(approved) : null,
        amount_spent: spent ? Number(spent) : null,
        notes: notes || null,
      });
      if (error) throw error;

      toast({ title: "נשמר", description: "התקציב נוסף בהצלחה" });
      setOpen(false);
      onSaved?.();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message || "אירעה שגיאה", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">הוסף תקציב</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת תקציב</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם תקציב</Label>
              <Input value={itemName} onChange={(e)=>setItemName(e.target.value)} placeholder="לדוגמה: שיפוץ בתי ספר" />
            </div>
            <div>
              <Label>שנה</Label>
              <Input type="number" value={year} onChange={(e)=>setYear(parseInt(e.target.value||`${new Date().getFullYear()}`))} />
            </div>
            <div>
              <Label>מחלקה</Label>
              <Select value={department} onValueChange={(v)=>setDepartment(v as DepartmentSlug)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מחלקה" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(canPickDept).map((d)=> (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>מאושר (₪)</Label>
              <Input type="number" inputMode="decimal" value={approved} onChange={(e)=>setApproved(e.target.value)} />
            </div>
            <div>
              <Label>בוצע (₪)</Label>
              <Input type="number" inputMode="decimal" value={spent} onChange={(e)=>setSpent(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>הערות</Label>
            <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={()=>setOpen(false)}>ביטול</Button>
            <Button onClick={handleSubmit}>שמור</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
