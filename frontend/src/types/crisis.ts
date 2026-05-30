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

export interface Post {
  id: string;
  content: string;
  type: string;
  author: { id: string; username: string; avatar: string };
  crisisId?: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  comments: Comment[];
  reactions: Reaction[];
  _count: { comments: number; reactions: number };
}

export interface Comment {
  id: string;
  content: string;
  author: { id?: string; username: string; avatar: string };
  createdAt: string;
  updatedAt?: string;
}

export interface Reaction {
  id: string;
  type: string;
  userId: string;
  user?: { username: string };
}

export interface ChatMessage {
  id: string;
  content: string;
  roomId: string;
  senderId: string;
  sender: { id: string; username: string; avatar: string };
  createdAt: string;
  updatedAt?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  crisisId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  _count: { messages: number };
}

export type AppTab = 'globe' | 'map' | 'community' | 'chat' | 'doctor' | 'safezones' | 'space';

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
