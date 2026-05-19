// NativeMap.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { decodePolyline } from '@/utils/polylineDecoderA';

interface NativeMapProps {
  staffLocation: { latitude: number; longitude: number };
  hospitalLocation: { latitude: number; longitude: number };
  routePolylines: string[];
  status: string;
  isSatellite: boolean;
  onToggleSatellite: () => void;
}

export default function NativeMap({
  staffLocation,
  hospitalLocation,
  routePolylines,
  status,
  isSatellite,
  onToggleSatellite,
}: NativeMapProps) {
  // Decode all polylines into [lat, lng] arrays
  const decodedRoutes = routePolylines.map((p) => decodePolyline(p));
  const routeColor = status === 'in-progress' ? '#10B981' : '#2563EB';

  const centerLat = (staffLocation.latitude + hospitalLocation.latitude) / 2;
  const centerLng = (staffLocation.longitude + hospitalLocation.longitude) / 2;

  const streetTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const satelliteTile =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  const tileUrl = isSatellite ? satelliteTile : streetTile;

  // Build the full Leaflet HTML page
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${centerLat}, ${centerLng}], 12);

        let tileLayer = L.tileLayer('${tileUrl}', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Staff marker
        const staffIcon = L.divIcon({
          className: '',
          html: \`<div style="width:36px;height:36px;background:#3B82F6;border:3px solid white;
            border-radius:50%;display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">👤</div>\`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        // Hospital marker
        const hospitalIcon = L.divIcon({
          className: '',
          html: \`<div style="width:36px;height:36px;background:#EF4444;border:3px solid white;
            border-radius:50%;display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:18px;">🏥</div>\`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        L.marker([${staffLocation.latitude}, ${staffLocation.longitude}], { icon: staffIcon })
          .addTo(map).bindPopup('<b>Staff Location</b>');

        L.marker([${hospitalLocation.latitude}, ${hospitalLocation.longitude}], { icon: hospitalIcon })
          .addTo(map).bindPopup('<b>Hospital</b>');

        // Draw route polylines
        const allPoints = [];
        const routes = ${JSON.stringify(decodedRoutes)};
        routes.forEach(points => {
          if (points.length > 0) {
            L.polyline(points, {
              color: '${routeColor}',
              weight: 4,
              opacity: 0.85,
            }).addTo(map);
            allPoints.push(...points);
          }
        });

        // Fit bounds
        if (allPoints.length > 0) {
          map.fitBounds(L.latLngBounds(allPoints), { padding: [50, 50] });
        } else {
          map.fitBounds(
            L.latLngBounds([
              [${staffLocation.latitude}, ${staffLocation.longitude}],
              [${hospitalLocation.latitude}, ${hospitalLocation.longitude}]
            ]),
            { padding: [50, 50] }
          );
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        // Needed so Leaflet tiles load from external URLs
        mixedContentMode="always"
      />

      {/* Satellite toggle — sits on top of WebView */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={onToggleSatellite}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleText}>
          {isSatellite ? '🗺 Street View' : '🛰 Satellite'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggleBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 999,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#111827' },
});