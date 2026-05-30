import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import type { Crisis } from '../../types/crisis';
import type { NewsItem } from '../../types/news';
import { fetchFacilities, fetchNews } from '../../services/api';
import { NewsPanel } from '../News/NewsPanel';

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

function severityColor(s: number): string {
  if (s >= 8) return '#FF3B5C';
  if (s >= 6) return '#FF8C00';
  if (s >= 4) return '#FFC857';
  return '#2EF2A3';
}

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

interface ClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}
function MapClickHandler({ onMapClick }: ClickHandlerProps) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

interface Props { onSelectCrisis: (c: Crisis) => void; }

interface NewsContext {
  flag: string;
  countryName: string;
  city: string;
  countryCode: string;
  nearbyCrisis: Crisis | null;
}

export function MapView({ onSelectCrisis }: Props) {
  const { crises, facilities, setFacilities, userLocation } = useStore();
  const loadedRef = useRef(false);
  const [heatmapOn, setHeatmapOn] = useState(false);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLocation, setNewsLocation] = useState('');
  const [newsContext, setNewsContext] = useState<NewsContext | null>(null);
  const [showNews, setShowNews] = useState(false);

  useEffect(() => {
    if (userLocation && !loadedRef.current) {
      loadedRef.current = true;
      fetchFacilities(userLocation.lat, userLocation.lng, 15000)
        .then(setFacilities)
        .catch(() => {});
    }
  }, [userLocation, setFacilities]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setShowNews(true);
    setNewsLoading(true);
    setNews([]);

    // Check if click is near a crisis (within 3 degrees)
    const nearby = crises.find((c) => {
      const dlat = c.lat - lat;
      const dlng = c.lng - lng;
      return Math.sqrt(dlat * dlat + dlng * dlng) < 3;
    });

    // Always reverse geocode to get country info
    const geo = await reverseGeocode(lat, lng);
    const flag = countryCodeToFlag(geo.countryCode);

    const ctx: NewsContext = {
      flag,
      countryName: geo.country,
      city: geo.city,
      countryCode: geo.countryCode,
      nearbyCrisis: nearby ?? null,
    };
    setNewsContext(ctx);

    let location: string;
    let country: string;
    let type: string;
    let countryCode: string;

    if (nearby) {
      location = geo.city || nearby.location;
      country = geo.country || nearby.country;
      type = nearby.type;
      countryCode = geo.countryCode;
      setNewsLocation(`${flag} ${geo.country || nearby.country} — ${nearby.title}`);
    } else {
      location = geo.city;
      country = geo.country;
      type = '';
      countryCode = geo.countryCode;
      setNewsLocation(`${flag} ${geo.display}`);
    }

    try {
      const data = await fetchNews({ location, country, type, countryCode });
      setNews(data);
    } catch {
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, [crises]);

  return (
    <div className="w-full h-full relative" style={{ background: '#050816' }}>
      <MapContainer center={[20, 0]} zoom={3} style={{ width: '100%', height: '100%', background: '#0a0f1e' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />
        <FlyToUser />
        <MapClickHandler onMapClick={handleMapClick} />

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

        {/* Heatmap circles behind markers */}
        {heatmapOn && crises.map((crisis) => (
          [60, 90, 130, 180, 240].map((r, i) => (
            <CircleMarker key={`heat-${crisis.id}-${i}`}
              center={[crisis.lat, crisis.lng]}
              radius={r * (crisis.severity / 10)}
              pathOptions={{
                color: 'transparent',
                fillColor: severityColor(crisis.severity),
                fillOpacity: 0.03 - i * 0.004,
                weight: 0,
              }}
            />
          ))
        ))}

        {/* Crisis markers */}
        {crises.map((crisis) => (
          <CircleMarker key={crisis.id} center={[crisis.lat, crisis.lng]}
            radius={6 + crisis.severity}
            pathOptions={{ color: severityColor(crisis.severity), fillColor: severityColor(crisis.severity), fillOpacity: 0.8, weight: 2 }}
            eventHandlers={{ click: (e) => { L.DomEvent.stopPropagation(e); onSelectCrisis(crisis); } }}>
            <Popup>
              <div style={{ background: '#0a0f1e', color: '#e2e8f0', padding: '10px', borderRadius: '10px', minWidth: '200px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{crisis.title}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{crisis.location}</div>
                <div style={{ marginTop: '6px', fontSize: '11px' }}>
                  <span style={{ color: severityColor(crisis.severity), fontWeight: 600 }}>Severity {crisis.severity.toFixed(1)}/10</span>
                  {' · '}
                  <span style={{ color: '#94a3b8' }}>{crisis.affectedPopulation.toLocaleString()} affected</span>
                </div>
                <button onClick={() => onSelectCrisis(crisis)}
                  style={{ marginTop: '8px', width: '100%', padding: '4px', background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '6px', color: '#00E5FF', fontSize: '11px', cursor: 'pointer' }}>
                  View Full Analysis →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}

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

      {/* Heatmap toggle */}
      <button
        onClick={() => setHeatmapOn((v) => !v)}
        className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          background: heatmapOn ? 'rgba(255,59,92,0.2)' : 'rgba(255,255,255,0.07)',
          border: heatmapOn ? '1px solid rgba(255,59,92,0.5)' : '1px solid rgba(255,255,255,0.12)',
          color: heatmapOn ? '#FF3B5C' : '#94a3b8',
        }}
      >
        🔥 Heatmap {heatmapOn ? 'ON' : 'OFF'}
      </button>

      {/* Click hint */}
      {!showNews && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="glass rounded-full px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2">
            <span>🗺️</span> Click anywhere on the map for latest news
          </div>
        </div>
      )}

      {/* News panel */}
      {showNews && (
        <NewsPanel
          news={news}
          isLoading={newsLoading}
          locationLabel={newsLocation}
          newsContext={newsContext}
          onClose={() => setShowNews(false)}
        />
      )}
    </div>
  );
}
