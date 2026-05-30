export type SafeZoneType = 'hospital' | 'clinic' | 'school' | 'fire_station' | 'pharmacy' | 'police' | 'shelter' | 'other';

export interface SavedSafeZone {
  id: string;
  name: string;
  type: SafeZoneType;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
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

export interface UpdateSafeZoneInput extends Partial<CreateSafeZoneInput> {}
