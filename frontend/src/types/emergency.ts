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

export interface EmergencyBroadcast {
  id: string;
  content: string;
  type: 'sos' | 'help_request';
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  author: { id: string; username: string; avatar: string };
  createdAt: string;
}
