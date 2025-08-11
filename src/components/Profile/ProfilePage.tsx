import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, session } = useAuth();
  const isDemo = !session;
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const initials = useMemo(
    () => (displayName || user?.email || "U").split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase(),
    [displayName, user?.email]
  );

  useEffect(() => {
    const loadProfile = async () => {
      if (isDemo) {
        try {
          const raw = localStorage.getItem("demo_profile");
          const p = raw ? (JSON.parse(raw) as { display_name?: string; avatar_url?: string }) : null;
          setDisplayName(p?.display_name ?? "");
          setAvatarUrl(p?.avatar_url ?? "");
        } catch {}
        return;
      }
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Failed to load profile", error);
        return;
      }
      if (data) {
        setDisplayName(data.display_name ?? "");
        setAvatarUrl(data.avatar_url ?? "");
      }
    };
    loadProfile();
  }, [user?.id, isDemo]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const handleSave = async () => {
    if (isDemo) {
      try {
        const payload = { display_name: displayName || "", avatar_url: avatarUrl || "" };
        localStorage.setItem("demo_profile", JSON.stringify(payload));
        toast({ title: "נשמר", description: "פרופיל עודכן (מצב הדגמה)" });
      } catch (e: any) {
        console.error(e);
        toast({ title: "שגיאה", description: e.message || "שמירת הפרופיל נכשלה", variant: "destructive" });
      }
      return;
    }

    if (!user?.id) return;
    setSaving(true);
    try {
      let publicUrl: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        publicUrl = pub.publicUrl;
      }

      const payload: any = {
        id: user.id,
        display_name: displayName || null,
      };
      if (publicUrl) payload.avatar_url = publicUrl;
      else if (avatarUrl === "") payload.avatar_url = null;

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;

      toast({ title: "נשמר", description: "פרופיל עודכן בהצלחה" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "שגיאה", description: e.message || "שמירת הפרופיל נכשלה", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">עריכת פרופיל</h1>
        <p className="text-sm text-muted-foreground">עדכון שם ותמונת פרופיל</p>
      </header>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || undefined} alt={`Avatar of ${displayName || user?.email || "user"}`} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar">תמונת פרופיל</Label>
              <div className="flex items-center gap-2">
                <Input id="avatar" type="file" accept="image/*" onChange={onFileChange} />
                {avatarUrl && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => { setAvatarUrl(""); setFile(null); }}>
                    מחיקת תמונה
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div>
              <Label htmlFor="displayName">שם תצוגה</Label>
              <Input
                id="displayName"
                placeholder="שם מלא"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "שומר…" : "שמירה"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
