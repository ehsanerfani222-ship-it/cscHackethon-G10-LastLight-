import { z } from 'zod';

const SAFE_ZONE_TYPES = ['hospital', 'clinic', 'school', 'fire_station', 'pharmacy', 'police', 'shelter', 'other'] as const;

export const createSafeZoneSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(SAFE_ZONE_TYPES),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().max(500).optional().default(''),
  phone: z.string().max(50).optional().default(''),
  notes: z.string().max(1000).optional().default(''),
});

export const updateSafeZoneSchema = createSafeZoneSchema.partial();

export type CreateSafeZoneSchema = z.infer<typeof createSafeZoneSchema>;
export type UpdateSafeZoneSchema = z.infer<typeof updateSafeZoneSchema>;
