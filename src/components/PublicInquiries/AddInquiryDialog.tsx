import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface PublicInquiry {
  id: string;
  inquiry_number: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  inquiry_type: string;
  source: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  assigned_to?: string;
  department_slug?: string;
  response?: string;
  internal_notes?: string;
  resolved_at?: string;
  created_at: string;
}

interface AddInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  editData?: PublicInquiry | null;
}

export default function AddInquiryDialog({ 
  open, 
  onOpenChange, 
  onSaved,
  editData 
}: AddInquiryDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    inquiry_type: "",
    source: "",
    subject: "",
    description: "",
    status: "new",
    priority: "medium",
    department_slug: "",
    response: "",
    internal_notes: "",
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || "",
        phone: editData.phone || "",
        email: editData.email || "",
        address: editData.address || "",
        inquiry_type: editData.inquiry_type || "",
        source: editData.source || "",
        subject: editData.subject || "",
        description: editData.description || "",
        status: editData.status || "new",
        priority: editData.priority || "medium",
        department_slug: editData.department_slug || "",
        response: editData.response || "",
        internal_notes: editData.internal_notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        inquiry_type: "",
        source: "",
        subject: "",
        description: "",
        status: "new",
        priority: "medium",
        department_slug: "",
        response: "",
        internal_notes: "",
      });
    }
  }, [editData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      const inquiryData = {
        ...formData,
        user_id: user.id,
        department_slug: formData.department_slug || null,
      } as any;

      if (editData) {
        const { error } = await supabase
          .from('public_inquiries')
          .update(inquiryData)
          .eq('id', editData.id);

        if (error) throw error;

        toast({
          title: "הצלחה",
          description: "הפניה עודכנה בהצלחה",
        });
      } else {
        const { error } = await supabase
          .from('public_inquiries')
          .insert(inquiryData);

        if (error) throw error;

        toast({
          title: "הצלחה",
          description: "הפניה נוספה בהצלחה",
        });
      }

      onSaved();
    } catch (error) {
      console.error('Error saving inquiry:', error);
      toast({
        title: "שגיאה",
        description: editData ? "לא ניתן לעדכן את הפניה" : "לא ניתן להוסיף את הפניה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>
            {editData ? "עריכת פניה" : "הוספת פניה חדשה"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הפונה *</Label>
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
                placeholder="05xxxxxxxx"
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

            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry_type">סוג פניה *</Label>
              <Select value={formData.inquiry_type} onValueChange={(value) => updateFormData("inquiry_type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג פניה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaint">תלונה</SelectItem>
                  <SelectItem value="request">בקשה</SelectItem>
                  <SelectItem value="information">מידע</SelectItem>
                  <SelectItem value="licensing">רישוי</SelectItem>
                  <SelectItem value="maintenance">תחזוקה</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">מקור הפניה *</Label>
              <Select value={formData.source} onValueChange={(value) => updateFormData("source", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מקור פניה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">וואטסאפ</SelectItem>
                  <SelectItem value="email">אימייל</SelectItem>
                  <SelectItem value="phone">טלפון</SelectItem>
                  <SelectItem value="in_person">פנים אל פנים</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="social_media">רשתות חברתיות</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">חדש</SelectItem>
                  <SelectItem value="in_progress">בטיפול</SelectItem>
                  <SelectItem value="waiting_approval">ממתין לאישור</SelectItem>
                  <SelectItem value="resolved">נפתר</SelectItem>
                  <SelectItem value="closed">סגור</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">עדיפות</Label>
              <Select value={formData.priority} onValueChange={(value) => updateFormData("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">נמוך</SelectItem>
                  <SelectItem value="medium">בינוני</SelectItem>
                  <SelectItem value="high">גבוה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department_slug">מחלקה אחראית</Label>
              <Select value={formData.department_slug} onValueChange={(value) => updateFormData("department_slug", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר מחלקה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">בחר מחלקה</SelectItem>
                  <SelectItem value="mayor">ראש העיר</SelectItem>
                  <SelectItem value="ceo">מנכ״ל</SelectItem>
                  <SelectItem value="finance">כספים</SelectItem>
                  <SelectItem value="education">חינוך</SelectItem>
                  <SelectItem value="welfare">רווחה</SelectItem>
                  <SelectItem value="engineering">הנדסה</SelectItem>
                  <SelectItem value="business">רישוי עסקים</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">נושא הפניה *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => updateFormData("subject", e.target.value)}
              required
              placeholder="תיאור קצר של נושא הפניה"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור הפניה</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
              placeholder="תיאור מפורט של הפניה..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">תגובה</Label>
            <Textarea
              id="response"
              value={formData.response}
              onChange={(e) => updateFormData("response", e.target.value)}
              rows={3}
              placeholder="תגובה לפונה..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_notes">הערות פנימיות</Label>
            <Textarea
              id="internal_notes"
              value={formData.internal_notes}
              onChange={(e) => updateFormData("internal_notes", e.target.value)}
              rows={2}
              placeholder="הערות פנימיות לצוות..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="ml-2"
            >
              ביטול
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "שומר..." : editData ? "עדכן" : "שמור"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}