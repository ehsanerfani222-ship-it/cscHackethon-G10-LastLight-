import axios from 'axios';
import type { Crisis, Facility } from '../types/crisis';

const api = axios.create({ baseURL: '/api' });

export const fetchCrises = async (date?: string): Promise<Crisis[]> => {
  const { data } = await api.get('/crises', { params: date ? { date } : {} });
  return data;
};

export const fetchCrisis = async (id: string): Promise<Crisis> => {
  const { data } = await api.get(`/crises/${id}`);
  return data;
};

export const generateCrises = async (): Promise<{ message: string; count: number }> => {
  const { data } = await api.post('/crises/generate');
  return data;
};

export const fetchFacilities = async (lat: number, lng: number, radius = 10000): Promise<Facility[]> => {
  const { data } = await api.get('/facilities/nearby', { params: { lat, lng, radius } });
  return data;
};

export const fetchNews = async (params: {
  location?: string; country?: string; type?: string; countryCode?: string;
}) => {
  const { data } = await api.get('/news', { params });
  return data;
};

export const fetchBriefing = async (payload: {
  lat?: number; lng?: number; crisisIds: string[]; predictionIds: string[];
}): Promise<{ text: string }> => {
  const { data } = await api.post('/briefing', payload);
  return data;
};

export const seedData = async () => {
  const { data } = await api.post('/seed');
  return data;
};

export const fetchSpaceEvents = async (planet?: string) => {
  const { data } = await api.get('/space/events', { params: planet ? { planet } : {} });
  return data;
};

export const generateSpaceEvents = async () => {
  const { data } = await api.post('/space/generate');
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
