export type SafeZoneType = 'hospital' | 'clinic' | 'school' | 'fire_station' | 'pharmacy' | 'police' | 'shelter' | 'other';

export interface SafeZone {
  id: string;
  name: string;
  type: SafeZoneType;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSafeZoneInput {
  name: string;
  type: SafeZoneType;
  lat: number;
  lng: number;
  address?: string;
  phone?: string;
  notes?: string;
}

export interface UpdateSafeZoneInput {
  name?: string;
  type?: SafeZoneType;
  lat?: number;
  lng?: number;
  address?: string;
  phone?: string;
  notes?: string;
}
