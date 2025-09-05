// components/StreetViewPlayer.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { europeanLocations as locations } from "@/lib/locations";

type LatLng = { lat: number; lng: number };

type Props = {
  locationIndex: number;
  onFound: (loc: LatLng) => void;
};

export default function StreetViewPlayer({ locationIndex, onFound }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const foundRef = useRef(false);

  useEffect(() => {
    const location = locations[locationIndex];
    if (!location) return;

    // Reset previous panorama
    foundRef.current = false;
    let cancelled = false;
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    const tryStreetView = () => {
      if (!window.google || !window.google.maps) return;

      const svc = new google.maps.StreetViewService();

      // Smaller radius first, then fallback to larger if needed
      const searchRadius = [500, 5000, 50000];

      const tryRadius = (i: number) => {
        if (i >= searchRadius.length) {
          // Total failure → static fallback
          const img = new Image();
          img.src = `https://maps.googleapis.com/maps/api/streetview?size=1200x800&location=${location.lat},${location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";

          img.onload = () => {
            if (!foundRef.current && !cancelled) {
              const container = containerRef.current!;
              if (!container) return;
              container.innerHTML = "";
              container.appendChild(img);
              foundRef.current = true;
              // Fallback still reports raw location
              onFound(location);
            }
          };
          return;
        }

        svc.getPanorama({ location, radius: searchRadius[i] }, (data, status) => {
          if (cancelled || foundRef.current) return;
          const container = containerRef.current!;
          if (!container) return;

          if (status === "OK" && data?.location?.latLng) {
            container.innerHTML = "";
            new google.maps.StreetViewPanorama(container, {
              position: data.location.latLng,
              pov: { heading: 100, pitch: 0 },
              visible: true,
            });

            if (!foundRef.current) {
              foundRef.current = true;
              // ✅ Use actual panorama coords, not raw location
              onFound(data.location.latLng.toJSON());
            }
          } else {
            // Try next radius
            tryRadius(i + 1);
          }
        });
      };

      tryRadius(0);
    };

    tryStreetView();

    return () => {
      cancelled = true;
    };
  }, [locationIndex, onFound]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", background: "#000" }}
    />
  );
}
