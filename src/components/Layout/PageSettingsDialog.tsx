import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "global_logo_src";
const CITY_NAME_KEY = "global_city_name";

interface PageSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PageSettingsDialog({ open, onOpenChange }: PageSettingsDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [cityName, setCityName] = useState<string>("שם העיר");
  const [cityInput, setCityInput] = useState<string>("");
  const [population, setPopulation] = useState<number>(342857);
  const [populationInput, setPopulationInput] = useState<string>("");

  useEffect(() => {
    let active = true;
    supabase
      .from('city_settings')
      .select('city_name, logo_url, population')
      .eq('id', 'global')
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          setSrc(data.logo_url || null);
          setCityName(data.city_name || "שם העיר");
          setPopulation(data.population || 342857);
        }
      });
    const ch = supabase
      .channel('rt-city-settings-dialog')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'city_settings' }, (payload) => {
        const row: any = (payload.new as any) || (payload.old as any);
        if (row) {
          setSrc(row.logo_url || null);
          setCityName(row.city_name || "שם העיר");
          setPopulation(row.population || 342857);
        }
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (open) {
      setCityInput(cityName);
      setPopulationInput(population.toString());
    }
  }, [open, cityName, population]);

  const displaySrc = useMemo(() => fileDataUrl || urlInput.trim() || src || "/placeholder.svg", [fileDataUrl, urlInput, src]);

  const handleFile = async (f?: File | null) => {
    if (!f) { setFileDataUrl(null); setFile(null); return; }
    const toDataURL = (file: File) => new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    const dataUrl = await toDataURL(f);
    setFileDataUrl(dataUrl);
    setFile(f);
  };

  const handleSave = async () => {
    const newCity = cityInput.trim() ? cityInput.trim() : cityName;
    const newPopulation = populationInput.trim() ? parseInt(populationInput.trim()) : population;
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
        .upsert({ 
          id: 'global', 
          city_name: newCity, 
          logo_url: logoUrl ?? null,
          population: newPopulation 
        }, { onConflict: 'id' });
      if (error) throw error;

      setSrc(logoUrl ?? null);
      setCityName(newCity);
      setPopulation(newPopulation);
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to save city settings', e);
    }
  };

  const handleRemove = async () => {
    try {
      await supabase
        .from('city_settings')
        .upsert({ id: 'global', city_name: cityName, logo_url: null }, { onConflict: 'id' });
      setSrc(null);
      setFileDataUrl(null);
      setUrlInput("");
      onOpenChange(false);
    } catch (e) {
      console.error('Failed to remove logo', e);
    }
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
            <label className="text-sm mb-1 block">אוכלוסיית העיר</label>
            <Input 
              type="number" 
              placeholder="אוכלוסיית העיר" 
              value={populationInput} 
              onChange={(e)=>setPopulationInput(e.target.value)} 
            />
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
