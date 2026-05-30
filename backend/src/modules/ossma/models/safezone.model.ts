import { db } from '../../../db';
import type { CreateSafeZoneInput, UpdateSafeZoneInput } from '../types/safezone.types';

export async function findAllSafeZones() {
  return db.safeZone.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function findSafeZoneById(id: string) {
  return db.safeZone.findUnique({ where: { id } });
}

export async function createSafeZone(data: CreateSafeZoneInput) {
  return db.safeZone.create({
    data: {
      name: data.name,
      type: data.type,
      lat: data.lat,
      lng: data.lng,
      address: data.address ?? '',
      phone: data.phone ?? '',
      notes: data.notes ?? '',
    },
  });
}

export async function updateSafeZone(id: string, data: UpdateSafeZoneInput) {
  return db.safeZone.update({ where: { id }, data });
}

export async function deleteSafeZone(id: string) {
  return db.safeZone.delete({ where: { id } });
}
