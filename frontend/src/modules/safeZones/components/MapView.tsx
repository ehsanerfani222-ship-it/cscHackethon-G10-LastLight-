import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../../store/useStore';
import { fetchNearbyFacilities } from '../apis/safezones.api';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FACILITY_ICONS: Record<string, string> = {
  hospital: '🏥', clinic: '🏥', school: '🏫',
  fire_station: '🚒', pharmacy: '💊', police: '👮',
  shelter: '🏠', other: '📍',
};

const FACILITY_COLORS: Record<string, string> = {
  hospital: '#00E5FF', clinic: '#00BCD4', school: '#FFC857',
  fire_station: '#FF6B35', pharmacy: '#2EF2A3', police: '#7B61FF',
  shelter: '#A78BFA', other: '#94a3b8',
};

function createFacilityIcon(type: string) {
  return L.divIcon({
    html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9))">${FACILITY_ICONS[type] ?? '📍'}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function FlyToUser() {
  const map = useMap();
  const { userLocation } = useStore();
  useEffect(() => {
    if (userLocation) map.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 1.5 });
  }, [userLocation, map]);
  return null;
}

const SAVED_ZONE_ICON = L.divIcon({
  html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 2px 8px rgba(0,229,255,0.8))">⭐</div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function MapView() {
  const { facilities, setFacilities, userLocation, savedZones } = useStore();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (userLocation && !loadedRef.current) {
      loadedRef.current = true;
      fetchNearbyFacilities(userLocation.lat, userLocation.lng, 15000)
        .then(setFacilities)
        .catch(() => {});
    }
  }, [userLocation, setFacilities]);

  return (
    <div className="w-full h-full relative" style={{ background: '#050816' }}>
      <MapContainer
        center={[20, 0]}
        zoom={3}
        style={{ width: '100%', height: '100%', background: '#0a0f1e' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        <FlyToUser />

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={8}
            pathOptions={{ color: '#00E5FF', fillColor: '#00E5FF', fillOpacity: 0.9, weight: 2 }}
          >
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '8px', borderRadius: '8px' }}>
                <strong>📍 Your Location</strong>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {userLocation && savedZones.map((zone) => (
          <Marker
            key={`saved-${zone.id}`}
            position={[zone.lat, zone.lng]}
            icon={SAVED_ZONE_ICON}
          >
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '10px', borderRadius: '10px', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#00E5FF' }}>
                  ⭐ {zone.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {FACILITY_ICONS[zone.type] ?? '📍'} {zone.type.replace('_', ' ')}
                </div>
                {zone.address && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{zone.address}</div>
                )}
                {zone.phone && (
                  <div style={{ fontSize: '11px', color: '#2EF2A3', marginTop: '2px' }}>📞 {zone.phone}</div>
                )}
                {zone.notes && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>{zone.notes}</div>
                )}
                <div style={{ fontSize: '10px', color: '#334155', marginTop: '6px' }}>My saved zone</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {facilities.map((facility) => (
          <Marker
            key={facility.id}
            position={[facility.lat, facility.lng]}
            icon={createFacilityIcon(facility.type)}
          >
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '10px', borderRadius: '10px', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: FACILITY_COLORS[facility.type] }}>
                  {FACILITY_ICONS[facility.type]} {facility.name}
                </div>
                {facility.address && (
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{facility.address}</div>
                )}
                {facility.phone && (
                  <div style={{ fontSize: '11px', color: '#2EF2A3', marginTop: '2px' }}>📞 {facility.phone}</div>
                )}
                {facility.distanceKm !== undefined && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{facility.distanceKm} km away</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
