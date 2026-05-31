import { create } from 'zustand';
import type { EmergencyBroadcast, EmergencyResponse, Facility } from '../types/emergency';

interface EmergencyState {
  username: string;
  facilities: Facility[];
  broadcasts: EmergencyBroadcast[];
  setUsername: (username: string) => void;
  setFacilities: (facilities: Facility[]) => void;
  setBroadcasts: (broadcasts: EmergencyBroadcast[]) => void;
  addBroadcast: (broadcast: EmergencyBroadcast) => void;
  addResponseToBroadcast: (broadcastId: string, response: EmergencyResponse) => void;
}

export const useEmergencyStore = create<EmergencyState>((set) => ({
  username: localStorage.getItem('lastlight_emergency_username') ?? '',
  facilities: [],
  broadcasts: [],
  setUsername: (username) => {
    localStorage.setItem('lastlight_emergency_username', username);
    set({ username });
  },
  setFacilities: (facilities) => set({ facilities }),
  setBroadcasts: (broadcasts) => set({ broadcasts }),
  addBroadcast: (broadcast) => set((state) => ({ broadcasts: [broadcast, ...state.broadcasts] })),
  addResponseToBroadcast: (broadcastId, response) => set((state) => ({
    broadcasts: state.broadcasts.map((broadcast) => (
      broadcast.id === broadcastId
        ? { ...broadcast, responses: [...(broadcast.responses ?? []), response] }
        : broadcast
    )),
  })),
}));
