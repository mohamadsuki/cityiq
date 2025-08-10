import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface MapboxTokenFieldProps {
  className?: string;
}

export function MapboxTokenField({ className }: MapboxTokenFieldProps) {
  const [token, setToken] = useLocalStorage<string>("mapbox_token", "");
  const [temp, setTemp] = React.useState(token ?? "");

  return (
    <div className={className} dir="rtl">
      <div className="flex items-center gap-2">
        <Input
          placeholder="הדבק כאן Mapbox public token"
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          className="w-[360px]"
        />
        <Button onClick={() => setToken(temp)} variant="default">
          שמור
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">הטוקן נשמר מקומית בדפדפן (LocalStorage).</p>
    </div>
  );
}
