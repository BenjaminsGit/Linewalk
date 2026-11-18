/** Map viewport per launch city. The demo projects lat/lng onto a stylised SVG "world" of 1000×1000 units. */
export interface Bounds { north: number; south: number; west: number; east: number }

export const WORLD = 1000;

export const CITY_BOUNDS: Record<string, Bounds> = {
  // Roughly square in kilometres (longitude degrees shrink by cos(latitude)).
  Johannesburg: { north: -25.83, south: -26.25, west: 27.73, east: 28.2 },
  'Cape Town': { north: -33.86, south: -34.0, west: 18.36, east: 18.53 },
};

export const CITY_CENTER: Record<string, { lat: number; lng: number }> = {
  Johannesburg: { lat: -26.15, lng: 28.02 },
  'Cape Town': { lat: -33.93, lng: 18.43 },
};

export function project(lat: number, lng: number, b: Bounds, w = WORLD, h = WORLD) {
  return {
    x: ((lng - b.west) / (b.east - b.west)) * w,
    y: ((b.north - lat) / (b.north - b.south)) * h,
  };
}

export function unproject(x: number, y: number, b: Bounds, w = WORLD, h = WORLD) {
  return {
    lng: b.west + (x / w) * (b.east - b.west),
    lat: b.north - (y / h) * (b.north - b.south),
  };
}

/** Haversine distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
