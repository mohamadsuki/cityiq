import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, Save } from "lucide-react";

const STORAGE_KEY = "global_logo_src";
const CITY_NAME_KEY = "global_city_name";

interface PageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PageSettingsDialog({ open, onOpenChange }: PageSettingsDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [cityName, setCityName] = useState<string>("שם העיר");
  const [cityInput, setCityInput] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSrc(saved);
    const savedCity = localStorage.getItem(CITY_NAME_KEY);
    if (savedCity) setCityName(savedCity);
  }, []);

  useEffect(() => {
    if (open) {
      setCityInput(cityName);
    }
  }, [open, cityName]);

  const displaySrc = useMemo(() => fileDataUrl || urlInput.trim() || src || "/placeholder.svg", [fileDataUrl, urlInput, src]);

  const handleFile = async (file?: File | null) => {
    if (!file) { setFileDataUrl(null); return; }
    const toDataURL = (f: File) => new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(f);
    });
    const dataUrl = await toDataURL(file);
    setFileDataUrl(dataUrl);
  };

  const handleSave = () => {
    const newSrc = fileDataUrl || (urlInput.trim() ? urlInput.trim() : src);
    const newCity = cityInput.trim() ? cityInput.trim() : cityName;
    if (newSrc) {
      localStorage.setItem(STORAGE_KEY, newSrc);
      setSrc(newSrc);
    }
    if (newCity) {
      localStorage.setItem(CITY_NAME_KEY, newCity);
      setCityName(newCity);
    }
    onOpenChange(false);
  };

  const handleRemove = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSrc(null);
    setFileDataUrl(null);
    setUrlInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת דף</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">עדכון שם העיר והלוגו</span>
          </div>
          <div>
            <label className="text-sm mb-1 block">שם העיר</label>
            <Input placeholder="שם העיר" value={cityInput} onChange={(e)=>setCityInput(e.target.value)} />
          </div>
          <div>
            <label className="text-sm mb-1 block">תצוגה מקדימה</label>
            <div className="flex items-center gap-3">
              <img src={displaySrc} alt="תצוגה מקדימה - לוגו" className="h-12 w-auto" />
              <span className="text-sm text-muted-foreground">שם: {cityInput || cityName}</span>
            </div>
          </div>
          <div>
            <label className="text-sm mb-1 block">העלאת קובץ</label>
            <Input type="file" accept="image/*" onChange={(e)=>handleFile(e.target.files?.[0])} />
          </div>
          <div>
            <label className="text-sm mb-1 block">כתובת תמונה (URL)</label>
            <Input placeholder="https://example.com/logo.png" value={urlInput} onChange={(e)=>setUrlInput(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> שמירה
            </Button>
            <Button variant="destructive" onClick={handleRemove} className="inline-flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
