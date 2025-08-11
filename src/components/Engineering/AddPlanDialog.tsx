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

function isUuid(v?: string | null) { return !!v && /^[0-9a-fA-F-]{36}$/.test(v); }

export default function AddPlanDialog({ onSaved }: { onSaved?: () => void }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [planNumber, setPlanNumber] = useState("");
  const [status, setStatus] = useState("בהכנה");
  const [landUse, setLandUse] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);

  const isDemo = !session || !isUuid(user?.id);

  async function handleSubmit() {
    if (!name) { toast({ title: "שם תוכנית חסר", variant: "destructive" }); return; }

    try {
      if (isDemo) {
        const id = `demo-${Date.now()}`;
        // Convert images to data URLs
        const toDataURL = (file: File) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file);
        });
        const image_urls: string[] = images ? await Promise.all(Array.from(images).map(toDataURL)) : [];
        const file_urls: string[] = files ? Array.from(files).map(f => `name:${f.name}`) : [];
        const raw = localStorage.getItem("demo_plans");
        const list = raw ? JSON.parse(raw) as any[] : [];
        const payload = { id, user_id: user?.id || "", department_slug: 'engineering', name, plan_number: planNumber || null, status, land_use: landUse || null, address: address || null, notes: notes || null, start_at: startAt ? new Date(startAt).toISOString() : null, end_at: endAt ? new Date(endAt).toISOString() : null, image_urls, file_urls };
        localStorage.setItem("demo_plans", JSON.stringify([payload, ...list]));
        toast({ title: "נשמר", description: "התוכנית נוספה (דמו)" });
        setOpen(false); onSaved?.(); return;
      }

      if (!user?.id) { toast({ title: "נדרש להתחבר", variant: "destructive" }); return; }

      const create = await supabase.from('plans').insert([{ user_id: user.id, department_slug: 'engineering', name, plan_number: planNumber || null, status, land_use: landUse || null, address: address || null, start_at: startAt ? new Date(startAt).toISOString() : null, end_at: endAt ? new Date(endAt).toISOString() : null }]).select('id').single();
      if (create.error) throw create.error;
      const planId = create.data.id as string;

      const uploadedImages: string[] = [];
      if (images) {
        for (const file of Array.from(images)) {
          const path = `plans/${planId}/images/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (!error) uploadedImages.push(path);
        }
      }
      const uploadedFiles: string[] = [];
      if (files) {
        for (const file of Array.from(files)) {
          const path = `plans/${planId}/files/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (!error) uploadedFiles.push(path);
        }
      }

      if (uploadedImages.length || uploadedFiles.length) {
        await supabase.from('plans').update({ image_urls: uploadedImages.length ? uploadedImages : null, file_urls: uploadedFiles.length ? uploadedFiles : null }).eq('id', planId);
      }

      toast({ title: "נשמר", description: "התוכנית נוספה בהצלחה" });
      setOpen(false); onSaved?.();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message || 'אירעה שגיאה', variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">הוסף תוכנית</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>הוספת תוכנית</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>שם תוכנית</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <Label>מספר תוכנית</Label>
            <Input value={planNumber} onChange={(e)=>setPlanNumber(e.target.value)} />
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                <SelectItem value="בהכנה">בהכנה</SelectItem>
                <SelectItem value="בהליך אישור">בהליך אישור</SelectItem>
                <SelectItem value="אושרה">אושרה</SelectItem>
                <SelectItem value="בביצוע">בביצוע</SelectItem>
                <SelectItem value="הושלמה">הושלמה</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>ייעוד קרקע</Label>
            <Input value={landUse} onChange={(e)=>setLandUse(e.target.value)} />
          </div>
          <div>
            <Label>תחילת ביצוע</Label>
            <Input type="date" value={startAt} onChange={(e)=>setStartAt(e.target.value)} />
          </div>
          <div>
            <Label>סיום ביצוע</Label>
            <Input type="date" value={endAt} onChange={(e)=>setEndAt(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>כתובת</Label>
            <Input value={address} onChange={(e)=>setAddress(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>הערות</Label>
            <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} />
          </div>
          <div>
            <Label>תמונות</Label>
            <Input type="file" accept="image/*" multiple onChange={(e)=>setImages(e.target.files)} />
          </div>
          <div>
            <Label>קבצים</Label>
            <Input type="file" multiple onChange={(e)=>setFiles(e.target.files)} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>ביטול</Button>
          <Button onClick={handleSubmit}>שמור</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
