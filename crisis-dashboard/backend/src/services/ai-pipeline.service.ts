/**
 * Core AI pipeline — sends real-world data to Claude and gets structured
 * crisis analysis, severity scoring, and survival protocols back.
 */
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import type { RawDataBundle } from './data-sources.service';
import { aggregateAllSources } from './data-sources.service';
import { seedDatabase } from './seed.service';

const adapter = new PrismaLibSql({ url: `file:${path.join(process.cwd(), 'lastlight.db')}` });
const prisma = new PrismaClient({ adapter });

export type PipelineStatus = 'idle' | 'fetching' | 'analyzing' | 'storing' | 'done' | 'error';

export interface PipelineState {
  status: PipelineStatus;
  lastRun: string | null;
  lastRunDuration: number | null;
  crisisCount: number;
  error: string | null;
  sourcesUsed: string[];
  nextRun: string | null;
}

const state: PipelineState = {
  status: 'idle',
  lastRun: null,
  lastRunDuration: null,
  crisisCount: 0,
  error: null,
  sourcesUsed: [],
  nextRun: null,
};

// Callback for real-time broadcast
let onUpdateCallback: ((state: PipelineState) => void) | null = null;

export function setPipelineUpdateCallback(cb: (state: PipelineState) => void) {
  onUpdateCallback = cb;
}

function emit(update: Partial<PipelineState>) {
  Object.assign(state, update);
  onUpdateCallback?.(state);
}

export function getPipelineState(): PipelineState { return { ...state }; }

const ANALYSIS_PROMPT = (bundle: RawDataBundle) => `
You are LASTLIGHT — a real-time global crisis intelligence AI. Your mission is to analyze actual monitoring data and produce structured crisis intelligence that helps people survive and prepare.

## REAL-TIME DATA (fetched ${bundle.fetchedAt})

### USGS EARTHQUAKE MONITORING (M4.0+)
${bundle.earthquakes}

### NASA DONKI SOLAR WEATHER
${bundle.solarEvents}

### GDACS GLOBAL DISASTER ALERTS
${bundle.disasters}

### RELIEFWEB HUMANITARIAN CRISES
${bundle.humanitarian}

### CRISIS NEWS HEADLINES
${bundle.newsHeadlines}

## YOUR TASK
Analyze ALL the above data and produce a structured JSON array of crisis objects. Each represents a REAL ongoing threat from the data above. Do NOT invent crises — only report what the data shows. You may synthesize multiple data points into one crisis entry.

For each crisis return this EXACT JSON structure:
{
  "type": "earthquake|pandemic|flood|war|cyber_attack|climate|volcanic|tsunami|famine|nuclear|solar_storm",
  "title": "concise title (max 70 chars)",
  "location": "City/Region, Country",
  "country": "Country name",
  "lat": number,
  "lng": number,
  "severity": number (1.0-10.0, based on actual data magnitude/alert levels/casualties),
  "affectedPopulation": number (realistic estimate based on data),
  "description": "2-3 sentences describing what is ACTUALLY happening based on the data",
  "aiAnalysis": "2-3 sentences of your predictive analysis — what will likely happen in the next 24-72h based on data patterns",
  "safetyProtocols": ["specific protocol 1", "specific protocol 2", "protocol 3", "protocol 4", "protocol 5"],
  "scientificData": {"key": "value with units", ...},
  "status": "active|monitoring|resolved",
  "predictionScore": 0.0-1.0 (probability this escalates in 48h),
  "predictionNote": "1 sentence about predicted trajectory"
}

Rules:
- Use ACTUAL coordinates from the data (USGS provides exact lat/lng for earthquakes)
- Severity must reflect actual magnitude (M7.0 earthquake = severity ~8, M5.0 = ~6)
- GDACS Red alert = severity 8-10, Orange = 6-7, Green = 3-5
- Solar X-class flare = severity 7-9, M-class = 5-7
- Include solar events affecting Earth (CMEs, X-flares) as "solar_storm" type at Earth's location (0,0) or affected region
- Return 6-14 crises maximum, prioritizing highest severity
- Return ONLY a valid JSON array, nothing else
`;

const PREDICTION_PROMPT = (crises: object[]) => `
You are LASTLIGHT's predictive intelligence engine. Based on the current active crises, predict what threats may emerge or escalate in the next 24-72 hours.

CURRENT ACTIVE CRISES:
${JSON.stringify(crises.slice(0, 8), null, 2)}

Return a JSON array of 3-5 predictions:
{
  "title": "Predicted threat title",
  "probability": 0.0-1.0,
  "timeframe": "12h|24h|48h|72h",
  "type": "crisis type",
  "reason": "1-2 sentences explaining the prediction based on current data patterns",
  "preparationAdvice": "1 key action people should take now",
  "region": "Geographic area at risk"
}

Base predictions on:
- Aftershock sequences following major earthquakes
- Disease spread from outbreak zones
- Weather pattern escalation
- Geopolitical tension indicators
- Solar storm Earth arrival times (CMEs travel ~1-3 days)
- Seasonal patterns
Return ONLY a valid JSON array.
`;

export interface Prediction {
  title: string;
  probability: number;
  timeframe: string;
  type: string;
  reason: string;
  preparationAdvice: string;
  region: string;
}

let lastPredictions: Prediction[] = [];
export function getPredictions(): Prediction[] { return lastPredictions; }

export async function runAIPipeline(forceDate?: string): Promise<number> {
  const startTime = Date.now();
  const dateLabel = forceDate ?? new Date().toISOString().split('T')[0];
  const apiKey = process.env.ANTHROPIC_API_KEY;

  emit({ status: 'fetching', error: null, sourcesUsed: [] });

  let bundle: RawDataBundle;
  try {
    bundle = await aggregateAllSources();
  } catch (err) {
    emit({ status: 'error', error: `Data fetch failed: ${String(err)}` });
    return 0;
  }

  const sourcesUsed = [
    'USGS Earthquake Feed',
    'NASA DONKI Solar',
    'GDACS Disaster Alerts',
    'ReliefWeb Humanitarian',
    'Global News RSS',
  ];
  emit({ status: 'analyzing', sourcesUsed });

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    console.log('[Pipeline] No API key — using seed data with real earthquake overlay');
    await seedDatabase(dateLabel);
    // Overlay real USGS earthquakes on top of seed data
    await overlayRealEarthquakes(bundle.earthquakes, dateLabel);
    const count = await prisma.crisis.count({ where: { dateLabel } });
    emit({ status: 'done', lastRun: new Date().toISOString(), lastRunDuration: Date.now() - startTime, crisisCount: count });
    return count;
  }

  const client = new Anthropic({ apiKey });

  try {
    // ── Step 1: Analyze real data ──────────────────────────────────────────
    const analysisResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: ANALYSIS_PROMPT(bundle) }],
    });

    const analysisText = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : '';
    const jsonMatch = analysisText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('AI returned no JSON array');

    const rawCrises: Array<{
      type?: string; title?: string; location?: string; country?: string;
      lat?: number; lng?: number; severity?: number; affectedPopulation?: number;
      description?: string; aiAnalysis?: string; safetyProtocols?: string[];
      scientificData?: Record<string, string>; status?: string;
      predictionScore?: number; predictionNote?: string;
    }> = JSON.parse(jsonMatch[0]);

    // ── Step 2: Store analyzed crises ──────────────────────────────────────
    emit({ status: 'storing' });
    await prisma.crisis.deleteMany({ where: { dateLabel } });

    await prisma.crisis.createMany({
      data: rawCrises.map((c) => ({
        type: c.type ?? 'climate',
        title: c.title ?? 'Unknown Crisis',
        location: c.location ?? 'Unknown',
        country: c.country ?? 'Unknown',
        lat: c.lat ?? 0,
        lng: c.lng ?? 0,
        severity: Math.min(10, Math.max(1, c.severity ?? 5)),
        affectedPopulation: c.affectedPopulation ?? 0,
        description: c.description ?? '',
        aiAnalysis: c.aiAnalysis ?? '',
        safetyProtocols: JSON.stringify(c.safetyProtocols ?? []),
        scientificData: JSON.stringify(c.scientificData ?? {}),
        status: c.status ?? 'active',
        dateLabel,
        predictionScore: c.predictionScore ?? 0,
        predictionNote: c.predictionNote ?? '',
      })),
    });

    // ── Step 3: Generate predictions ──────────────────────────────────────
    try {
      const predResponse = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: PREDICTION_PROMPT(rawCrises) }],
      });
      const predText = predResponse.content[0].type === 'text' ? predResponse.content[0].text : '';
      const predMatch = predText.match(/\[[\s\S]*\]/);
      if (predMatch) lastPredictions = JSON.parse(predMatch[0]);
    } catch { /* predictions are optional */ }

    const count = rawCrises.length;
    emit({
      status: 'done',
      lastRun: new Date().toISOString(),
      lastRunDuration: Date.now() - startTime,
      crisisCount: count,
    });
    console.log(`[Pipeline] Analysis complete: ${count} crises, ${lastPredictions.length} predictions`);
    return count;

  } catch (err) {
    emit({ status: 'error', error: String(err) });
    console.error('[Pipeline] Error:', err);
    return 0;
  }
}

// Overlay real USGS data even without AI key
async function overlayRealEarthquakes(rawJson: string, dateLabel: string) {
  try {
    const quakes: Array<{
      lat: number; lng: number; magnitude: number; location: string;
      depth_km: number; time: string; tsunami_alert: boolean;
    }> = JSON.parse(rawJson);

    const significant = quakes.filter((q) => q.magnitude >= 5.5).slice(0, 5);
    for (const q of significant) {
      const country = q.location.split(', ').pop() ?? q.location;
      const existing = await prisma.crisis.findFirst({
        where: { dateLabel, lat: { gte: q.lat - 1, lte: q.lat + 1 }, type: 'earthquake' },
      });
      if (!existing) {
        await prisma.crisis.create({
          data: {
            type: 'earthquake',
            title: `M${q.magnitude} Earthquake — ${q.location}`,
            location: q.location,
            country,
            lat: q.lat,
            lng: q.lng,
            severity: Math.min(10, q.magnitude * 1.1),
            affectedPopulation: Math.round(50000 * q.magnitude),
            description: `A magnitude ${q.magnitude} earthquake struck ${q.location} at depth ${q.depth_km}km.${q.tsunami_alert ? ' Tsunami alert issued.' : ''}`,
            aiAnalysis: `Seismic event confirmed by USGS. Magnitude ${q.magnitude} at ${q.depth_km}km depth.`,
            safetyProtocols: JSON.stringify(['Move away from buildings', 'Avoid damaged structures', 'Check for gas leaks', 'Follow evacuation orders', 'Monitor official channels']),
            scientificData: JSON.stringify({ Magnitude: `M${q.magnitude}`, Depth: `${q.depth_km}km`, Source: 'USGS', 'Tsunami Alert': q.tsunami_alert ? 'Yes' : 'No' }),
            status: 'active',
            dateLabel,
            predictionScore: q.magnitude > 6.5 ? 0.7 : 0.3,
            predictionNote: q.magnitude > 6.5 ? 'Aftershock sequence likely in 24-48h' : 'Monitoring for aftershocks',
          },
        });
      }
    }
  } catch { /* non-critical */ }
}
