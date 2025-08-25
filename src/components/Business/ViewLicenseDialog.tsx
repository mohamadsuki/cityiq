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
    { label: 'מספר רישיון', value: license.license_number },
    { label: 'שם עסק', value: license.business_name },
    { label: 'בעלים', value: license.owner },
    { label: 'סוג', value: license.type },
    { label: 'סטטוס', value: license.status, isBadge: true },
    { label: 'כתובת', value: license.address },
    { label: 'טלפון', value: license.phone },
    { label: 'נייד', value: license.mobile },
    { label: 'אימייל', value: license.email },
    { label: 'תוקף עד', value: formatDate(license.expires_at) },
    { label: 'מהות עסק', value: license.business_nature },
    { label: 'תאריך בקשה', value: formatDate(license.request_date) },
    { label: 'תאריך פקיעה', value: formatDate(license.expiry_date) },
    { label: 'סוג בקשה', value: license.request_type },
    { label: 'קבוצה', value: license.group_category },
    { label: 'שטח מדווח', value: license.reported_area ? `${license.reported_area} מ"ר` : null },
    { label: 'סיבת ללא רישוי', value: license.reason_no_license },
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
                {field.isBadge ? (
                  <Badge variant={getStatusBadgeVariant(field.value) as any}>
                    {field.value}
                  </Badge>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md">
                    {field.value}
                  </div>
                )}
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