// app/components/StreetViewPlayer.tsx
"use client";

import React, { useEffect, useRef } from "react";

type Loc = { lat: number; lng: number; country?: string; city?: string };

export default function StreetViewPlayer(props: {
  location?: Loc;
  onFound: (latlng: { lat: number; lng: number }) => void;
}) {
  const { location, onFound } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!location) return;

    let cancelled = false;

    // Try-to-init loop: wait for google to exist (Script might still be loading)
    const tryInit = () => {
      if (cancelled) return;
      const g = (window as any).google;
      if (!g || !containerRef.current) {
        // try again shortly
        setTimeout(tryInit, 200);
        return;
      }

      const sv = new g.maps.StreetViewService();
      const latLng = new g.maps.LatLng(location.lat, location.lng);

      sv.getPanorama({ location: latLng, radius: 50000 }, (data: any, status: string) => {
        if (cancelled) return;
        if (status === "OK" && data?.location?.latLng) {
          // create panorama inside container
          panoramaRef.current = new g.maps.StreetViewPanorama(containerRef.current, {
            position: data.location.latLng,
            pov: { heading: 34, pitch: 10 },
            zoom: 1,
          });

          // Notify parent of the real panorama location
          const p = data.location.latLng;
          onFound({ lat: p.lat(), lng: p.lng() });
        } else {
          // fallback: show a static Street View image and notify parent with requested coords
          const lat = location.lat;
          const lng = location.lng;
          const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
          if (containerRef.current) {
            containerRef.current.innerHTML = `<img src="${staticUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
          }
          onFound({ lat: location.lat, lng: location.lng });
        }
      });
    };

    tryInit();

    return () => {
      cancelled = true;
      if (panoramaRef.current) {
        try {
          panoramaRef.current.setVisible(false);
          // "@ts-expect-error"
          panoramaRef.current = null;
        } catch {
          // error
        }
      }
    };
  }, [location, onFound]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
