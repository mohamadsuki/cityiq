import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type License = Database['public']['Tables']['licenses']['Row'];

const STATUS = ["פעיל", "מבוטל", "זמני", "מתחדש", "פג תוקף", "ללא רישוי"];
const TYPES = ["מסחר", "שירותים", "מזון", "תעשייה קלה", "אחר"];

interface EditLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  license: License | null;
}

export function EditLicenseDialog({ open, onOpenChange, onSuccess, license }: EditLicenseDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    business_name: "",
    owner: "",
    type: "",
    status: "פעיל",
    license_number: "",
    expires_at: "",
    address: "",
    lat: "",
    lng: "",
    reason_no_license: "",
    phone: "",
    mobile: "",
    email: "",
    validity: "",
    business_nature: "",
    dock_fee: "",
    inspector: "",
    area: "",
    property: "",
    old_file: "",
    block_parcel_sub: "",
    location_description: "",
    fire_department_number: "",
    risk_level: "",
    file_holder: "",
    request_type: "",
    group_category: "",
    reported_area: "",
    request_date: "",
    delivery_date: "",
    follow_up_date: "",
    inspection_date: "",
    judgment_date: "",
    closure_date: "",
  });

  useEffect(() => {
    if (license) {
      setFormData({
        business_name: license.business_name || "",
        owner: license.owner || "",
        type: license.type || "",
        status: license.status || "פעיל",
        license_number: license.license_number || "",
        expires_at: license.expires_at || "",
        address: license.address || "",
        lat: license.lat?.toString() || "",
        lng: license.lng?.toString() || "",
        reason_no_license: license.reason_no_license || "",
        phone: (license as any).phone || "",
        mobile: (license as any).mobile || "",
        email: (license as any).email || "",
        validity: (license as any).validity || "",
        business_nature: (license as any).business_nature || "",
        dock_fee: (license as any).dock_fee || "",
        inspector: (license as any).inspector || "",
        area: (license as any).area || "",
        property: (license as any).property || "",
        old_file: (license as any).old_file || "",
        block_parcel_sub: (license as any).block_parcel_sub || "",
        location_description: (license as any).location_description || "",
        fire_department_number: (license as any).fire_department_number || "",
        risk_level: (license as any).risk_level || "",
        file_holder: (license as any).file_holder || "",
        request_type: (license as any).request_type || "",
        group_category: (license as any).group_category || "",
        reported_area: (license as any).reported_area?.toString() || "",
        request_date: (license as any).request_date || "",
        delivery_date: (license as any).delivery_date || "",
        follow_up_date: (license as any).follow_up_date || "",
        inspection_date: (license as any).inspection_date || "",
        judgment_date: (license as any).judgment_date || "",
        closure_date: (license as any).closure_date || "",
      });
    }
  }, [license]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!license) return;

    if (!formData.business_name) {
      toast({ title: "שם עסק חסר", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        business_name: formData.business_name,
        owner: formData.owner || null,
        type: formData.type || null,
        status: formData.status || null,
        license_number: formData.license_number || null,
        expires_at: formData.expires_at || null,
        address: formData.address || null,
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        reason_no_license: formData.reason_no_license || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        email: formData.email || null,
        validity: formData.validity || null,
        business_nature: formData.business_nature || null,
        dock_fee: formData.dock_fee || null,
        inspector: formData.inspector || null,
        area: formData.area || null,
        property: formData.property || null,
        old_file: formData.old_file || null,
        block_parcel_sub: formData.block_parcel_sub || null,
        location_description: formData.location_description || null,
        fire_department_number: formData.fire_department_number || null,
        risk_level: formData.risk_level || null,
        file_holder: formData.file_holder || null,
        request_type: formData.request_type || null,
        group_category: formData.group_category || null,
        reported_area: formData.reported_area ? parseFloat(formData.reported_area) : null,
        request_date: formData.request_date || null,
        delivery_date: formData.delivery_date || null,
        follow_up_date: formData.follow_up_date || null,
        inspection_date: formData.inspection_date || null,
        judgment_date: formData.judgment_date || null,
        closure_date: formData.closure_date || null,
      };

      const { error } = await supabase
        .from('licenses')
        .update(updateData)
        .eq('id', license.id);

      if (error) throw error;

      toast({
        title: "רישיון עודכן בהצלחה",
        description: "פרטי הרישיון עודכנו במערכת",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון הרישיון",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!license) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת רישיון עסק - {license.license_number || license.business_name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">שם עסק *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => updateFormData("business_name", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="owner">בעלים</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => updateFormData("owner", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>סוג עסק</Label>
              <Select value={formData.type} onValueChange={(value) => updateFormData("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג עסק" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground shadow-md">
                  {STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="license_number">מספר רישיון</Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => updateFormData("license_number", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">תוקף עד</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => updateFormData("expires_at", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobile">נייד</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) => updateFormData("mobile", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => updateFormData("address", e.target.value)}
              placeholder="כתובת העסק"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">קו רוחב (Latitude)</Label>
              <Input
                id="lat"
                value={formData.lat}
                onChange={(e) => updateFormData("lat", e.target.value)}
                placeholder="32.0853"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">קו אורך (Longitude)</Label>
              <Input
                id="lng"
                value={formData.lng}
                onChange={(e) => updateFormData("lng", e.target.value)}
                placeholder="34.7818"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason_no_license">סיבת אי-רישוי</Label>
            <Textarea
              id="reason_no_license"
              value={formData.reason_no_license}
              onChange={(e) => updateFormData("reason_no_license", e.target.value)}
              placeholder="נדחה / ממתין להשלמות / אחר"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity">תוקף/הערות</Label>
            <Input
              id="validity"
              value={formData.validity}
              onChange={(e) => updateFormData("validity", e.target.value)}
              placeholder="הערות נוספות על תוקף הרישיון"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business_nature">מהות עסק</Label>
            <Input
              id="business_nature"
              value={formData.business_nature}
              onChange={(e) => updateFormData("business_nature", e.target.value)}
              placeholder="סוג פעילות העסק"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="inspector">מפקח</Label>
            <Input
              id="inspector"
              value={formData.inspector}
              onChange={(e) => updateFormData("inspector", e.target.value)}
              placeholder="שם המפקח"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_type">סוג בקשה</Label>
            <Input
              id="request_type"
              value={formData.request_type}
              onChange={(e) => updateFormData("request_type", e.target.value)}
              placeholder="עסק חדש / חידוש / אחר"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_category">קבוצה</Label>
            <Input
              id="group_category"
              value={formData.group_category}
              onChange={(e) => updateFormData("group_category", e.target.value)}
              placeholder="קטגוריית עסק"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">אזור</Label>
            <Input
              id="area"
              value={formData.area}
              onChange={(e) => updateFormData("area", e.target.value)}
              placeholder="אזור גיאוגרפי"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="property">נכס</Label>
            <Input
              id="property"
              value={formData.property}
              onChange={(e) => updateFormData("property", e.target.value)}
              placeholder="מספר נכס"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reported_area">שטח מדווח (מ\"ר)</Label>
            <Input
              id="reported_area"
              type="number"
              value={formData.reported_area}
              onChange={(e) => updateFormData("reported_area", e.target.value)}
              placeholder="שטח במטרים רבועים"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="block_parcel_sub">גוש חלקה תת</Label>
            <Input
              id="block_parcel_sub"
              value={formData.block_parcel_sub}
              onChange={(e) => updateFormData("block_parcel_sub", e.target.value)}
              placeholder="מזהה גוש חלקה"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_description">תיאור מקום</Label>
            <Textarea
              id="location_description"
              value={formData.location_description}
              onChange={(e) => updateFormData("location_description", e.target.value)}
              placeholder="תיאור מיקום העסק"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fire_department_number">מספר כיבוי אש</Label>
            <Input
              id="fire_department_number"
              value={formData.fire_department_number}
              onChange={(e) => updateFormData("fire_department_number", e.target.value)}
              placeholder="מספר אישור כיבוי אש"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="risk_level">דרגת סיכון</Label>
            <Input
              id="risk_level"
              value={formData.risk_level}
              onChange={(e) => updateFormData("risk_level", e.target.value)}
              placeholder="רמת סיכון (0-5)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_holder">מחזיק בתיק</Label>
            <Input
              id="file_holder"
              value={formData.file_holder}
              onChange={(e) => updateFormData("file_holder", e.target.value)}
              placeholder="איש קשר אחראי"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="old_file">תיק ישן</Label>
            <Input
              id="old_file"
              value={formData.old_file}
              onChange={(e) => updateFormData("old_file", e.target.value)}
              placeholder="מספר תיק קודם"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dock_fee">חייב במזח</Label>
            <Input
              id="dock_fee"
              value={formData.dock_fee}
              onChange={(e) => updateFormData("dock_fee", e.target.value)}
              placeholder="חובת תשלום מזח"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="request_date">תאריך בקשה</Label>
              <Input
                id="request_date"
                type="date"
                value={formData.request_date}
                onChange={(e) => updateFormData("request_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery_date">תאריך מסירה</Label>
              <Input
                id="delivery_date"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => updateFormData("delivery_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="follow_up_date">תאריך מעקב</Label>
              <Input
                id="follow_up_date"
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => updateFormData("follow_up_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inspection_date">תאריך ביקורת</Label>
              <Input
                id="inspection_date"
                type="date"
                value={formData.inspection_date}
                onChange={(e) => updateFormData("inspection_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="judgment_date">תאריך פסק דין</Label>
              <Input
                id="judgment_date"
                type="date"
                value={formData.judgment_date}
                onChange={(e) => updateFormData("judgment_date", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="closure_date">תאריך סגירה</Label>
              <Input
                id="closure_date"
                type="date"
                value={formData.closure_date}
                onChange={(e) => updateFormData("closure_date", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "מעדכן..." : "עדכן רישיון"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}