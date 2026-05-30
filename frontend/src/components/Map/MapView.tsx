import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { fetchFacilities } from '../../services/api';
import { SafeZonesPanel } from '../SafeZones/SafeZonesPanel';


delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const FACILITY_ICONS: Record<string, string> = {
  hospital: '🏥', clinic: '🏥', school: '🏫',
  fire_station: '🚒', pharmacy: '💊', police: '👮',
};
const FACILITY_COLORS: Record<string, string> = {
  hospital: '#00E5FF', clinic: '#00BCD4', school: '#FFC857',
  fire_station: '#FF6B35', pharmacy: '#2EF2A3', police: '#7B61FF',
};

function createFacilityIcon(type: string) {
  return L.divIcon({
    html: `<div style="font-size:20px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.9))">${FACILITY_ICONS[type] ?? '📍'}</div>`,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

interface GeoResult {
  display: string;
  country: string;
  countryCode: string;
  city: string;
}

// Derive flag emoji from 2-letter ISO country code
function countryCodeToFlag(cc: string): string {
  if (!cc || cc.length !== 2) return '🌍';
  const upper = cc.toUpperCase();
  const cp1 = upper.charCodeAt(0) - 65 + 0x1F1E6;
  const cp2 = upper.charCodeAt(1) - 65 + 0x1F1E6;
  return String.fromCodePoint(cp1, cp2);
}

async function reverseGeocode(lat: number, lng: number): Promise<GeoResult> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json() as {
      address?: { city?: string; town?: string; country?: string; state?: string; country_code?: string };
      display_name?: string;
    };
    const addr = data.address ?? {};
    const city = addr.city ?? addr.town ?? addr.state ?? '';
    const country = addr.country ?? '';
    const countryCode = (addr.country_code ?? '').toUpperCase();
    const display = [city, country].filter(Boolean).join(', ') ||
      (data.display_name?.split(',')[0] ?? `${lat.toFixed(2)}, ${lng.toFixed(2)}`);
    return { display, country, countryCode, city };
  } catch {
    return { display: `${lat.toFixed(2)}, ${lng.toFixed(2)}`, country: '', countryCode: '', city: '' };
  }
}

function FlyToUser() {
  const map = useMap();
  const { userLocation } = useStore();
  useEffect(() => {
    if (userLocation) map.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 1.5 });
  }, [userLocation, map]);
  return null;
}

export function MapView() {
  const { facilities, setFacilities, userLocation } = useStore();
  const loadedRef = useRef(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  useEffect(() => {
    if (userLocation && !loadedRef.current) {
      loadedRef.current = true;
      fetchFacilities(userLocation.lat, userLocation.lng, 15000)
        .then(setFacilities)
        .catch(() => {});
    }
  }, [userLocation, setFacilities]);


  return (
    <div className="w-full h-full relative" style={{ background: '#050816' }}>
      <MapContainer center={[20, 0]} zoom={3} style={{ width: 'calc(100% - 420px)', height: '100%', transition: 'all 0.3s ease', background: '#0a0f1e' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        <FlyToUser />

        {/* User location */}
        {userLocation && (
          <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={8}
            pathOptions={{ color: '#00E5FF', fillColor: '#00E5FF', fillOpacity: 0.9, weight: 2 }}>
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '8px', borderRadius: '8px' }}>
                <strong>📍 Your Location</strong>
              </div>
            </Popup>
          </CircleMarker>
        )}

        {/* Facility markers */}
        {facilities.map((facility) => (
          <Marker key={facility.id} position={[facility.lat, facility.lng]} icon={createFacilityIcon(facility.type)}>
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '10px', borderRadius: '10px', minWidth: '180px' }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: FACILITY_COLORS[facility.type] }}>
                  {FACILITY_ICONS[facility.type]} {facility.name}
                </div>
                {facility.address && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{facility.address}</div>}
                {facility.phone && <div style={{ fontSize: '11px', color: '#2EF2A3', marginTop: '2px' }}>📞 {facility.phone}</div>}
                {facility.distanceKm !== undefined && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{facility.distanceKm} km away</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Safe Zones button */}
      <button
        onClick={() => setShowSafeZones((v) => !v)}
        className="absolute top-14 right-3 z-10 px-3 py-1.5 rounded-xl text-xs font-semibold"
        style={{
          background: 'rgba(0,229,255,0.2)',
          border: '1px solid rgba(0,229,255,0.5)',
          color: '#00E5FF'
        }}
      >
        🏥 Safe Zones
      </button>

      {(
      <div
        className="absolute top-0 right-0 h-full z-20"
        style={{
          width: '420px',
          background: '#050816',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
        }}
      >
        <SafeZonesPanel />
      </div>
    )}
    </div>
  );
}
