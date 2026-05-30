import type { Request, Response } from 'express';
import { createSafeZoneSchema, updateSafeZoneSchema } from '../schemas/safezone.schema';
import {
  findAllSafeZones,
  findSafeZoneById,
  createSafeZone,
  updateSafeZone,
  deleteSafeZone,
} from '../models/safezone.model';

export async function list(req: Request, res: Response) {
  const zones = await findAllSafeZones();
  res.json(zones);
}

export async function getById(req: Request, res: Response) {
  const zone = await findSafeZoneById(req.params.id);
  if (!zone) return res.status(404).json({ error: 'Safe zone not found' });
  res.json(zone);
}

export async function create(req: Request, res: Response) {
  const parsed = createSafeZoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const zone = await createSafeZone(parsed.data);
  res.status(201).json(zone);
}

export async function update(req: Request, res: Response) {
  const existing = await findSafeZoneById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Safe zone not found' });

  const parsed = updateSafeZoneSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const zone = await updateSafeZone(req.params.id, parsed.data);
  res.json(zone);
}

export async function remove(req: Request, res: Response) {
  const existing = await findSafeZoneById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Safe zone not found' });
  await deleteSafeZone(req.params.id);
  res.status(204).send();
}
