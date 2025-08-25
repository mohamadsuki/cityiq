import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ViewLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: any;
}

export function ViewLicenseDialog({ open, onOpenChange, license }: ViewLicenseDialogProps) {
  if (!license) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'לא צוין';
    try {
      return new Date(dateStr).toLocaleDateString('he-IL');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    if (!status) return 'outline';
    switch (status) {
      case 'פעיל': return 'default';
      case 'מבוטל': return 'destructive';
      case 'זמני': return 'secondary';
      case 'פג תוקף': return 'destructive';
      default: return 'outline';
    }
  };

  const fields = [
    { label: 'רישיון', value: license.license_number },
    { label: 'שם עסק', value: license.business_name },
    { label: 'שם בעל העסק', value: license.owner },
    { label: 'רחוב', value: license.address },
    { label: 'מס טלפון', value: license.phone },
    { label: 'מס פלאפון', value: license.mobile },
    { label: 'כתובת מייל עסק', value: license.email },
    { label: 'תוקף', value: license.validity },
    { label: 'תא.עדכון ק.תוקף', value: formatDate(license.expires_at) },
    { label: 'חייב במזח', value: license.dock_fee },
    { label: 'מהות עסק', value: license.business_nature },
    { label: 'תאריך פקיעה', value: formatDate(license.expiry_date) },
    { label: 'תאריך בקשה', value: formatDate(license.request_date) },
    { label: 'תאריך מסירה', value: formatDate(license.delivery_date) },
    { label: 'ימים מתא.בקשה', value: license.days_from_request },
    { label: 'ימים בהיתר זמני', value: license.days_temporary_permit },
    { label: 'מפקח', value: license.inspector },
    { label: 'אזור', value: license.area },
    { label: 'נכס', value: license.property },
    { label: 'תיק ישן', value: license.old_file },
    { label: 'גוש חלקה תת', value: license.block_parcel_sub },
    { label: 'תאריך מעקב', value: formatDate(license.follow_up_date) },
    { label: 'תאריך ביקורת', value: formatDate(license.inspection_date) },
    { label: 'סוג בקשה', value: license.request_type },
    { label: 'קבוצה', value: license.group_category },
    { label: 'ביצוע פס\'ד', value: license.judgment_execution },
    { label: 'ת. פסק דין', value: formatDate(license.judgment_date) },
    { label: 'תאריך סגירה', value: formatDate(license.closure_date) },
    { label: 'תאור מקום', value: license.location_description },
    { label: 'מספר כיבוי אש', value: license.fire_department_number },
    { label: 'דרגת סיכון', value: license.risk_level },
    { label: 'מחזיק בתיק', value: license.file_holder },
    { label: 'שטח מדווח', value: license.reported_area ? `${license.reported_area} מ"ר` : null },
  ];

  const nonEmptyFields = fields.filter(field => 
    field.value && field.value !== 'לא צוין' && field.value.toString().trim() !== ''
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">פרטי רישיון עסק</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nonEmptyFields.map((field, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {field.label}
              </label>
               <div className="text-sm">
                 <div className="p-2 bg-muted/50 rounded-md">
                   {field.value}
                 </div>
               </div>
            </div>
          ))}
        </div>

        {license.lat && license.lng && (
          <>
            <Separator />
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                מיקום גאוגרפי
              </label>
              <div className="text-sm p-2 bg-muted/50 rounded-md">
                קו רוחב: {license.lat}, קו אורך: {license.lng}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}