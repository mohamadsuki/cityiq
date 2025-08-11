import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, Save, Edit3 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "global_logo_src";
const CITY_NAME_KEY = "global_city_name";

export default function GlobalLogo({ inline = false }: { inline?: boolean }) {
  const { role } = useAuth();
  const canEdit = role === 'mayor' || role === 'ceo';
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [cityName, setCityName] = useState<string>("שם העיר");
  const [cityInput, setCityInput] = useState<string>("");
useEffect(() => {
  let active = true;
  supabase
    .from('city_settings')
    .select('city_name, logo_url')
    .eq('id', 'global')
    .maybeSingle()
    .then(({ data }) => {
      if (!active) return;
      if (data) {
        setSrc(data.logo_url || null);
        setCityName(data.city_name || "שם העיר");
      } else {
        // Migrate from localStorage if exists
        const lsLogo = localStorage.getItem(STORAGE_KEY);
        const lsCity = localStorage.getItem(CITY_NAME_KEY);
        if (lsLogo || lsCity) {
          supabase
            .from('city_settings')
            .upsert({ id: 'global', city_name: lsCity || null, logo_url: lsLogo || null }, { onConflict: 'id' })
            .then(() => {
              setSrc(lsLogo || null);
              setCityName(lsCity || "שם העיר");
            });
        }
      }
    });
  const ch = supabase
    .channel('rt-city-settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'city_settings' }, (payload) => {
      const row: any = (payload.new as any) || (payload.old as any);
      if (row) {
        setSrc(row.logo_url || null);
        setCityName(row.city_name || "שם העיר");
      }
    })
    .subscribe();
  return () => { active = false; supabase.removeChannel(ch); };
}, []);

  useEffect(() => {
    if (open) {
      setCityInput(cityName);
    }
  }, [open, cityName]);

  const displaySrc = useMemo(() => src || "/placeholder.svg", [src]);

  const handleFile = async (file?: File | null) => {
    if (!file) { setFileDataUrl(null); setFile(null); return; }
    const toDataURL = (f: File) => new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(f);
    });
    const dataUrl = await toDataURL(file);
    setFileDataUrl(dataUrl);
    setFile(file);
  };

  const handleSave = async () => {
    if (!canEdit) return;
    const newCity = cityInput.trim() ? cityInput.trim() : cityName;
    let logoUrl: string | null = null;
    try {
      if (file) {
        const path = `logo/global-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('branding')
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from('branding').getPublicUrl(path);
        logoUrl = pub.publicUrl;
      } else if (urlInput.trim()) {
        logoUrl = urlInput.trim();
      } else {
        logoUrl = src;
      }
      const { error } = await supabase
        .from('city_settings')
        .upsert({ id: 'global', city_name: newCity, logo_url: logoUrl ?? null }, { onConflict: 'id' });
      if (error) throw error;
      setSrc(logoUrl ?? null);
      setCityName(newCity);
      setOpen(false);
    } catch (e) {
      console.error('Failed to save city settings', e);
    }
  };

  const handleRemove = async () => {
    if (!canEdit) return;
    try {
      await supabase
        .from('city_settings')
        .upsert({ id: 'global', city_name: cityName, logo_url: null }, { onConflict: 'id' });
      setSrc(null);
      setFileDataUrl(null);
      setUrlInput("");
      setOpen(false);
    } catch (e) {
      console.error('Failed to remove logo', e);
    }
  };

  return (
    <div className={inline ? "" : "fixed top-3 left-3 z-50"}>
      <a href="/" aria-label={`דף הבית - ${cityName}`} className="group inline-flex items-center gap-2">
        <img
          src={displaySrc}
          alt={`לוגו ${cityName} - דאשבורד עירוני`}
          className={inline ? "h-10 w-auto drop-shadow-sm" : "h-20 w-auto drop-shadow-sm"}
          loading="lazy"
        />
        <span className="text-xl md:text-2xl font-bold text-foreground">{cityName}</span>
      </a>
      <Dialog open={open} onOpenChange={setOpen}>
        {false && (
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className={inline ? "ml-2" : "absolute -bottom-2 left-0 translate-y-full"} aria-label="עריכת לוגו ושם העיר">
              <Edit3 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת לוגו ושם העיר</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">בחר/י תמונה חדשה או הזן/י כתובת URL</span>
            </div>
            <div>
              <label className="text-sm mb-1 block">שם העיר</label>
              <Input placeholder="שם העיר" value={cityInput} onChange={(e)=>setCityInput(e.target.value)} />
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
    </div>
  );
}
