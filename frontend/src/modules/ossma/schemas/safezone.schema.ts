export const SAFE_ZONE_TYPES = ['hospital', 'clinic', 'school', 'fire_station', 'pharmacy', 'police', 'shelter', 'other'] as const;

export function validateCreateSafeZone(data: unknown): string | null {
  if (!data || typeof data !== 'object') return 'Invalid data';
  const d = data as Record<string, unknown>;
  if (!d.name || typeof d.name !== 'string' || d.name.trim() === '') return 'Name is required';
  if (!SAFE_ZONE_TYPES.includes(d.type as never)) return 'Invalid type';
  if (typeof d.lat !== 'number' || d.lat < -90 || d.lat > 90) return 'Invalid latitude';
  if (typeof d.lng !== 'number' || d.lng < -180 || d.lng > 180) return 'Invalid longitude';
  return null;
}
