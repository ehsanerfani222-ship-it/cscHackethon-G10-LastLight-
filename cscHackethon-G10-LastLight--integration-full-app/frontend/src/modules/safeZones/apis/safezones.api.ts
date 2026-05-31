import axios from 'axios';
import type { SavedSafeZone, CreateSafeZoneInput, UpdateSafeZoneInput } from '../types/safezone.types';

const api = axios.create({ baseURL: '/api' });

export async function fetchSavedSafeZones(): Promise<SavedSafeZone[]> {
  const { data } = await api.get('/safezones');
  return data;
}

export async function fetchSavedSafeZoneById(id: string): Promise<SavedSafeZone> {
  const { data } = await api.get(`/safezones/${id}`);
  return data;
}

export async function createSavedSafeZone(input: CreateSafeZoneInput): Promise<SavedSafeZone> {
  const { data } = await api.post('/safezones', input);
  return data;
}

export async function updateSavedSafeZone(id: string, input: UpdateSafeZoneInput): Promise<SavedSafeZone> {
  const { data } = await api.put(`/safezones/${id}`, input);
  return data;
}

export async function deleteSavedSafeZone(id: string): Promise<void> {
  await api.delete(`/safezones/${id}`);
}

export async function fetchNearbyFacilities(lat: number, lng: number, radius = 15000) {
  const { data } = await api.get('/facilities/nearby', { params: { lat, lng, radius } });
  return data;
}
