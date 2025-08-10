import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface MapboxMapProps {
  accessToken?: string; // optional; if not provided, component will try localStorage key 'mapbox_token'
  height?: number | string;
}

const MapboxMap: React.FC<MapboxMapProps> = ({ accessToken, height = 360 }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const token = accessToken || localStorage.getItem("mapbox_token") || "";
    if (!mapContainer.current || !token) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [34.8516, 31.0461], // Israel approx
      zoom: 9,
      pitch: 0,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");

    return () => {
      map.current?.remove();
    };
  }, [accessToken]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border" style={{ height }}>
      {!accessToken && !localStorage.getItem("mapbox_token") && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm text-center p-6">
          <div className="space-y-2">
            <p className="text-foreground font-medium">לא הוגדר Mapbox token</p>
            <p className="text-sm text-muted-foreground">יש להזין טוקן ציבורי של Mapbox כדי להציג מפה.</p>
          </div>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default MapboxMap;
