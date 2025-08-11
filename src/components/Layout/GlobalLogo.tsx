import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Trash2, Save, Edit3 } from "lucide-react";

const STORAGE_KEY = "global_logo_src";

export default function GlobalLogo({ inline = false }: { inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSrc(saved);
  }, []);

  const displaySrc = useMemo(() => src || "/placeholder.svg", [src]);

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
    if (newSrc) {
      localStorage.setItem(STORAGE_KEY, newSrc);
      setSrc(newSrc);
    }
    setOpen(false);
  };

  const handleRemove = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSrc(null);
    setFileDataUrl(null);
    setUrlInput("");
    setOpen(false);
  };

  return (
    <div className={inline ? "" : "fixed top-3 left-3 z-50"}>
      <a href="/" aria-label="דף הבית - לוגו העיר" className="group inline-flex items-center gap-2">
        <img
          src={displaySrc}
          alt="לוגו העיר - דאשבורד עירוני"
          className={inline ? "h-8 w-auto drop-shadow-sm" : "h-20 w-auto drop-shadow-sm"}
          loading="lazy"
        />
      </a>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="secondary" className={inline ? "ml-2" : "absolute -bottom-2 left-0 translate-y-full"} aria-label="עריכת לוגו">
            <Edit3 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת לוגו</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">בחר/י תמונה חדשה או הזן/י כתובת URL</span>
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
