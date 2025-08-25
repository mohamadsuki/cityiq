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
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [images, setImages] = useState<FileList | null>(null);
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [validity, setValidity] = useState("");
  
  // Additional fields from Excel import
  const [businessNature, setBusinessNature] = useState("");
  const [dockFee, setDockFee] = useState("");
  const [inspector, setInspector] = useState("");
  const [area, setArea] = useState("");
  const [property, setProperty] = useState("");
  const [oldFile, setOldFile] = useState("");
  const [blockParcelSub, setBlockParcelSub] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [fireDepartmentNumber, setFireDepartmentNumber] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [fileHolder, setFileHolder] = useState("");
  const [requestType, setRequestType] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [reportedArea, setReportedArea] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");
  const [judgmentDate, setJudgmentDate] = useState("");
  const [closureDate, setClosureDate] = useState("");

  

  async function handleSubmit() {
    if (!businessName) { toast({ title: "שם עסק חסר", variant: "destructive" }); return; }

    try {
      if (!user?.id) { toast({ title: 'נדרש להתחבר', variant: 'destructive' }); return; }
      const create = await supabase.from('licenses').insert([{ 
        user_id: user.id, 
        department_slug: 'business', 
        business_name: businessName, 
        owner: owner || null, 
        type: type || null, 
        status: status || null, 
        license_number: licenseNumber || null, 
        expires_at: expiresAt ? new Date(expiresAt).toISOString().slice(0,10) : null, 
        reason_no_license: reasonNoLicense || null,
        address: address || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        phone: phone || null,
        mobile: mobile || null,
        email: email || null,
        validity: validity || null,
        business_nature: businessNature || null,
        dock_fee: dockFee || null,
        inspector: inspector || null,
        area: area || null,
        property: property || null,
        old_file: oldFile || null,
        block_parcel_sub: blockParcelSub || null,
        location_description: locationDescription || null,
        fire_department_number: fireDepartmentNumber || null,
        risk_level: riskLevel || null,
        file_holder: fileHolder || null,
        request_type: requestType || null,
        group_category: groupCategory || null,
        reported_area: reportedArea ? parseFloat(reportedArea) : null,
        request_date: requestDate ? new Date(requestDate).toISOString().slice(0,10) : null,
        delivery_date: deliveryDate ? new Date(deliveryDate).toISOString().slice(0,10) : null,
        follow_up_date: followUpDate ? new Date(followUpDate).toISOString().slice(0,10) : null,
        inspection_date: inspectionDate ? new Date(inspectionDate).toISOString().slice(0,10) : null,
        judgment_date: judgmentDate ? new Date(judgmentDate).toISOString().slice(0,10) : null,
        closure_date: closureDate ? new Date(closureDate).toISOString().slice(0,10) : null
      }]).select('id').single();
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
            <Label>כתובת</Label>
            <Input value={address} onChange={(e)=>setAddress(e.target.value)} placeholder="כתובת העסק" />
          </div>
          <div>
            <Label>קו רוחב (Latitude)</Label>
            <Input value={lat} onChange={(e)=>setLat(e.target.value)} placeholder="32.0853" />
          </div>
          <div>
            <Label>קו אורך (Longitude)</Label>
            <Input value={lng} onChange={(e)=>setLng(e.target.value)} placeholder="34.7818" />
          </div>
          <div>
            <Label>טלפון</Label>
            <Input value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="מספר טלפון" />
          </div>
          <div>
            <Label>נייד</Label>
            <Input value={mobile} onChange={(e)=>setMobile(e.target.value)} placeholder="מספר נייד" />
          </div>
          <div className="md:col-span-2">
            <Label>אימייל</Label>
            <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="כתובת אימייל" type="email" />
          </div>
          <div className="md:col-span-2">
            <Label>סיבת אי-רישוי (אם רלוונטי)</Label>
            <Input value={reasonNoLicense} onChange={(e)=>setReasonNoLicense(e.target.value)} placeholder="נדחה / ממתין להשלמות / אחר" />
          </div>
          <div className="md:col-span-2">
            <Label>תוקף/הערות</Label>
            <Input value={validity} onChange={(e)=>setValidity(e.target.value)} placeholder="הערות נוספות על תוקף הרישיון" />
          </div>
          <div>
            <Label>מהות עסק</Label>
            <Input value={businessNature} onChange={(e)=>setBusinessNature(e.target.value)} placeholder="סוג פעילות העסק" />
          </div>
          <div>
            <Label>מפקח</Label>
            <Input value={inspector} onChange={(e)=>setInspector(e.target.value)} placeholder="שם המפקח" />
          </div>
          <div>
            <Label>סוג בקשה</Label>
            <Input value={requestType} onChange={(e)=>setRequestType(e.target.value)} placeholder="עסק חדש / חידוש / אחר" />
          </div>
          <div>
            <Label>קבוצה</Label>
            <Input value={groupCategory} onChange={(e)=>setGroupCategory(e.target.value)} placeholder="קטגוריית עסק" />
          </div>
          <div>
            <Label>אזור</Label>
            <Input value={area} onChange={(e)=>setArea(e.target.value)} placeholder="אזור גיאוגרפי" />
          </div>
          <div>
            <Label>נכס</Label>
            <Input value={property} onChange={(e)=>setProperty(e.target.value)} placeholder="מספר נכס" />
          </div>
          <div>
            <Label>שטח מדווח (מ\"ר)</Label>
            <Input value={reportedArea} onChange={(e)=>setReportedArea(e.target.value)} placeholder="שטח במטרים רבועים" type="number" />
          </div>
          <div>
            <Label>גוש חלקה תת</Label>
            <Input value={blockParcelSub} onChange={(e)=>setBlockParcelSub(e.target.value)} placeholder="מזהה גוש חלקה" />
          </div>
          <div className="md:col-span-2">
            <Label>תיאור מקום</Label>
            <Input value={locationDescription} onChange={(e)=>setLocationDescription(e.target.value)} placeholder="תיאור מיקום העסק" />
          </div>
          <div>
            <Label>מספר כיבוי אש</Label>
            <Input value={fireDepartmentNumber} onChange={(e)=>setFireDepartmentNumber(e.target.value)} placeholder="מספר אישור כיבוי אש" />
          </div>
          <div>
            <Label>דרגת סיכון</Label>
            <Input value={riskLevel} onChange={(e)=>setRiskLevel(e.target.value)} placeholder="רמת סיכון (0-5)" />
          </div>
          <div>
            <Label>מחזיק בתיק</Label>
            <Input value={fileHolder} onChange={(e)=>setFileHolder(e.target.value)} placeholder="איש קשר אחראי" />
          </div>
          <div>
            <Label>תיק ישן</Label>
            <Input value={oldFile} onChange={(e)=>setOldFile(e.target.value)} placeholder="מספר תיק קודם" />
          </div>
          <div>
            <Label>חייב במזח</Label>
            <Input value={dockFee} onChange={(e)=>setDockFee(e.target.value)} placeholder="חובת תשלום מזח" />
          </div>
          <div>
            <Label>תאריך בקשה</Label>
            <Input type="date" value={requestDate} onChange={(e)=>setRequestDate(e.target.value)} />
          </div>
          <div>
            <Label>תאריך מסירה</Label>
            <Input type="date" value={deliveryDate} onChange={(e)=>setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <Label>תאריך מעקב</Label>
            <Input type="date" value={followUpDate} onChange={(e)=>setFollowUpDate(e.target.value)} />
          </div>
          <div>
            <Label>תאריך ביקורת</Label>
            <Input type="date" value={inspectionDate} onChange={(e)=>setInspectionDate(e.target.value)} />
          </div>
          <div>
            <Label>תאריך פסק דין</Label>
            <Input type="date" value={judgmentDate} onChange={(e)=>setJudgmentDate(e.target.value)} />
          </div>
          <div>
            <Label>תאריך סגירה</Label>
            <Input type="date" value={closureDate} onChange={(e)=>setClosureDate(e.target.value)} />
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
