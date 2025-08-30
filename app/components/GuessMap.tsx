"use client";

import { useEffect, useRef } from "react";

type LatLng = { lat: number; lng: number };

type Props = {
  actual: LatLng | null;
  guess: LatLng | null;
  setGuess: (g: LatLng) => void;
  revealed: boolean;
  round: number;
};

export default function GuessMap({ actual, guess, setGuess, revealed, round }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null); // <- fix here
  const guessMarker = useRef<google.maps.Marker | null>(null);
  const actualMarker = useRef<google.maps.Marker | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const listenerAdded = useRef(false);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: { lat: 0, lng: 0 },
        zoom: 2,
      });
    }

    if (!listenerAdded.current && mapInstance.current) {
      mapInstance.current.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng || revealed) return;

        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setGuess(pos);

        if (guessMarker.current) {
          guessMarker.current.setPosition(pos);
        } else {
          guessMarker.current = new google.maps.Marker({
            position: pos,
            map: mapInstance.current!,
            icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          });
        }
      });
      listenerAdded.current = true;
    }

    if (!revealed && mapInstance.current) {
      guessMarker.current?.setMap(mapInstance.current);
      actualMarker.current?.setMap(null);
      lineRef.current?.setMap(null);

      mapInstance.current.setCenter({ lat: 0, lng: 0 });
      mapInstance.current.setZoom(2);
    }

    if (revealed && actual && guess && mapInstance.current) {
      if (actualMarker.current) {
        actualMarker.current.setPosition(actual);
        actualMarker.current.setMap(mapInstance.current);
      } else {
        actualMarker.current = new google.maps.Marker({
          position: actual,
          map: mapInstance.current,
          icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
        });
      }

      if (lineRef.current) {
        lineRef.current.setPath([guess, actual]);
        lineRef.current.setMap(mapInstance.current);
      } else {
        lineRef.current = new google.maps.Polyline({
          path: [guess, actual],
          geodesic: true,
          strokeColor: "#FF0000",
          strokeOpacity: 1.0,
          strokeWeight: 2,
          map: mapInstance.current,
        });
      }

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(actual.lat, actual.lng));
      bounds.extend(new google.maps.LatLng(guess.lat, guess.lng));
      mapInstance.current.fitBounds(bounds);
    }
  }, [actual, guess, revealed, round, setGuess]);

  return <div ref={mapRef} style={{ width: "100%", height: "100%" }} />;
}
