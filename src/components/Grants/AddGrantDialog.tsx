import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { DepartmentSlug } from "@/lib/demoAccess";

interface AddGrantDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddGrantDialog({ isOpen, onClose, onSuccess }: AddGrantDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    ministry: "",
    department_slug: "finance" as DepartmentSlug,
    project_description: "",
    responsible_person: "",
    amount: "",
    submission_amount: "",
    approved_amount: "",
    support_amount: "",
    municipality_participation: "",
    status: "הוגש",
    submitted_at: "",
    decision_at: "",
    notes: "",
    rejection_reason: "",
  });

  const departments = [
    { value: "finance", label: "פיננסים" },
    { value: "education", label: "חינוך" },
    { value: "engineering", label: "הנדסה" },
    { value: "welfare", label: "רווחה" },
    { value: "non-formal", label: "חינוך בלתי פורמלי" },
    { value: "business", label: "רישוי עסקים" },
  ];

  const statuses = [
    { value: "הוגש", label: "הוגש" },
    { value: "אושר", label: "אושר" },
    { value: "נדחה", label: "נדחה" },
    { value: "לא רלוונטי", label: "לא רלוונטי" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.ministry) {
      toast({
        title: "שגיאה",
        description: "יש למלא שם ומשרד",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "שגיאה",
        description: "נדרש להתחבר למערכת",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("grants").insert([
        {
          name: formData.name,
          ministry: formData.ministry,
          department_slug: formData.department_slug,
          project_description: formData.project_description || null,
          responsible_person: formData.responsible_person || null,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          submission_amount: formData.submission_amount ? parseFloat(formData.submission_amount) : null,
          approved_amount: formData.approved_amount ? parseFloat(formData.approved_amount) : null,
          support_amount: formData.support_amount ? parseFloat(formData.support_amount) : null,
          municipality_participation: formData.municipality_participation ? parseFloat(formData.municipality_participation) : null,
          status: formData.status,
          submitted_at: formData.submitted_at || null,
          decision_at: formData.decision_at || null,
          notes: formData.notes || null,
          rejection_reason: (formData.status === "נדחה" || formData.status === "לא רלוונטי") ? formData.rejection_reason || null : null,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "הצלחה",
        description: "הקול הקורא נוסף בהצלחה",
      });

      // Reset form
      setFormData({
        name: "",
        ministry: "",
        department_slug: "finance",
        project_description: "",
        responsible_person: "",
        amount: "",
        submission_amount: "",
        approved_amount: "",
        support_amount: "",
        municipality_participation: "",
        status: "הוגש",
        submitted_at: "",
        decision_at: "",
        notes: "",
        rejection_reason: "",
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding grant:", error);
      toast({
        title: "שגיאה",
        description: "אירעה שגיאה בהוספת הקול הקורא",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת קול קורא חדש</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם הקול הקורא *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="שם הקול הקורא"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ministry">משרד *</Label>
              <Input
                id="ministry"
                value={formData.ministry}
                onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                placeholder="שם המשרד"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department_slug">מחלקה</Label>
              <Select value={formData.department_slug} onValueChange={(value) => setFormData({ ...formData, department_slug: value as DepartmentSlug })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsible_person">אחראי</Label>
              <Input
                id="responsible_person"
                value={formData.responsible_person}
                onChange={(e) => setFormData({ ...formData, responsible_person: e.target.value })}
                placeholder="שם האחראי"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">תקציב קול קורא</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="submission_amount">סכום הגשה</Label>
              <Input
                id="submission_amount"
                type="number"
                value={formData.submission_amount}
                onChange={(e) => setFormData({ ...formData, submission_amount: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="approved_amount">סכום שאושר</Label>
              <Input
                id="approved_amount"
                type="number"
                value={formData.approved_amount}
                onChange={(e) => setFormData({ ...formData, approved_amount: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="support_amount">סכום תמיכה</Label>
              <Input
                id="support_amount"
                type="number"
                value={formData.support_amount}
                onChange={(e) => setFormData({ ...formData, support_amount: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="municipality_participation">השתתפות עירייה</Label>
              <Input
                id="municipality_participation"
                type="number"
                value={formData.municipality_participation}
                onChange={(e) => setFormData({ ...formData, municipality_participation: e.target.value })}
                placeholder="0"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="submitted_at">תאריך הגשה</Label>
              <Input
                id="submitted_at"
                type="date"
                value={formData.submitted_at}
                onChange={(e) => setFormData({ ...formData, submitted_at: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="decision_at">תאריך החלטה</Label>
              <Input
                id="decision_at"
                type="date"
                value={formData.decision_at}
                onChange={(e) => setFormData({ ...formData, decision_at: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project_description">תיאור הפרויקט</Label>
            <Textarea
              id="project_description"
              value={formData.project_description}
              onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
              placeholder="תיאור מפורט של הפרויקט"
              className="min-h-[100px]"
            />
          </div>
          
          {(formData.status === "נדחה" || formData.status === "לא רלוונטי") && (
            <div className="space-y-2">
              <Label htmlFor="rejection_reason">סיבת דחייה</Label>
              <Textarea
                id="rejection_reason"
                value={formData.rejection_reason}
                onChange={(e) => setFormData({ ...formData, rejection_reason: e.target.value })}
                placeholder="סיבת הדחייה או אי הרלוונטיות"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "שומר..." : "שמירה"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}