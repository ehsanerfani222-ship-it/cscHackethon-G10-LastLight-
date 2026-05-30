import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface EmergencyUser {
  id: string;
  username: string;
  avatar: string;
}

export interface EmergencyBroadcast {
  id: string;
  content: string;
  type: 'sos' | 'help_request';
  location: string;
  latitude?: number;
  longitude?: number;
  author: EmergencyUser;
  createdAt: string;
}

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'emergency-broadcasts.json');

async function readBroadcasts(): Promise<EmergencyBroadcast[]> {
  try {
    const raw = await readFile(dataFile, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeBroadcasts(broadcasts: EmergencyBroadcast[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(broadcasts, null, 2), 'utf8');
}

function makeUser(username: string): EmergencyUser {
  const safeUsername = username.trim() || 'Anonymous';
  return {
    id: safeUsername.toLowerCase().replace(/[^a-z0-9_-]/g, '-') || 'anonymous',
    username: safeUsername,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(safeUsername)}`,
  };
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
    createdAt: new Date().toISOString(),
  };
  await writeBroadcasts([broadcast, ...broadcasts].slice(0, 100));
  return broadcast;
}
