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

export async function getNearbyFacilities(lat: number, lng: number, radiusMeters = 10000): Promise<Facility[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"~"hospital|clinic|school|fire_station|pharmacy|police"](around:${radiusMeters},${lat},${lng});
      way["amenity"~"hospital|clinic|school|fire_station|pharmacy|police"](around:${radiusMeters},${lat},${lng});
    );
    out center tags;
  `;

  const response = await axios.post(
    'https://overpass-api.de/api/interpreter',
    `data=${encodeURIComponent(query)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
  );

  const elements: Array<{
    id: number;
    type: string;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }> = response.data.elements ?? [];

  return elements
    .filter((el) => {
      const lat = el.lat ?? el.center?.lat;
      const lon = el.lon ?? el.center?.lon;
      return lat !== undefined && lon !== undefined;
    })
    .map((el) => {
      const elLat = (el.lat ?? el.center?.lat)!;
      const elLng = (el.lon ?? el.center?.lon)!;
      const amenity = el.tags?.amenity ?? '';
      const facilityType = AMENITY_TYPE_MAP[amenity] ?? 'clinic';
      const distKm = haversineKm(lat, lng, elLat, elLng);

      return {
        id: el.id,
        type: facilityType,
        name: el.tags?.name ?? el.tags?.['name:en'] ?? amenityLabel(amenity),
        lat: elLat,
        lng: elLng,
        address: [el.tags?.['addr:street'], el.tags?.['addr:city']].filter(Boolean).join(', '),
        phone: el.tags?.phone ?? el.tags?.['contact:phone'],
        distanceKm: Math.round(distKm * 10) / 10,
      };
    })
    .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
    .slice(0, 50);
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
