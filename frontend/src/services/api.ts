import axios from 'axios';
import type { Crisis, Facility, Post } from '../types/crisis';

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

export const fetchPosts = async (crisisId?: string): Promise<Post[]> => {
  const { data } = await api.get('/community', { params: crisisId ? { crisisId } : {} });
  return data;
};

export const createPost = async (payload: {
  content: string; type: string; username: string; crisisId?: string; location?: string; imageUrl?: string;
}): Promise<Post> => {
  const { data } = await api.post('/community', payload);
  return data;
};

export const updatePost = async (postId: string, payload: {
  content?: string; type?: string; location?: string; imageUrl?: string;
}): Promise<Post> => {
  const { data } = await api.patch(`/community/${postId}`, payload);
  return data;
};

export const deletePost = async (postId: string): Promise<{ deleted: boolean }> => {
  const { data } = await api.delete(`/community/${postId}`);
  return data;
};

export const addComment = async (postId: string, content: string, username: string) => {
  const { data } = await api.post(`/community/${postId}/comments`, { content, username });
  return data;
};

export const updateComment = async (commentId: string, content: string) => {
  const { data } = await api.patch(`/community/comments/${commentId}`, { content });
  return data;
};

export const deleteComment = async (commentId: string): Promise<{ deleted: boolean }> => {
  const { data } = await api.delete(`/community/comments/${commentId}`);
  return data;
};

export const toggleReaction = async (postId: string, username: string, type: string) => {
  const { data } = await api.post(`/community/${postId}/reactions`, { username, type });
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

export const consultAIDoctor = async (payload: {
  category: string; symptom: string; bodyArea: string;
  severity: number; age: number; additionalInfo?: string;
}) => {
  const { data } = await api.post('/doctor/consult', payload);
  return data;
};
