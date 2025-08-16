import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddTabarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const DOMAINS = [
  { value: "energy", label: "אנרגיה" },
  { value: "organizational", label: "ארגוני" },
  { value: "digital", label: "דיגיטליים" },
  { value: "veterinary", label: "ווטרינריה" },
  { value: "education_buildings", label: "מוסדות חינוך - בנוי" },
  { value: "public_buildings", label: "מוסדות ציבור - בנוי" },
  { value: "environment", label: "סביבה" },
  { value: "activities", label: "פעילויות" },
  { value: "welfare", label: "רווחה" },
  { value: "public_spaces", label: "שטחים ציבוריים" },
  { value: "planning", label: "תכנון" },
  { value: "infrastructure_roads", label: "תשתיות וכבישים" }
];

const FUNDING_SOURCES = [
  { value: "environmental_protection", label: "הגנת סביבה" },
  { value: "lottery", label: "מפעל הפיס" },
  { value: "education_ministry", label: "משרד חינוך" },
  { value: "construction_housing_ministry", label: "משרד בינוי ושיכון" },
  { value: "loan", label: "הלוואה" },
  { value: "interior_ministry", label: "משרד פנים" },
  { value: "economy_ministry", label: "משרד הכלכלה" },
  { value: "rmi", label: "רמי" },
  { value: "negev_galilee_resilience_ministry", label: "משרד הנגב, הגליל והחוסן הלאומי" },
  { value: "national_digital_ministry", label: "משרד הדיגיטל הלאומי" },
  { value: "environmental_protection_ministry", label: "משרד להגנת הסביבה" },
  { value: "culture_ministry", label: "משרד התרבות" },
  { value: "science_technology_ministry", label: "משרד המדע והטכנולוגיה" },
  { value: "planning_administration", label: "מנהל תכנון" },
  { value: "transportation_ministry", label: "משרד תחבורה" },
  { value: "health_ministry", label: "משרד בריאות" },
  { value: "municipality", label: "עירייה" },
  { value: "energy_ministry", label: "משרד האנרגיה" },
  { value: "agriculture_ministry", label: "משרד החקלאות" }
];

const STATUS_OPTIONS = [
  { value: "planning", label: "בתכנון" },
  { value: "active", label: "פעיל" },
  { value: "closed", label: "סגור" },
  { value: "delayed", label: "בעיכוב" }
];

export default function AddTabarDialog({ open, onOpenChange, onSaved }: AddTabarDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tabar_number: "",
    tabar_name: "",
    domain: "",
    funding_sources: [] as string[],
    approved_budget: "",
    income_actual: "",
    expense_actual: "",
    status: "planning"
  });

  const handleFundingSourceChange = (source: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      funding_sources: checked 
        ? [...prev.funding_sources, source]
        : prev.funding_sources.filter(s => s !== source)
    }));
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    
    if (!formData.tabar_name.trim()) {
      toast.error("נא למלא שם תבר");
      return;
    }

    setLoading(true);

    try {
      const surplus_deficit = (Number(formData.income_actual) || 0) - (Number(formData.expense_actual) || 0);

      const { error } = await supabase.from("tabarim").insert({
        user_id: user.id,
        tabar_number: formData.tabar_number || null,
        tabar_name: formData.tabar_name,
        domain: (formData.domain as any) || null,
        funding_source1: (formData.funding_sources[0] as any) || null,
        funding_source2: (formData.funding_sources[1] as any) || null,
        funding_source3: (formData.funding_sources[2] as any) || null,
        approved_budget: formData.approved_budget ? Number(formData.approved_budget) : null,
        income_actual: formData.income_actual ? Number(formData.income_actual) : null,
        expense_actual: formData.expense_actual ? Number(formData.expense_actual) : null,
        surplus_deficit,
        status: (formData.status as any)
      });

      if (error) throw error;

      toast.success("תבר נוסף בהצלחה");
      setFormData({
        tabar_number: "",
        tabar_name: "",
        domain: "",
        funding_sources: [],
        approved_budget: "",
        income_actual: "",
        expense_actual: "",
        status: "planning"
      });
      onSaved?.();
    } catch (error) {
      console.error("Error adding tabar:", error);
      toast.error("שגיאה בהוספת תבר");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף תבר חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tabar_number">מספר תבר</Label>
              <Input
                id="tabar_number"
                value={formData.tabar_number}
                onChange={(e) => setFormData(prev => ({...prev, tabar_number: e.target.value}))}
                placeholder="מספר תבר"
              />
            </div>

            <div>
              <Label htmlFor="status">סטטוס</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tabar_name">שם תבר *</Label>
            <Input
              id="tabar_name"
              value={formData.tabar_name}
              onChange={(e) => setFormData(prev => ({...prev, tabar_name: e.target.value}))}
              placeholder="שם התבר"
              required
            />
          </div>

          <div>
            <Label htmlFor="domain">תחום</Label>
            <Select value={formData.domain} onValueChange={(value) => setFormData(prev => ({...prev, domain: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר תחום" />
              </SelectTrigger>
              <SelectContent>
                {DOMAINS.map(domain => (
                  <SelectItem key={domain.value} value={domain.value}>
                    {domain.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>מקורות תקציב (ניתן לבחור עד 3)</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
              {FUNDING_SOURCES.map(source => (
                <div key={source.value} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={source.value}
                    checked={formData.funding_sources.includes(source.value)}
                    onCheckedChange={(checked) => handleFundingSourceChange(source.value, checked as boolean)}
                    disabled={!formData.funding_sources.includes(source.value) && formData.funding_sources.length >= 3}
                  />
                  <Label htmlFor={source.value} className="text-sm">
                    {source.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="approved_budget">תקציב מאושר</Label>
              <Input
                id="approved_budget"
                type="number"
                value={formData.approved_budget}
                onChange={(e) => setFormData(prev => ({...prev, approved_budget: e.target.value}))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="income_actual">ביצוע מצטבר הכנסות</Label>
              <Input
                id="income_actual"
                type="number"
                value={formData.income_actual}
                onChange={(e) => setFormData(prev => ({...prev, income_actual: e.target.value}))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="expense_actual">ביצוע מצטבר הוצאות</Label>
              <Input
                id="expense_actual"
                type="number"
                value={formData.expense_actual}
                onChange={(e) => setFormData(prev => ({...prev, expense_actual: e.target.value}))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ביטול
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "שומר..." : "שמור תבר"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}