import axios from 'axios';
import type { EmergencyBroadcast } from '../types/emergency';

const api = axios.create({ baseURL: '/api' });

export const fetchEmergencyBroadcasts = async (): Promise<EmergencyBroadcast[]> => {
  const { data } = await api.get('/emergency/broadcasts');
  return data;
};

export const createEmergencyBroadcast = async (payload: {
  content: string;
  username: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}): Promise<EmergencyBroadcast> => {
  const { data } = await api.post('/emergency/broadcasts', payload);
  return data;
};
