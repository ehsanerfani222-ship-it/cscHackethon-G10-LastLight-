const TYPE_WEIGHTS: Record<string, number> = {
  nuclear: 2.0, pandemic: 1.8, tsunami: 1.7, war: 1.5,
  earthquake: 1.3, volcanic: 1.2, flood: 1.1, cyber_attack: 1.2,
  climate: 1.0, famine: 1.3, solar_storm: 1.1,
};

interface CrisisInput { severity: number; type: string; status: string; affectedPopulation: number; }

export interface ThreatIndexResult {
  score: number;         // 0–100
  label: string;         // MINIMAL / ELEVATED / HIGH / CRITICAL / CATASTROPHIC
  color: string;
  activeCrises: number;
  criticalCount: number;
  totalAffected: number;
  topContributor: string;
  trend: 'rising' | 'stable' | 'falling';
  trendDelta: number;
}

export function calculateThreatIndex(crises: CrisisInput[]): ThreatIndexResult {
  const active = crises.filter((c) => c.status !== 'resolved');
  if (active.length === 0) return zeroIndex();

  let weightedSum = 0;
  let maxContrib = 0;
  let topContributor = '';

  for (const c of active) {
    const w = TYPE_WEIGHTS[c.type] ?? 1.0;
    const populationBonus = Math.log10(Math.max(1, c.affectedPopulation)) / 10;
    const contrib = c.severity * w * (1 + populationBonus * 0.2);
    weightedSum += contrib;
    if (contrib > maxContrib) { maxContrib = contrib; topContributor = c.type; }
  }

  const rawScore = (weightedSum / (active.length * 10 * 2.0)) * 100;
  const score = Math.min(100, Math.round(rawScore));

  const critical = active.filter((c) => c.severity >= 8).length;
  const totalAffected = active.reduce((s, c) => s + c.affectedPopulation, 0);

  // Pseudo-trend based on score (deterministic for demo)
  const seed = new Date().getHours() % 3;
  const trend = seed === 0 ? 'rising' : seed === 1 ? 'stable' : 'falling';
  const trendDelta = seed === 0 ? Math.round(score * 0.05) : seed === 2 ? -Math.round(score * 0.03) : 0;

  return {
    score,
    label: scoreLabel(score),
    color: scoreColor(score),
    activeCrises: active.length,
    criticalCount: critical,
    totalAffected,
    topContributor,
    trend,
    trendDelta,
  };
}

function scoreLabel(s: number): string {
  if (s >= 85) return 'CATASTROPHIC';
  if (s >= 70) return 'CRITICAL';
  if (s >= 50) return 'HIGH';
  if (s >= 30) return 'ELEVATED';
  return 'MINIMAL';
}
function scoreColor(s: number): string {
  if (s >= 85) return '#FF0033';
  if (s >= 70) return '#FF3B5C';
  if (s >= 50) return '#FF8C00';
  if (s >= 30) return '#FFC857';
  return '#2EF2A3';
}
function zeroIndex(): ThreatIndexResult {
  return { score: 0, label: 'MINIMAL', color: '#2EF2A3', activeCrises: 0, criticalCount: 0, totalAffected: 0, topContributor: '', trend: 'stable', trendDelta: 0 };
}
