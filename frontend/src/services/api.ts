import axios from 'axios';
import type { Facility } from '../types/crisis';

const api = axios.create({ baseURL: '/api' });


export const fetchFacilities = async (lat: number, lng: number, radius = 10000): Promise<Facility[]> => {
  const { data } = await api.get('/facilities/nearby', { params: { lat, lng, radius } });
  return data;
};

export const getApiKeyStatus = async (): Promise<{ hasApiKey: boolean; isValid: boolean }> => {
  const { data } = await api.get('/settings/status');
  return data;
};

export const saveApiKey = async (apiKey: string) => {
  const { data } = await api.post('/settings/apikey', { apiKey });
  return data;
};