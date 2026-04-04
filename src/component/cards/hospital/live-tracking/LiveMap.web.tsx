import React from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { DoctorWithDistance, Hospital, RangeKm } from '../../../../types/duty';
import { useMap } from 'react-leaflet'; // this

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const hospitalIcon = L.divIcon({
  className: '',
  html: `<div style="background:#E53935;border-radius:50% 50% 50% 0;
    width:38px;height:38px;transform:rotate(-45deg);
    border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:17px;line-height:1;">🏥</span>
  </div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
});

const makeDoctorIcon = (available: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${available ? '#43A047' : '#FB8C00'};
      border-radius:50% 50% 50% 0;width:30px;height:30px;transform:rotate(-45deg);
      border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:14px;line-height:1;">👨‍⚕️</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });

interface LiveMapProps {
  hospital: Hospital;
  doctors: DoctorWithDistance[];
  rangeKm: RangeKm;
   onRefresh: () => void;   // this
}

// ── Refresh Control — sits below +/- zoom buttons ──
interface RefreshControlProps {
  onRefresh: () => void;
}

const RefreshControl: React.FC<RefreshControlProps> = ({ onRefresh }) => {
  const map = useMap();

  useEffect(() => {
    const control = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: () => {
        const btn = L.DomUtil.create('button', '');
        btn.innerHTML = '🔄';
        btn.title = 'Refresh';
        btn.style.cssText = `
          width: 30px;
          height: 30px;
          background: white;
          border: 2px solid rgba(0,0,0,0.2);
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.15);
        `;

        // Prevent map zoom/drag when clicking button
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, 'click', () => {
          btn.style.transform = 'rotate(360deg)';
          btn.style.transition = 'transform 0.5s ease';
          setTimeout(() => {
            btn.style.transform = '';
            btn.style.transition = '';
          }, 500);
          onRefresh();
        });

        return btn;
      },
    });

    const instance = new control();
    instance.addTo(map);

    return () => {
      instance.remove();
    };
  }, [map, onRefresh]);

  return null;
};

const LiveMap: React.FC<LiveMapProps> = ({ hospital, doctors, rangeKm, onRefresh }) => {
  const center: [number, number] = [
    hospital.location.latitude,
    hospital.location.longitude,
  ];

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%', zIndex: 0 }}
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
       <RefreshControl onRefresh={onRefresh} />
      <Circle
        center={center}
        radius={rangeKm * 1000}
        pathOptions={{
          color: '#1565C0',
          fillColor: '#42A5F5',
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '6 4',
        }}
      />
      <Marker position={center} icon={hospitalIcon}>
        <Popup>
          <strong style={{ color: '#C62828' }}>{hospital.name}</strong>
          <br />
          <small>{hospital.location.address}</small>
        </Popup>
      </Marker>
      {doctors.map((doc) => (
        <Marker
          key={doc.id}
          position={[doc.location.latitude, doc.location.longitude]}
          icon={makeDoctorIcon(doc.available)}
        >
          <Popup>
            <strong>{doc.name}</strong><br />
            {doc.specialty}<br />
            <span style={{ color: doc.available ? '#2E7D32' : '#E65100', fontWeight: 'bold' }}>
              {doc.available ? '✅ Available now' : '🟠 Currently busy'}
            </span><br />
            📍 {doc.distanceKm.toFixed(1)} km away<br />
            📞 {doc.phone}<br />
            <small style={{ color: '#777' }}>{doc.location.address}</small>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default LiveMap;