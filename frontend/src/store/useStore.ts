import { create } from 'zustand';
import type { Crisis, Facility, AppTab, PipelineState, Prediction } from '../types/crisis';
import type { SavedSafeZone } from '../modules/safeZones/types/safezone.types';

interface AppState {
  crises: Crisis[];
  selectedCrisis: Crisis | null;
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  isGenerating: boolean;
  activeTab: AppTab;
  userLocation: { lat: number; lng: number } | null;
  facilities: Facility[];
  username: string;
  notifications: { id: string; title: string; severity: number; crisisId: string }[];
  pipelineState: PipelineState;
  predictions: Prediction[];

  setCrises: (c: Crisis[]) => void;
  selectCrisis: (c: Crisis | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSelectedDate: (d: string) => void;
  setGenerating: (v: boolean) => void;
  setActiveTab: (t: AppTab) => void;
  setUserLocation: (loc: { lat: number; lng: number } | null) => void;
  setFacilities: (f: Facility[]) => void;
  setUsername: (u: string) => void;
  addNotification: (n: { id: string; title: string; severity: number; crisisId: string }) => void;
  dismissNotification: (id: string) => void;
  setPipelineState: (s: PipelineState) => void;
  setPredictions: (p: Prediction[]) => void;
  posts: unknown[];
  setPosts: (p: unknown[]) => void;
  savedZones: SavedSafeZone[];
  setSavedZones: (z: SavedSafeZone[]) => void;
}

const defaultPipeline: PipelineState = {
  status: 'idle',
  lastRun: null,
  lastRunDuration: null,
  crisisCount: 0,
  error: null,
  sourcesUsed: [],
  nextRun: null,
};

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
  username: localStorage.getItem('lastlight_username') ?? '',
  notifications: [],
  pipelineState: defaultPipeline,
  predictions: [],
  posts: [],
  savedZones: [],

  setCrises: (crises) => set({ crises }),
  selectCrisis: (selectedCrisis) => set({ selectedCrisis }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setFacilities: (facilities) => set({ facilities }),
  setUsername: (username) => {
    localStorage.setItem('lastlight_username', username);
    set({ username });
  },
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0, 10),
  })),
  dismissNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((notification) => notification.id !== id),
  })),
  setPipelineState: (pipelineState) => set({ pipelineState }),
  setPredictions: (predictions) => set({ predictions }),
  setPosts: (posts) => set({ posts }),
  setSavedZones: (savedZones) => set({ savedZones }),
}));
