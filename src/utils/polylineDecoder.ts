import polyline from '@mapbox/polyline';
import { LatLng } from "react-native-maps";

// Type declaration for @mapbox/polyline
declare module '@mapbox/polyline' {
  export function decode(encoded: string, precision?: number): [number, number][];
  export function encode(coordinates: [number, number][], precision?: number): string;
}

/** Decode a Google-encoded polyline into LatLng array */
export function decodePolyline(encoded: string): LatLng[] {
  if (!encoded || typeof encoded !== 'string') {
    return [];
  }
  try {
    const decoded = polyline.decode(encoded);
    return decoded.map(([lat, lng]: [number, number]) => ({
      latitude: lat,
      longitude: lng,
    }));
  } catch (error) {
    console.error("Polyline decode error:", error);
    return [];
  }
}

/** Haversine distance in metres */
export function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinA =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA));
}

/** Bearing between two coords (degrees) */
export function calcBearing(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLon = toRad(end.longitude - start.longitude);
  const x = Math.sin(dLon) * Math.cos(toRad(end.latitude));
  const y =
    Math.cos(toRad(start.latitude)) * Math.sin(toRad(end.latitude)) -
    Math.sin(toRad(start.latitude)) *
      Math.cos(toRad(end.latitude)) *
      Math.cos(dLon);
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}