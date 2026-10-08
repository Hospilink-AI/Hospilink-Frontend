import { palette } from '@/ds/tokens';

// Leaflet look shared by the doctor's map screen and the route previews.

export const LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet';
export const TILE_STANDARD = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_SATELLITE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const ATTR_STANDARD = '© OpenStreetMap contributors';
export const ATTR_SATELLITE = '© Esri, Maxar, Earthstar Geographics';

export type LatLng = [number, number];

export const htmlEsc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export const HOSPITAL_PIN =
  `<div class="hl-pin"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M3 21h18"/><path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"/><path d="M10 9h4"/><path d="M12 7v4"/></svg></div>`;

export const ME_DOT = '<div class="hl-me"></div>';

export const MAP_CSS = `
  .hl-pin{width:44px;height:44px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${palette.navy};border:3px solid #fff;
    display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(14,30,58,.28)}
  .hl-pin svg{transform:rotate(45deg)}
  .hl-me{width:22px;height:22px;border-radius:50%;background:${palette.ceil};border:3px solid #fff;box-shadow:0 0 0 0 rgba(91,133,215,.45),0 4px 10px rgba(14,30,58,.2);animation:hl-pulse 2.4s ease-out infinite}
  @keyframes hl-pulse{0%{box-shadow:0 0 0 0 rgba(91,133,215,.45),0 4px 10px rgba(14,30,58,.2)}80%{box-shadow:0 0 0 16px rgba(91,133,215,0),0 4px 10px rgba(14,30,58,.2)}100%{box-shadow:0 0 0 0 rgba(91,133,215,0),0 4px 10px rgba(14,30,58,.2)}}
  @media (prefers-reduced-motion: reduce){.hl-me{animation:none}}
  .leaflet-container{background:${palette.ward};font-family:Manrope_500Medium,Manrope,system-ui,sans-serif}
  .leaflet-control-attribution{background:rgba(255,255,255,.78)!important;border-radius:8px 0 0 0;font-size:10px;color:#414D64}
  .leaflet-control-attribution a{color:${palette.ceilDeep}}
  .leaflet-popup-content-wrapper{border-radius:16px;box-shadow:0 12px 32px rgba(14,30,58,.14)}
  .leaflet-popup-content{margin:12px 14px;font:500 13px/18px Manrope_500Medium,Manrope,system-ui,sans-serif;color:${palette.navy}}
  .leaflet-popup-content b{font-family:Manrope_700Bold,Manrope,system-ui,sans-serif;font-weight:700}
`;

export const ROUTE_STYLE = { color: palette.ceilDeep, weight: 6, opacity: 0.95, lineCap: 'round', lineJoin: 'round' };
// No route from the server: a straight dashed line, so it never looks like real directions.
export const STRAIGHT_STYLE = { color: palette.ceilDeep, weight: 3, opacity: 0.8, dashArray: '8 8' };

/** A still map for cards: the hospital, the doctor, and the route (or a straight dashed line). */
export function previewHTML(hospital: LatLng, me: LatLng | null, route: LatLng[] | null): string {
  const draw = me
    ? route && route.length > 1
      ? `map.fitBounds(L.polyline(${JSON.stringify(route)}, ${JSON.stringify(ROUTE_STYLE)}).addTo(map).getBounds(), { padding: [36, 36] });`
      : `map.fitBounds(L.polyline([${JSON.stringify(me)}, ${JSON.stringify(hospital)}], ${JSON.stringify(STRAIGHT_STYLE)}).addTo(map).getBounds(), { padding: [44, 44] });`
    : `map.setView(${JSON.stringify(hospital)}, 14);`;
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}.css"/><script src="${LEAFLET}.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100vh;overflow:hidden}${MAP_CSS}</style>
</head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, boxZoom: false, keyboard: false });
  map.attributionControl.setPrefix(false);
  L.tileLayer('${TILE_STANDARD}', { attribution: '${ATTR_STANDARD}', maxZoom: 19 }).addTo(map);
  ${draw}
  L.marker(${JSON.stringify(hospital)}, { icon: L.divIcon({ className: '', html: '${HOSPITAL_PIN}', iconSize: [44, 44], iconAnchor: [22, 44] }), interactive: false }).addTo(map);
  ${me ? `L.marker(${JSON.stringify(me)}, { icon: L.divIcon({ className: '', html: '${ME_DOT}', iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false }).addTo(map);` : ''}
</script></body></html>`;
}

/** An interactive map for following someone: hospital pin, their position, and the route (or a dashed line). */
export function trackHTML(hospital: LatLng, person: LatLng | null, route: LatLng[] | null, bottomPad = 0): string {
  const pts = [hospital, ...(person ? [person] : [])];
  const line = person
    ? route && route.length > 1
      ? `L.polyline(${JSON.stringify(route)}, ${JSON.stringify(ROUTE_STYLE)}).addTo(map);`
      : `L.polyline([${JSON.stringify(person)}, ${JSON.stringify(hospital)}], ${JSON.stringify(STRAIGHT_STYLE)}).addTo(map);`
    : '';
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}.css"/><script src="${LEAFLET}.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100vh;overflow:hidden}${MAP_CSS}.leaflet-bottom{bottom:${bottomPad}px}</style>
</head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false });
  map.attributionControl.setPrefix(false);
  L.tileLayer('${TILE_STANDARD}', { attribution: '${ATTR_STANDARD}', maxZoom: 19 }).addTo(map);
  ${line}
  L.marker(${JSON.stringify(hospital)}, { icon: L.divIcon({ className: '', html: '${HOSPITAL_PIN}', iconSize: [44, 44], iconAnchor: [22, 44] }) }).addTo(map);
  ${person ? `L.marker(${JSON.stringify(person)}, { icon: L.divIcon({ className: '', html: '${ME_DOT}', iconSize: [22, 22], iconAnchor: [11, 11] }), zIndexOffset: 1000 }).addTo(map);` : ''}
  ${pts.length > 1 ? `map.fitBounds(${JSON.stringify(pts)}, { padding: [60, 60], paddingBottomRight: [60, ${bottomPad + 40}] });` : `map.setView(${JSON.stringify(hospital)}, 15);`}
</script></body></html>`;
}

/** Staff around the hospital: a pin for the hospital, the search ring, and a dot per person (free ones in green). */
export function staffMapHTML(hospital: LatLng, people: { at: LatLng; free: boolean }[], radiusKm: number): string {
  const dots = people
    .map((p) => `L.circleMarker(${JSON.stringify(p.at)}, { radius: 7, weight: 3, color: '#fff', fillOpacity: 1, fillColor: '${p.free ? '#13804A' : palette.ceilDeep}' }).addTo(map);`)
    .join(' ');
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${LEAFLET}.css"/><script src="${LEAFLET}.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100vh;overflow:hidden}${MAP_CSS}</style>
</head><body><div id="map"></div><script>
  var map = L.map('map', { zoomControl: false });
  map.attributionControl.setPrefix(false);
  L.tileLayer('${TILE_STANDARD}', { attribution: '${ATTR_STANDARD}', maxZoom: 19 }).addTo(map);
  var ring = L.circle(${JSON.stringify(hospital)}, { radius: ${radiusKm * 1000}, color: '${palette.ceilDeep}', weight: 2, dashArray: '6 6', fillColor: '${palette.ceil}', fillOpacity: 0.06 }).addTo(map);
  ${dots}
  L.marker(${JSON.stringify(hospital)}, { icon: L.divIcon({ className: '', html: '${HOSPITAL_PIN}', iconSize: [44, 44], iconAnchor: [22, 44] }), zIndexOffset: 1000 }).addTo(map);
  map.fitBounds(ring.getBounds(), { padding: [16, 16] });
</script></body></html>`;
}
