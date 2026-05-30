import axios from 'axios';

export interface Facility {
  id: number;
  type: 'hospital' | 'clinic' | 'school' | 'fire_station' | 'pharmacy' | 'police';
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  distanceKm?: number;
}

const AMENITY_TYPE_MAP: Record<string, Facility['type']> = {
  hospital: 'hospital',
  clinic: 'clinic',
  school: 'school',
  fire_station: 'fire_station',
  pharmacy: 'pharmacy',
  police: 'police',
};

const AMENITY_TYPES = Object.keys(AMENITY_TYPE_MAP);

// In-memory cache keyed by rounded coords + radius (5 min TTL)
const cache = new Map<string, { data: Facility[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  type?: string;
  address?: {
    amenity?: string;
    road?: string;
    city?: string;
    town?: string;
    phone?: string;
  };
  extratags?: { phone?: string; 'contact:phone'?: string };
}

async function fetchAmenityFromNominatim(
  amenity: string,
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<Facility[]> {
  // Build a bounding box from the radius (rough approximation)
  const degOffset = (radiusMeters / 111320);
  const viewbox = `${lng - degOffset},${lat - degOffset},${lng + degOffset},${lat + degOffset}`;

  const { data } = await axios.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', {
    params: {
      format: 'json',
      amenity,
      limit: 30,
      bounded: 1,
      viewbox,
      addressdetails: 1,
      extratags: 1,
    },
    headers: { 'User-Agent': 'LastLight-HackathonApp/1.0' },
    timeout: 15000,
  });

  return data.map((item) => {
    const elLat = parseFloat(item.lat);
    const elLng = parseFloat(item.lon);
    return {
      id: item.place_id,
      type: AMENITY_TYPE_MAP[amenity] ?? 'clinic',
      name: item.name ?? item.address?.amenity ?? amenityLabel(amenity),
      lat: elLat,
      lng: elLng,
      address: [item.address?.road, item.address?.city ?? item.address?.town]
        .filter(Boolean).join(', '),
      phone: item.extratags?.phone ?? item.extratags?.['contact:phone'] ?? item.address?.phone,
      distanceKm: Math.round(haversineKm(lat, lng, elLat, elLng) * 10) / 10,
    };
  });
}

export async function getNearbyFacilities(lat: number, lng: number, radiusMeters = 10000): Promise<Facility[]> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusMeters}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const results: Facility[] = [];

  // Fetch each amenity type sequentially with a small delay (Nominatim rate limit: 1 req/s)
  for (const amenity of AMENITY_TYPES) {
    try {
      const facilities = await fetchAmenityFromNominatim(amenity, lat, lng, radiusMeters);
      results.push(...facilities);
    } catch {
      // Skip this amenity type if it fails
    }
    await sleep(1100); // Respect Nominatim's 1 req/s policy
  }

  const result = results
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, 60);

  cache.set(cacheKey, { data: result, ts: Date.now() });
  return result;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function amenityLabel(a: string): string {
  const labels: Record<string, string> = {
    hospital: 'Hospital', clinic: 'Clinic', school: 'School',
    fire_station: 'Fire Station', pharmacy: 'Pharmacy', police: 'Police Station',
  };
  return labels[a] ?? 'Facility';
}
