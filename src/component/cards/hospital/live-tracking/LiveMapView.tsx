/**
 * LiveMapView.tsx
 * Works on Web (Leaflet via CDN div) and Android/iOS (WebView + Leaflet HTML).
 * ✅ Satellite button REMOVED — MapScreen owns all overlay controls.
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const NativeWebView: any =
  Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

const STREET_URL    = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export interface DoctorPin {
  id: string;
  name: string;
  specialty: string;
  available: boolean;
  distanceKm: number;
  phone: string;
  email: string;
  location: { latitude: number; longitude: number; address: string };
}

export interface HospitalPin {
  name: string;
  location: { latitude: number; longitude: number; address: string };
}

interface LiveMapViewProps {
  hospital: HospitalPin;
  doctors: DoctorPin[];
  rangeKm: number;
  isSatellite: boolean;
  onToggleSatellite: () => void;
  onRefresh?: () => void;
}

function buildLeafletHTML(
  hospital: HospitalPin,
  doctors: DoctorPin[],
  rangeKm: number,
  isSatellite: boolean,
): string {
  const tileUrl     = isSatellite ? SATELLITE_URL : STREET_URL;
  const esc         = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');
  const doctorsJson = JSON.stringify(doctors);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100vh;overflow:hidden}
  </style>
</head>
<body>
<div id="map"></div>
<script>
  var STREET='${STREET_URL}', SAT='${SATELLITE_URL}';
  var map=L.map('map',{zoomControl:true}).setView([${hospital.location.latitude},${hospital.location.longitude}],13);
  var tileLayer=L.tileLayer('${tileUrl}',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);

  function sendToNative(d){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(d)); }

  function handleIncoming(e){
    try{
      var m=JSON.parse(e.data);
      if(m.type==='toggleSatellite'){
        map.removeLayer(tileLayer);
        tileLayer=L.tileLayer(m.sat?SAT:STREET,{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);
        tileLayer.bringToBack();
      }
    }catch(_){}
  }
  document.addEventListener('message',handleIncoming);
  window.addEventListener('message',handleIncoming);

  var RefreshBtn=L.Control.extend({
    options:{position:'topleft'},
    onAdd:function(){
      var b=L.DomUtil.create('button');
      b.innerHTML='🔄'; b.title='Refresh';
      b.style.cssText='width:30px;height:30px;background:#fff;border:2px solid rgba(0,0,0,.2);border-radius:4px;cursor:pointer;font-size:14px;margin-top:4px;box-shadow:0 1px 5px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;';
      L.DomEvent.disableClickPropagation(b);
      L.DomEvent.on(b,'click',function(){
        b.style.transition='transform .5s'; b.style.transform='rotate(360deg)';
        setTimeout(function(){ b.style.transform=''; b.style.transition=''; },500);
        sendToNative({type:'refresh'});
      });
      return b;
    }
  });
  new RefreshBtn().addTo(map);

  var hIcon=L.divIcon({
    className:'',
    html:'<div style="background:#E53935;border-radius:50% 50% 50% 0;width:38px;height:38px;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>',
    iconSize:[38,38],iconAnchor:[19,38],popupAnchor:[0,-40],
  });
  L.marker([${hospital.location.latitude},${hospital.location.longitude}],{icon:hIcon})
   .addTo(map)
   .bindPopup('<strong style="color:#C62828">${esc(hospital.name)}</strong><br><small>${esc(hospital.location.address)}</small>');

  L.circle([${hospital.location.latitude},${hospital.location.longitude}],{
    radius:${rangeKm*1000},color:'#1565C0',fillColor:'#42A5F5',fillOpacity:.08,weight:2,dashArray:'6 4'
  }).addTo(map);

  var doctors=${doctorsJson};
  doctors.forEach(function(doc){
    var color=doc.available?'#43A047':'#FB8C00';
    var dIcon=L.divIcon({
      className:'',
      html:'<div style="background:'+color+';border-radius:50% 50% 50% 0;width:30px;height:30px;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">👨\u200d⚕️</span></div>',
      iconSize:[30,30],iconAnchor:[15,30],popupAnchor:[0,-32],
    });
    L.marker([doc.location.latitude,doc.location.longitude],{icon:dIcon})
     .addTo(map)
     .bindPopup(
       '<strong>'+doc.name+'</strong><br>'+doc.specialty+'<br>'+
       '<span style="color:'+(doc.available?'#2E7D32':'#E65100')+';font-weight:bold">'+(doc.available?'✅ Available now':'🟠 Currently busy')+'</span><br>'+
       '📍 '+doc.distanceKm.toFixed(1)+' km away<br>📞 '+doc.phone+'<br>📧 '+doc.email+'<br>'+
       '<small style="color:#777">'+doc.location.address+'</small>'
     );
  });
</script>
</body>
</html>`;
}

const LiveMapView: React.FC<LiveMapViewProps> = ({
  hospital, doctors, rangeKm, isSatellite, onToggleSatellite, onRefresh,
}) => {
  const webViewRef     = useRef<any>(null);
  const mapDivRef      = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef   = useRef<any>(null);

  // Native: inject JS to toggle satellite (no reload)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    webViewRef.current?.injectJavaScript(
      `handleIncoming({data:JSON.stringify({type:'toggleSatellite',sat:${isSatellite}})});true;`
    );
  }, [isSatellite]);

  const handleWebViewMessage = useCallback((e: any) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.type === 'refresh') onRefresh?.();
    } catch (_) {}
  }, [onRefresh]);

  // Web: init Leaflet
  useEffect(() => {
    if (Platform.OS !== 'web' || !mapDivRef.current) return;

    const initMap = () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
      const L   = (window as any).L;
      const map = L.map(mapDivRef.current).setView(
        [hospital.location.latitude, hospital.location.longitude], 13,
      );
      mapInstanceRef.current = map;
      tileLayerRef.current   = L.tileLayer(
        isSatellite ? SATELLITE_URL : STREET_URL,
        { attribution: '© OpenStreetMap contributors', maxZoom: 19 },
      ).addTo(map);

      const RefBtn = L.Control.extend({
        options: { position: 'topleft' },
        onAdd() {
          const b = L.DomUtil.create('button');
          b.innerHTML = '🔄'; b.title = 'Refresh';
          b.style.cssText = 'width:30px;height:30px;background:#fff;border:2px solid rgba(0,0,0,.2);border-radius:4px;cursor:pointer;font-size:14px;margin-top:4px;box-shadow:0 1px 5px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;';
          L.DomEvent.disableClickPropagation(b);
          L.DomEvent.on(b, 'click', () => {
            b.style.transition = 'transform .5s'; b.style.transform = 'rotate(360deg)';
            setTimeout(() => { b.style.transform = ''; b.style.transition = ''; }, 500);
            onRefresh?.();
          });
          return b;
        },
      });
      new RefBtn().addTo(map);

      const hIcon = L.divIcon({
        className: '',
        html: `<div style="background:#E53935;border-radius:50% 50% 50% 0;width:38px;height:38px;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span></div>`,
        iconSize: [38, 38], iconAnchor: [19, 38], popupAnchor: [0, -40],
      });
      L.marker([hospital.location.latitude, hospital.location.longitude], { icon: hIcon })
        .addTo(map)
        .bindPopup(`<strong style="color:#C62828">${hospital.name}</strong><br><small>${hospital.location.address}</small>`);

      L.circle([hospital.location.latitude, hospital.location.longitude], {
        radius: rangeKm * 1000, color: '#1565C0', fillColor: '#42A5F5',
        fillOpacity: 0.08, weight: 2, dashArray: '6 4',
      }).addTo(map);

      doctors.forEach(doc => {
        const color = doc.available ? '#43A047' : '#FB8C00';
        const dIcon = L.divIcon({
          className: '',
          html: `<div style="background:${color};border-radius:50% 50% 50% 0;width:30px;height:30px;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;line-height:1;">👨‍⚕️</span></div>`,
          iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -32],
        });
        L.marker([doc.location.latitude, doc.location.longitude], { icon: dIcon })
          .addTo(map)
          .bindPopup(
            `<strong>${doc.name}</strong><br>${doc.specialty}<br>` +
            `<span style="color:${doc.available ? '#2E7D32' : '#E65100'};font-weight:bold">${doc.available ? '✅ Available now' : '🟠 Currently busy'}</span><br>` +
            `📍 ${doc.distanceKm.toFixed(1)} km away<br>📞 ${doc.phone}<br>📧 ${doc.email}<br>` +
            `<small style="color:#777">${doc.location.address}</small>`,
          );
      });
    };

    if (!(window as any).L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [hospital, doctors, rangeKm]);

  // Web: smooth satellite toggle
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const L   = (window as any).L;
    const map = mapInstanceRef.current;
    if (!map || !L) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(
      isSatellite ? SATELLITE_URL : STREET_URL,
      { attribution: '© OpenStreetMap contributors', maxZoom: 19 },
    ).addTo(map);
    tileLayerRef.current.bringToBack();
  }, [isSatellite]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        React.createElement('div', { ref: mapDivRef, style: { width: '100%', height: '100%' } })
      ) : (
        NativeWebView && (
          <NativeWebView
            ref={webViewRef}
            source={{ html: buildLeafletHTML(hospital, doctors, rangeKm, false) }}
            style={{ flex: 1 }}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            mixedContentMode="always"
            onMessage={handleWebViewMessage}
          />
        )
      )}
    </View>
  );
};

export default LiveMapView;

const styles = StyleSheet.create({
  container: { flex: 1 },
});