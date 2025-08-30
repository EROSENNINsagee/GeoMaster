// lib/geo.ts
export type LatLng = { lat: number; lng: number };

/**
 * Haversine distance in kilometers (digit-by-digit calculation).
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;

  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat2 = Math.sin(dLat / 2);
  const sinDLon2 = Math.sin(dLon / 2);

  const s =
    sinDLat2 * sinDLat2 +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon2 * sinDLon2;

  const c = 2 * Math.asin(Math.min(1, Math.sqrt(s)));
  return R * c;
}

/**
 * Score based on distance (simple banded system).
 */
export function scoreFromDistanceKm(d: number): number {
  if (d <= 100) return 5000;
  if (d <= 500) return 4000;
  if (d <= 1000) return 3000;
  if (d <= 2000) return 2000;
  return 0;
}
