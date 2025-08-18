import { useState } from "react";
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
import { useAuth } from "@/context/AuthContext";

interface AddInquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddInquiryDialog({ open, onOpenChange, onSuccess }: AddInquiryDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
    department_slug: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Submitting inquiry with user ID:', user.id);
      const inquiryData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        subject: formData.subject,
        description: formData.description,
        inquiry_type: formData.inquiry_type,
        source: formData.source,
        priority: formData.priority,
        department_slug: formData.department_slug as any || null,
        user_id: user.id,
      };
      console.log('Inquiry data:', inquiryData);
      
      const { error } = await supabase
        .from('public_inquiries')
        .insert(inquiryData);

      if (error) throw error;

      toast({
        title: "הפניה נוספה בהצלחה",
        description: "פניה ציבור חדשה נוספה למערכת",
      });
      
      onSuccess();
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        subject: "",
        description: "",
        inquiry_type: "",
        source: "",
        priority: "medium",
        department_slug: "",
      });
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message || "אירעה שגיאה בהוספת הפניה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>הוספת פניה ציבור חדשה</DialogTitle>
          <DialogDescription>
            הזינו את פרטי הפניה הציבורית
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

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>סוג פניה *</Label>
              <Select value={formData.inquiry_type} onValueChange={(value) => updateFormData("inquiry_type", value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג פניה" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="low">נמוכה</SelectItem>
                  <SelectItem value="medium">בינונית</SelectItem>
                  <SelectItem value="high">גבוהה</SelectItem>
                  <SelectItem value="urgent">דחוף</SelectItem>
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
              <SelectContent>
                <SelectItem value="finance">פיננסים</SelectItem>
                <SelectItem value="education">חינוך</SelectItem>
                <SelectItem value="engineering">הנדסה</SelectItem>
                <SelectItem value="welfare">רווחה</SelectItem>
                <SelectItem value="business">רישוי עסקים</SelectItem>
                <SelectItem value="non-formal">חינוך בלתי פורמאלי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "מוסיף..." : "הוסף פניה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}