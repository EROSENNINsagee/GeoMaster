"use client";

import React, { useRef } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";

function getRandomLocation() {
  const lat = Math.random() * 180 - 90; // -90 to 90
  const lng = Math.random() * 360 - 180; // -180 to 180
  return { lat, lng };
}

export default function Map() {
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = (map: google.maps.Map) => {
    mapRef.current = map;
    const streetViewService = new google.maps.StreetViewService();
    const randomLocation = getRandomLocation();

    streetViewService.getPanorama(
      { location: randomLocation, radius: 50000 },
      (data, status) => {
        const container = document.getElementById("street-view") as HTMLElement;

        if (status === "OK" && data?.location?.latLng) {
          // ✅ Interactive Street View
          const panorama = new google.maps.StreetViewPanorama(container, {
            position: data.location.latLng,
            pov: { heading: 34, pitch: 10 },
            zoom: 1,
          });
          map.setStreetView(panorama);
          map.setCenter(data.location.latLng);
        } else {
          // ⚠️ Fallback to static image
          const lat = randomLocation.lat;
          const lng = randomLocation.lng;
          const staticUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
          container.innerHTML = `<img src="${staticUrl}" style="width:100%;height:100%;object-fit:cover;" />`;
        }
      }
    );
  };

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div style={{ display: "flex", width: "100%", height: "100vh" }}>
        <GoogleMap
          mapContainerStyle={{ flex: 1 }}
          center={{ lat: 0, lng: 0 }}
          zoom={2}
          onLoad={onLoad}
        />
        <div id="street-view" style={{ flex: 2, height: "100%" }}></div>
      </div>
    </LoadScript>
  );
}
