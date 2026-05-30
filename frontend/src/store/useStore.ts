import { create } from 'zustand';
import type { Facility } from '../types/crisis';
import type { SavedSafeZone } from '../modules/ossma/types/safezone.types';

interface AppState {
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  isGenerating: boolean;
  userLocation: { lat: number; lng: number } | null;
  facilities: Facility[];
  savedZones: SavedSafeZone[];
  username: string;
  notifications: { id: string; title: string; severity: number; crisisId: string }[];


  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSelectedDate: (d: string) => void;
  setGenerating: (v: boolean) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setFacilities: (f: Facility[]) => void;
  setSavedZones: (z: SavedSafeZone[]) => void;
  setUsername: (u: string) => void;
  addNotification: (n: { id: string; title: string; severity: number; crisisId: string }) => void;
  dismissNotification: (id: string) => void;

}


export const useStore = create<AppState>((set) => ({
  crises: [],
  selectedCrisis: null,
  isLoading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],
  isGenerating: false,
  activeTab: 'globe',
  userLocation: null,
  facilities: [],
  savedZones: [],
  posts: [],
  username: localStorage.getItem('lastlight_username') ?? '',
  notifications: [],
  predictions: [],

  setCrises: (crises) => set({ crises }),
  selectCrisis: (selectedCrisis) => set({ selectedCrisis }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setFacilities: (facilities) => set({ facilities }),
  setSavedZones: (savedZones) => set({ savedZones }),
  setPosts: (posts) => set({ posts }),
  setUsername: (username) => { localStorage.setItem('lastlight_username', username); set({ username }); },
  addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications].slice(0, 10) })),
  dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  setPredictions: (predictions) => set({ predictions }),
}));
