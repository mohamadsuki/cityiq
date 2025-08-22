import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type PublicInquiry = Database['public']['Tables']['public_inquiries']['Row'];

interface EditInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inquiry: PublicInquiry | null;
}

export function EditInquiryDialog({ open, onOpenChange, onSuccess, inquiry }: EditInquiryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    subject: "",
    description: "",
    inquiry_type: "",
    source: "",
    priority: "medium",
    status: "new",
    department_slug: "",
    internal_notes: "",
    response: "",
  });

  useEffect(() => {
    if (inquiry) {
      setFormData({
        name: inquiry.name || "",
        phone: inquiry.phone || "",
        email: inquiry.email || "",
        address: inquiry.address || "",
        subject: inquiry.subject || "",
        description: inquiry.description || "",
        inquiry_type: inquiry.inquiry_type || "",
        source: inquiry.source || "",
        priority: inquiry.priority || "medium",
        status: inquiry.status || "new",
        department_slug: inquiry.department_slug || "",
        internal_notes: inquiry.internal_notes || "",
        response: inquiry.response || "",
      });
    }
  }, [inquiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry) return;
    
    setIsLoading(true);
    try {
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        subject: formData.subject,
        description: formData.description,
        inquiry_type: formData.inquiry_type,
        source: formData.source,
        priority: formData.priority,
        status: formData.status,
        department_slug: formData.department_slug as any || null,
        internal_notes: formData.internal_notes,
        response: formData.response,
        resolved_at: formData.status === 'resolved' ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from('public_inquiries')
        .update(updateData)
        .eq('id', inquiry.id);

      if (error) throw error;

      toast({
        title: "הפניה עודכנה בהצלחה",
        description: "פרטי הפניה עודכנו במערכת",
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בעדכון הפניה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>עריכת פניה ציבור - {inquiry.inquiry_number}</DialogTitle>
          <DialogDescription>
            עריכת פרטי הפניה ומעקב טיפול
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם פונה *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">נושא הפניה *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => updateFormData("subject", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור הפניה</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>סוג פניה *</Label>
              <Select value={formData.inquiry_type} onValueChange={(value) => updateFormData("inquiry_type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג פניה" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="complaint">תלונה</SelectItem>
                  <SelectItem value="request">בקשה</SelectItem>
                  <SelectItem value="information">בקשת מידע</SelectItem>
                  <SelectItem value="suggestion">הצעה</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>מקור הפניה *</Label>
              <Select value={formData.source} onValueChange={(value) => updateFormData("source", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="whatsapp">ווטסאפ</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="in_person">פניה ישירה</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => updateFormData("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-md z-50">
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="in_progress">בטיפול</SelectItem>
                  <SelectItem value="pending">בהמתנה</SelectItem>
                  <SelectItem value="resolved">טופל</SelectItem>
                  <SelectItem value="closed">סגור</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>מחלקה אחראית</Label>
            <Select value={formData.department_slug} onValueChange={(value) => updateFormData("department_slug", value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר מחלקה" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value="finance">פיננסים</SelectItem>
                <SelectItem value="education">חינוך</SelectItem>
                <SelectItem value="engineering">הנדסה</SelectItem>
                <SelectItem value="welfare">רווחה</SelectItem>
                <SelectItem value="business">רישוי עסקים</SelectItem>
                <SelectItem value="non-formal">חינוך בלתי פורמאלי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">מענה לפונה</Label>
            <Textarea
              id="response"
              value={formData.response}
              onChange={(e) => updateFormData("response", e.target.value)}
              rows={3}
              placeholder="המענה שנמסר לפונה..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">הערות פנימיות</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => updateFormData("internal_notes", e.target.value)}
              rows={3}
              placeholder="הערות למעקב פנימי..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "מעדכן..." : "עדכן פניה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}