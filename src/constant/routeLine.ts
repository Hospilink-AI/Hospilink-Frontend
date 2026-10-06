import { dutyAPI } from "@/service/api";

// Route lines come from the backend (Google Directions), never from public routing servers,
// which don't allow production use. Callers fall back to a straight dashed line.

export type LatLng = [number, number];

// Google encoded polyline -> [lat, lng] points
export function decodePolyline(encoded?: string | null): LatLng[] {
  if (!encoded) return [];
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    for (const axis of [0, 1]) {
      let result = 0;
      let shift = 0;
      let b: number;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < encoded.length);
      const delta = result & 1 ? ~(result >> 1) : result >> 1;
      if (axis === 0) lat += delta;
      else lng += delta;
    }
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Hospital: GET /api/duties/duty-route-map/:dutyId (active duties) -> route.polyline
// Doctor:   POST /api/duties/:id/route with the doctor's position -> route.overviewPolyline
export async function fetchRouteLine(
  viewer: "hospital" | "staff",
  dutyId: string,
  staff?: { latitude: number; longitude: number }
): Promise<LatLng[] | null> {
  try {
    if (viewer === "hospital") {
      const res = await dutyAPI.getTrackHospitalStaffLocation(dutyId);
      const r = res?.data?.route ?? res?.route;
      const pts = decodePolyline(r?.polyline ?? r?.overviewPolyline);
      return pts.length > 1 ? pts : null;
    }
    if (!staff) return null;
    const res = await dutyAPI.getDutyRoute(dutyId, staff);
    const pts = decodePolyline(res?.route?.overviewPolyline ?? res?.data?.route?.overviewPolyline);
    return pts.length > 1 ? pts : null;
  } catch {
    return null;
  }
}

// Leaflet snippet for the map pages: the route if we have one, else a dashed straight line
export function routeScript(route: LatLng[] | null, from: LatLng, to: LatLng) {
  if (route && route.length > 1) {
    return `var rl=L.polyline(${JSON.stringify(route)},{color:'#EF4444',weight:4,opacity:0.85}).addTo(map);
      map.fitBounds(rl.getBounds(),{padding:[40,40]});`;
  }
  return `L.polyline([${JSON.stringify(from)},${JSON.stringify(to)}],{color:'#EF4444',weight:3,dashArray:'8 4'}).addTo(map);
    map.fitBounds([${JSON.stringify(from)},${JSON.stringify(to)}],{padding:[40,40]});`;
}
