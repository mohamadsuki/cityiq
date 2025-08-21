import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
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

export default function AddProjectDialog({ onSaved, defaultDepartment, hideDepartmentPicker }: { onSaved?: () => void; defaultDepartment?: DepartmentSlug; hideDepartmentPicker?: boolean }) {
  const { user, session, departments } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState<DepartmentSlug>(defaultDepartment ?? "finance");
  const [status, setStatus] = useState<string>("בביצוע");
  const [domain, setDomain] = useState<string>("");
  const [budgetApproved, setBudgetApproved] = useState<string>("");
  const [budgetExecuted, setBudgetExecuted] = useState<string>("");
  const [progress, setProgress] = useState<string>("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);
  const [docFiles, setDocFiles] = useState<FileList | null>(null);

  const canPickDept = (dep: DepartmentSlug) => departments.includes(dep) || departments.length === 0; // mayor/ceo
  

  async function handleSubmit() {
    if (!name) {
      toast({ title: "שם פרויקט חסר", description: "יש להזין שם", variant: "destructive" });
      return;
    }

    try {
      if (!user?.id) {
        toast({ title: "נדרש להתחבר", description: "יש להתחבר כדי לבצע פעולה זו", variant: "destructive" });
        return;
      }

      // Create project row
      const created = await supabase.from("projects").insert({
        user_id: user.id,
        code: code || null,
        name,
        department_slug: department,
        status: status || null,
        domain: domain || null,
        budget_approved: budgetApproved ? Number(budgetApproved) : null,
        budget_executed: budgetExecuted ? Number(budgetExecuted) : null,
        progress: progress ? Number(progress) : 0,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
      }).select('id').single();
      if (created.error) throw created.error;
      const projId = created.data.id as string;

      // Upload media with safe filenames
      const uploadedImages: string[] = [];
      if (imageFiles) {
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExtension = file.name.split('.').pop() || '';
          const safeName = `${Date.now()}_image_${i}.${fileExtension}`;
          const path = `projects/${projId}/${safeName}`;
          const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (!error) {
            uploadedImages.push(path);
          } else {
            console.error('Image upload error:', error);
          }
        }
      }
      const uploadedFiles: string[] = [];
      if (docFiles) {
        for (let i = 0; i < docFiles.length; i++) {
          const file = docFiles[i];
          const fileExtension = file.name.split('.').pop() || '';
          const safeName = `${Date.now()}_document_${i}.${fileExtension}`;
          const path = `projects/${projId}/${safeName}`;
          const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (!error) {
            uploadedFiles.push(path);
          } else {
            console.error('Document upload error:', error);
          }
        }
      }

      if (uploadedImages.length || uploadedFiles.length) {
        const { error } = await supabase.from('projects').update({ image_urls: uploadedImages.length ? uploadedImages : null, file_urls: uploadedFiles.length ? uploadedFiles : null }).eq('id', projId);
        if (error) throw error;
      }

      toast({ title: "נשמר", description: "הפרויקט נוסף בהצלחה" });
      setOpen(false);
      onSaved?.();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message || "אירעה שגיאה", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">הוסף פרויקט</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת פרויקט</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>קוד/מספר תב"ר</Label>
              <Input value={code} onChange={(e)=>setCode(e.target.value)} placeholder="למשל: 2024-001" />
            </div>
            <div>
              <Label>שם פרויקט</Label>
              <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="למשל: שיפוץ בתי ספר" />
            </div>
            {!hideDepartmentPicker && (
              <div>
                <Label>מחלקה</Label>
                <Select value={department} onValueChange={(v)=>setDepartment(v as DepartmentSlug)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מחלקה" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                    {DEPARTMENTS.filter(canPickDept).map((d)=> (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>סטטוס</Label>
              <Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="למשל: בביצוע" />
            </div>
            <div>
              <Label>תחום</Label>
              <Select value={domain} onValueChange={setDomain}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר תחום" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  <SelectItem value="מבני ציבור">מבני ציבור</SelectItem>
                  <SelectItem value="תשתיות">תשתיות</SelectItem>
                  <SelectItem value="תכנון">תכנון</SelectItem>
                  <SelectItem value="סביבה">סביבה</SelectItem>
                  <SelectItem value="כלכלי">כלכלי</SelectItem>
                  <SelectItem value="אנרגיה">אנרגיה</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תקציב מאושר (₪)</Label>
              <Input type="number" inputMode="decimal" value={budgetApproved} onChange={(e)=>setBudgetApproved(e.target.value)} />
            </div>
            <div>
              <Label>בוצע (₪)</Label>
              <Input type="number" inputMode="decimal" value={budgetExecuted} onChange={(e)=>setBudgetExecuted(e.target.value)} />
            </div>
            <div>
              <Label>התקדמות (%)</Label>
              <Input type="number" min={0} max={100} value={progress} onChange={(e)=>setProgress(e.target.value)} />
            </div>
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
