export type CrisisType =
  | 'earthquake' | 'pandemic' | 'flood' | 'war' | 'cyber_attack'
  | 'climate' | 'volcanic' | 'tsunami' | 'famine' | 'nuclear';

export interface Crisis {
  id: string;
  type: CrisisType;
  title: string;
  location: string;
  country: string;
  lat: number;
  lng: number;
  severity: number;
  affectedPopulation: number;
  description: string;
  aiAnalysis: string;
  safetyProtocols: string[];
  scientificData: Record<string, string>;
  status: 'active' | 'monitoring' | 'resolved';
  predictionScore: number;
  predictionNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  title: string;
  probability: number;
  timeframe: string;
  type: string;
  reason: string;
  preparationAdvice: string;
  region: string;
}

export interface PipelineState {
  status: 'idle' | 'fetching' | 'analyzing' | 'storing' | 'done' | 'error';
  lastRun: string | null;
  lastRunDuration: number | null;
  crisisCount: number;
  error: string | null;
  sourcesUsed: string[];
  nextRun: string | null;
}

export interface Facility {
  id: number;
  type: 'hospital' | 'clinic' | 'school' | 'fire_station' | 'pharmacy' | 'police';
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  distanceKm?: number;
}

export type AppTab = 'globe' | 'map' | 'safezones' | 'space';

export interface SpaceEvent {
  id: string;
  planetId: string;
  type: string;
  title: string;
  severity: number;
  description: string;
  aiAnalysis: string;
  dataSource: string;
  scientificData: Record<string, string>;
  earthImpact: string;
  createdAt: string;
}
