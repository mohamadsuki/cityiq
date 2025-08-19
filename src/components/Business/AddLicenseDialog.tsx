import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

function isUuid(v?: string | null) { return !!v && /^[0-9a-fA-F-]{36}$/.test(v); }

const STATUS = ["פעיל", "מבוטל", "זמני", "מתחדש", "פג תוקף", "ללא רישוי"];
const TYPES = ["מסחר", "שירותים", "מזון", "תעשייה קלה", "אחר"];

export default function AddLicenseDialog({ onSaved }: { onSaved?: () => void }) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [owner, setOwner] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("פעיל");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reasonNoLicense, setReasonNoLicense] = useState("");
  const [images, setImages] = useState<FileList | null>(null);

  const isDemo = !session || !isUuid(user?.id);

  async function handleSubmit() {
    if (!businessName) { toast({ title: "שם עסק חסר", variant: "destructive" }); return; }

    try {
      if (isDemo) {
        const id = `demo-${Date.now()}`;
        const toDataURL = (file: File) => new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file); });
        const image_urls: string[] = images ? await Promise.all(Array.from(images).map(toDataURL)) : [];
        const raw = localStorage.getItem('demo_licenses');
        const list = raw ? JSON.parse(raw) as any[] : [];
        const payload = { id, user_id: user?.id || '', department_slug: 'business', business_name: businessName, owner: owner || null, type: type || null, status: status || null, license_number: licenseNumber || null, expires_at: expiresAt || null, reason_no_license: reasonNoLicense || null, image_urls };
        localStorage.setItem('demo_licenses', JSON.stringify([payload, ...list]));
        toast({ title: 'נשמר', description: 'העסק נוסף (דמו)' });
        setOpen(false); onSaved?.(); return;
      }

      if (!user?.id) { toast({ title: 'נדרש להתחבר', variant: 'destructive' }); return; }
      const create = await supabase.from('licenses').insert([{ user_id: user.id, department_slug: 'business', business_name: businessName, owner: owner || null, type: type || null, status: status || null, license_number: licenseNumber || null, expires_at: expiresAt ? new Date(expiresAt).toISOString().slice(0,10) : null, reason_no_license: reasonNoLicense || null }]).select('id').single();
      if (create.error) throw create.error;
      const licId = create.data.id as string;

      const uploadedImages: string[] = [];
      if (images) {
        for (const file of Array.from(images)) {
          const path = `licenses/${licId}/${Date.now()}_${file.name}`;
          const { error } = await supabase.storage.from('uploads').upload(path, file, { upsert: true });
          if (!error) uploadedImages.push(path);
        }
      }
      if (uploadedImages.length) {
        await supabase.from('licenses').update({ image_urls: uploadedImages }).eq('id', licId);
      }

      toast({ title: 'נשמר', description: 'העסק נוסף בהצלחה' });
      setOpen(false); onSaved?.();
    } catch (e: any) {
      toast({ title: 'שגיאה', description: e.message || 'אירעה שגיאה', variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">הוסף עסק</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>הוספת עסק</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>שם עסק</Label>
            <Input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} />
          </div>
          <div>
            <Label>בעלים</Label>
            <Input value={owner} onChange={(e)=>setOwner(e.target.value)} />
          </div>
          <div>
            <Label>סוג עסק</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="בחר סוג"/></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="בחר סטטוס"/></SelectTrigger>
              <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>מספר רישיון</Label>
            <Input value={licenseNumber} onChange={(e)=>setLicenseNumber(e.target.value)} />
          </div>
          <div>
            <Label>תוקף עד</Label>
            <Input type="date" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>סיבת אי-רישוי (אם רלוונטי)</Label>
            <Input value={reasonNoLicense} onChange={(e)=>setReasonNoLicense(e.target.value)} placeholder="נדחה / ממתין להשלמות / אחר" />
          </div>
          <div className="md:col-span-2">
            <Label>תמונות</Label>
            <Input type="file" accept="image/*" multiple onChange={(e)=>setImages(e.target.files)} />
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
