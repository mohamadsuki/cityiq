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