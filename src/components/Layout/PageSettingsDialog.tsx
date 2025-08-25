import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const [totalBusinesses, setTotalBusinesses] = useState<number | null>(null);
  const [totalBusinessesInput, setTotalBusinessesInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await supabase
          .from('city_settings')
          .select('city_name, logo_url, population, total_businesses_in_city')
          .eq('id', 'global')
          .maybeSingle();

        if (data) {
          setSrc(data.logo_url || null);
          setCityName(data.city_name || "שם העיר");
          setPopulation(data.population || 342857);
          setTotalBusinesses(data.total_businesses_in_city || null);
        }
      } catch (error) {
        console.error('Error loading city settings:', error);
      }
    };

    loadData();

    // Listen for real-time updates
    const channel = supabase
      .channel('city-settings-updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'city_settings',
        filter: 'id=eq.global'
      }, (payload) => {
        const row: any = payload.new || payload.old;
        if (row) {
          setSrc(row.logo_url || null);
          setCityName(row.city_name || "שם העיר");
          setPopulation(row.population || 342857);
          setTotalBusinesses(row.total_businesses_in_city || null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update form inputs when dialog opens or data changes
  useEffect(() => {
    if (open) {
      setCityInput(cityName);
      setPopulationInput(population.toString());
      setTotalBusinessesInput(totalBusinesses?.toString() || "");
      setUrlInput("");
      setFileDataUrl(null);
      setFile(null);
    }
  }, [open, cityName, population, totalBusinesses]);

  const displaySrc = useMemo(() => 
    fileDataUrl || urlInput.trim() || src || "/placeholder.svg", 
    [fileDataUrl, urlInput, src]
  );

  const handleFile = async (f?: File | null) => {
    if (!f) { 
      setFileDataUrl(null); 
      setFile(null); 
      return; 
    }
    
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      
      setFileDataUrl(dataUrl);
      setFile(f);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  const handleSave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    const newCity = cityInput.trim() || cityName;
    const newPopulation = populationInput.trim() ? parseInt(populationInput.trim()) || population : population;
    const newTotalBusinesses = totalBusinessesInput.trim() ? parseInt(totalBusinessesInput.trim()) || null : totalBusinesses;
    let logoUrl: string | null = null;

    try {
      // Handle file upload
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `global-${Date.now()}.${fileExt}`;
        const filePath = `logo/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('branding')
          .upload(filePath, file, { 
            cacheControl: '3600',
            upsert: true 
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error('שגיאה בהעלאת הקובץ');
        }

        const { data: { publicUrl } } = supabase.storage
          .from('branding')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
      } else if (urlInput.trim()) {
        logoUrl = urlInput.trim();
      } else {
        logoUrl = src;
      }

      // Try upsert first, then insert if needed
      let { data, error } = await supabase
        .from('city_settings')
        .upsert({ 
          id: 'global', 
          city_name: newCity, 
          logo_url: logoUrl,
          population: newPopulation,
          total_businesses_in_city: newTotalBusinesses
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Upsert error:', error);
        // If upsert fails, try direct update
        const { error: updateError } = await supabase
          .from('city_settings')
          .update({ 
            city_name: newCity, 
            logo_url: logoUrl,
            population: newPopulation,
            total_businesses_in_city: newTotalBusinesses
          })
          .eq('id', 'global');
        
        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error('שגיאה בעדכון הנתונים');
        }
      }

      // Update local state
      setSrc(logoUrl);
      setCityName(newCity);
      setPopulation(newPopulation);
      setTotalBusinesses(newTotalBusinesses);
      
      // Reset form
      setFileDataUrl(null);
      setFile(null);
      setUrlInput("");
      
      // Close dialog
      onOpenChange(false);
      
    } catch (error) {
      console.error('Failed to save city settings:', error);
      const message = error instanceof Error ? error.message : 'שגיאה בשמירת הנתונים. אנא נסה שוב.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('city_settings')
        .upsert({ 
          id: 'global', 
          city_name: cityName, 
          logo_url: null,
          population: population,
          total_businesses_in_city: totalBusinesses
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      setSrc(null);
      setFileDataUrl(null);
      setUrlInput("");
      onOpenChange(false);
      
    } catch (error) {
      console.error('Failed to remove logo:', error);
      alert('שגיאה במחיקת הלוגו. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
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
            <Input 
              placeholder="שם העיר" 
              value={cityInput} 
              onChange={(e) => setCityInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="text-sm mb-1 block">אוכלוסיית העיר</label>
            <Input 
              type="number" 
              placeholder="אוכלוסיית העיר" 
              value={populationInput} 
              onChange={(e) => setPopulationInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="text-sm mb-1 block">סה"כ עסקים בעיר</label>
            <Input 
              type="number" 
              placeholder="מספר כלל העסקים בעיר" 
              value={totalBusinessesInput} 
              onChange={(e) => setTotalBusinessesInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="text-sm mb-1 block">תצוגה מקדימה</label>
            <div className="flex items-center gap-3">
              <img src={displaySrc} alt="תצוגה מקדימה - לוגו" className="h-12 w-auto" />
              <span className="text-sm text-muted-foreground">
                שם: {cityInput || cityName}
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm mb-1 block">העלאת קובץ</label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={(e) => handleFile(e.target.files?.[0])}
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="text-sm mb-1 block">כתובת תמונה (URL)</label>
            <Input 
              placeholder="https://example.com/logo.png" 
              value={urlInput} 
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleSave} 
              className="inline-flex items-center gap-2"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" /> 
              {isLoading ? "שומר..." : "שמירה"}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemove} 
              className="inline-flex items-center gap-2"
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4" /> מחיקה
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
