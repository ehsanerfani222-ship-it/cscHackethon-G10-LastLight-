import axios from 'axios';
import type { EmergencyBroadcast, EmergencyResponse } from '../types/emergency';

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

export const createEmergencyResponse = async (
  broadcastId: string,
  payload: { content: string; username: string },
): Promise<EmergencyResponse> => {
  const { data } = await api.post(`/emergency/broadcasts/${broadcastId}/responses`, payload);
  return data;
};
