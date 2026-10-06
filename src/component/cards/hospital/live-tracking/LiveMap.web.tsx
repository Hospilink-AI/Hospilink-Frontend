import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { DoctorWithDistance, Hospital, RangeKm } from '../../../../types/duty';

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STREET_TILE = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
};

const SATELLITE_TILE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution: '© Esri, Maxar, Earthstar Geographics',
};

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

// Doctors at the same rounded point share one marker with a count
const makeGroupIcon = (count: number, available: boolean, picked = false) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${picked ? '#2563EB' : available ? '#43A047' : '#FB8C00'};
      border-radius:50%;width:34px;height:34px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px;">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

// Exact positions stay one marker each; rounded (approximate) ones group by their shared point
function groupDoctors(doctors: DoctorWithDistance[]): DoctorWithDistance[][] {
  const groups = new Map<string, DoctorWithDistance[]>();
  for (const d of doctors) {
    const key = d.approximate ? `${d.location.latitude.toFixed(5)},${d.location.longitude.toFixed(5)}` : `id:${d.id}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return [...groups.values()];
}

const makeDoctorIcon = (available: boolean, picked = false) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${picked ? '#2563EB' : available ? '#43A047' : '#FB8C00'};
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
   isSatellite: boolean;  
   onToggleSatellite: () => void;
  // picking doctors to invite (duty invites)
  invite?: {
    pickedIds: string[];
    onTogglePick: (doctorId: string) => void;
    favourites: Record<string, boolean>;
    onToggleFavourite: (doctorId: string) => void;
    availability: Record<string, string | undefined>;
    dateLabel?: string;
  };
  // extra controls in a doctor's pop-up (Block / Report)
  renderDoctorActions?: (doctor: DoctorWithDistance) => React.ReactNode;
}

const AVAILABILITY_TEXT: Record<string, { text: string; color: string }> = {
  free: { text: 'Free that day', color: '#047857' },
  busy: { text: 'Marked busy that day', color: '#475569' },
};

const popupButton = (on: boolean): React.CSSProperties => ({
  marginTop: 8,
  marginRight: 6,
  padding: '6px 10px',
  borderRadius: 6,
  border: `1px solid ${on ? '#2563EB' : '#CBD5E1'}`,
  background: on ? '#2563EB' : '#fff',
  color: on ? '#fff' : '#1E293B',
  fontWeight: 600,
  fontSize: 12,
  cursor: 'pointer',
});

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



const LiveMap: React.FC<LiveMapProps> = ({ hospital, doctors, rangeKm, onRefresh, isSatellite, onToggleSatellite, invite, renderDoctorActions }) => {

    console.log({
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    Circle,
  });

  
  const center: [number, number] = [
    hospital.location.latitude,
    hospital.location.longitude,
  ];

  const tile = isSatellite ? SATELLITE_TILE : STREET_TILE;

  return (
     <div style={{ position: 'relative', width: '100%', height: '100%' }}>
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%', zIndex: 0 }}
      zoomControl
    >
      {/* <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      /> */}
      <TileLayer url={tile.url} attribution={tile.attribution} />
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
      {groupDoctors(doctors).map((g) => {
        const first = g[0];
        const pos: [number, number] = [first.location.latitude, first.location.longitude];
        const anyFree = g.some((d) => d.available);
        const anyPicked = g.some((d) => !!invite?.pickedIds.includes(d.id));
        return (
          <React.Fragment key={g.map((d) => d.id).join('|')}>
            {first.approximate && (
              // rounded position: a soft area, not a pin on the doctor's door
              <Circle
                center={pos}
                radius={(first.precisionKm ?? 1) * 1000}
                pathOptions={{ color: anyFree ? '#43A047' : '#FB8C00', weight: 2, fillOpacity: 0.2, dashArray: '4 4' }}
              />
            )}
            <Marker position={pos} icon={g.length > 1 ? makeGroupIcon(g.length, anyFree, anyPicked) : makeDoctorIcon(first.available, anyPicked)}>
              <Popup>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {g.length > 1 && <strong>{g.length} doctors in this area</strong>}
                  {g.map((doc, i) => (
                    <div key={doc.id} style={i > 0 || g.length > 1 ? { borderTop: '1px solid #eee', marginTop: 6, paddingTop: 6 } : undefined}>
            <strong>{doc.name}</strong><br />
            {doc.specialty}<br />
            <span style={{ color: doc.available ? '#2E7D32' : '#E65100', fontWeight: 'bold' }}>
              {doc.available ? '✅ Available now' : '🟠 Currently busy'}
            </span><br />
            📍 {doc.distanceKm.toFixed(1)} km away<br />
            {doc.contactHidden ? (
              <span style={{ color: '#64748B' }}>Contact shared once a duty is assigned</span>
            ) : (
              <>
                {!!doc.phone && <>📞 {doc.phone}<br /></>}
                {!!doc.email && <>📧 {doc.email}</>}
              </>
            )}
            <br />
            <small style={{ color: '#777' }}>
              {doc.location.address}
              {doc.approximate ? ` · approximate area (±${doc.precisionKm ?? 1} km)` : ''}
            </small>
            {renderDoctorActions && <div style={{ marginTop: 6 }}>{renderDoctorActions(doc)}</div>}
            {invite && (
              <div>
                {AVAILABILITY_TEXT[invite.availability[doc.id] ?? ''] && (
                  <div style={{ marginTop: 6, fontWeight: 600, color: AVAILABILITY_TEXT[invite.availability[doc.id]!].color }}>
                    {AVAILABILITY_TEXT[invite.availability[doc.id]!].text}
                    {invite.dateLabel ? ` (${invite.dateLabel})` : ''}
                  </div>
                )}
                <button
                  type="button"
                  aria-label={invite.pickedIds.includes(doc.id) ? `Remove ${doc.name} from invite` : `Invite ${doc.name}`}
                  style={popupButton(invite.pickedIds.includes(doc.id))}
                  onClick={() => invite.onTogglePick(doc.id)}
                >
                  {invite.pickedIds.includes(doc.id) ? '✓ Picked to invite' : '+ Invite to a duty'}
                </button>
                <button
                  type="button"
                  aria-label={invite.favourites[doc.id] ? 'Remove from favourites' : 'Add to favourites'}
                  style={popupButton(false)}
                  onClick={() => invite.onToggleFavourite(doc.id)}
                >
                  {invite.favourites[doc.id] ? '♥ Favourite' : '♡ Favourite'}
                </button>
              </div>
            )}
          
                    </div>
                  ))}
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
    {/* Satellite Toggle Button */}
    <button
      onClick={onToggleSatellite}
      style={{
        position: 'absolute',
        top: 58,
        // left: 12,          // left side so it doesn't clash with RangeDropdown on right
        right:9,
        zIndex: 1000,
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 8,
        padding: '9px 12px',
        fontSize: 11,
        fontWeight: 600,
        color: '#111827',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {isSatellite ? '🗺 Street' : '🛰 Satellite'}
    </button>
    </div>
    
  );
};

export default LiveMap;