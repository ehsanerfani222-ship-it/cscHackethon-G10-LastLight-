import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface EmergencyUser {
  id: string;
  username: string;
  avatar: string;
}

export interface EmergencyResponse {
  id: string;
  content: string;
  author: EmergencyUser;
  createdAt: string;
}

export interface EmergencyBroadcast {
  id: string;
  content: string;
  type: 'sos' | 'help_request';
  location: string;
  latitude?: number;
  longitude?: number;
  author: EmergencyUser;
  responses: EmergencyResponse[];
  createdAt: string;
}

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'emergency-broadcasts.json');

function makeUser(username: string): EmergencyUser {
  const safeUsername = username.trim() || 'Anonymous';
  return {
    id: safeUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'anonymous',
    username: safeUsername,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeUsername)}`,
  };
}

function normalizeBroadcast(value: Partial<EmergencyBroadcast>): EmergencyBroadcast {
  return {
    id: typeof value.id === 'string' ? value.id : randomUUID(),
    content: typeof value.content === 'string' ? value.content : '',
    type: value.type === 'help_request' ? 'help_request' : 'sos',
    location: typeof value.location === 'string' ? value.location : '',
    latitude: typeof value.latitude === 'number' ? value.latitude : undefined,
    longitude: typeof value.longitude === 'number' ? value.longitude : undefined,
    author: value.author?.username ? value.author : makeUser('Anonymous'),
    responses: Array.isArray(value.responses) ? value.responses : [],
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
  };
}

async function readBroadcasts(): Promise<EmergencyBroadcast[]> {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeBroadcast) : [];
  } catch {
    return [];
  }
}

async function writeBroadcasts(broadcasts: EmergencyBroadcast[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(broadcasts, null, 2), 'utf8');
}

export async function getBroadcasts(limit = 30): Promise<EmergencyBroadcast[]> {
  const broadcasts = await readBroadcasts();
  return broadcasts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export async function createBroadcast(data: {
  content: string;
  username: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}): Promise<EmergencyBroadcast> {
  const broadcasts = await readBroadcasts();
  const broadcast: EmergencyBroadcast = {
    id: randomUUID(),
    content: data.content,
    type: 'sos',
    location: data.location ?? '',
    latitude: data.latitude,
    longitude: data.longitude,
    author: makeUser(data.username),
    responses: [],
    createdAt: new Date().toISOString(),
  };
  await writeBroadcasts([broadcast, ...broadcasts].slice(0, 100));
  return broadcast;
}

export async function createBroadcastResponse(data: {
  broadcastId: string;
  content: string;
  username: string;
}): Promise<EmergencyResponse | null> {
  const broadcasts = await readBroadcasts();
  const broadcastIndex = broadcasts.findIndex((broadcast) => broadcast.id === data.broadcastId);

  if (broadcastIndex === -1) {
    return null;
  }

  const response: EmergencyResponse = {
    id: randomUUID(),
    content: data.content,
    author: makeUser(data.username),
    createdAt: new Date().toISOString(),
  };

  const currentBroadcast = broadcasts[broadcastIndex];
  broadcasts[broadcastIndex] = {
    ...currentBroadcast,
    responses: [...(currentBroadcast.responses ?? []), response].slice(-50),
  };

  await writeBroadcasts(broadcasts);
  return response;
}
