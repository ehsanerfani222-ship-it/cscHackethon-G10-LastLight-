import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

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

const PLANET_IDS = ['sun', 'mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

// In-memory cache
let cachedEvents: SpaceEvent[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function sevenDaysAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}

interface NasaFlare {
  flrID?: string;
  classType?: string;
  sourceLocation?: string;
  beginTime?: string;
  peakTime?: string;
  endTime?: string;
  linkedEvents?: Array<{ activityID: string }> | null;
}

interface NasaCME {
  activityID?: string;
  startTime?: string;
  note?: string;
  cmeAnalyses?: Array<{
    speed?: number;
    type?: string;
    latitude?: number;
    longitude?: number;
  }> | null;
}

function flareClassToSeverity(cls: string): number {
  if (cls.startsWith('X')) return 7 + Math.min(3, parseFloat(cls.slice(1)) / 3);
  if (cls.startsWith('M')) return 5 + Math.min(2, parseFloat(cls.slice(1)) / 5);
  if (cls.startsWith('C')) return 3 + Math.min(2, parseFloat(cls.slice(1)) / 5);
  return 3;
}

async function fetchNasaSolarFlares(): Promise<SpaceEvent[]> {
  try {
    const url = `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/FLR?startDate=${sevenDaysAgoStr()}&endDate=${todayStr()}`;
    const resp = await axios.get<NasaFlare[]>(url, { timeout: 8000 });
    const flares: NasaFlare[] = Array.isArray(resp.data) ? resp.data : [];

    return flares.slice(0, 5).map((f, i) => {
      const cls = f.classType ?? 'C1.0';
      const severity = Math.round(Math.min(10, Math.max(1, flareClassToSeverity(cls))));
      return {
        id: `flare-${f.flrID ?? i}-${Date.now()}`,
        planetId: 'sun',
        type: 'solar_flare',
        title: `Solar Flare ${cls} — ${f.sourceLocation ?? 'Unknown Region'}`,
        severity,
        description: `A class ${cls} solar flare erupted from ${f.sourceLocation ?? 'an active region'} on the Sun. Peak emission recorded at ${f.peakTime ?? 'unknown time'}.`,
        aiAnalysis: `Class ${cls} flares can cause radio blackouts on the sunlit side of Earth. Enhanced proton flux may affect satellite operations and high-latitude power grids.`,
        dataSource: 'NASA DONKI',
        scientificData: {
          'Class': cls,
          'Peak Time': f.peakTime ?? 'N/A',
          'Source Region': f.sourceLocation ?? 'N/A',
          'Linked CME': f.linkedEvents?.length ? 'Yes' : 'No',
        },
        earthImpact: severity >= 7
          ? 'Strong radio blackouts possible on sunlit side. HF communications disrupted. Possible geomagnetic storm incoming.'
          : 'Minor radio blackouts possible. Low risk to power infrastructure.',
        createdAt: new Date(f.beginTime ?? Date.now()).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

async function fetchNasaCME(): Promise<SpaceEvent[]> {
  try {
    const url = `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=${sevenDaysAgoStr()}&endDate=${todayStr()}`;
    const resp = await axios.get<NasaCME[]>(url, { timeout: 8000 });
    const cmes: NasaCME[] = Array.isArray(resp.data) ? resp.data : [];

    return cmes.slice(0, 3).map((c, i) => {
      const analysis = c.cmeAnalyses?.[0];
      const speed = analysis?.speed ?? 500;
      const severity = Math.round(Math.min(10, Math.max(3, speed / 200)));
      return {
        id: `cme-${c.activityID ?? i}-${Date.now()}`,
        planetId: 'sun',
        type: 'magnetic_storm',
        title: `Coronal Mass Ejection — ${speed.toFixed(0)} km/s`,
        severity,
        description: `A CME was detected traveling at approximately ${speed.toFixed(0)} km/s. ${c.note?.slice(0, 150) ?? 'Plasma cloud ejected from the Sun.'}`,
        aiAnalysis: `CMEs at ${speed.toFixed(0)} km/s may arrive at Earth in ${Math.round(150 / (speed / 100))} hours. Geomagnetic storm watch possible.`,
        dataSource: 'NASA DONKI',
        scientificData: {
          'Speed': `${speed.toFixed(0)} km/s`,
          'Type': analysis?.type ?? 'S',
          'Latitude': `${(analysis?.latitude ?? 0).toFixed(1)}°`,
          'Start Time': c.startTime ?? 'N/A',
        },
        earthImpact: severity >= 6
          ? 'Geomagnetic storm K-index may exceed 5. Aurora visible at mid-latitudes. Satellite drag increased.'
          : 'Glancing blow possible. Minor geomagnetic disturbances expected.',
        createdAt: new Date(c.startTime ?? Date.now()).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

const SEED_EVENTS: SpaceEvent[] = [
  {
    id: 'seed-sun-1',
    planetId: 'sun',
    type: 'solar_flare',
    title: 'X2.1 Solar Flare — Active Region AR3664',
    severity: 8,
    description: 'A major X2.1 class solar flare erupted from active region AR3664. Intense X-ray and UV radiation released.',
    aiAnalysis: 'X-class flares are the most powerful category. This event may cause R3-level HF radio blackouts on the sunlit hemisphere. CME association possible.',
    dataSource: 'NASA DONKI',
    scientificData: { 'Class': 'X2.1', 'Region': 'AR3664', 'Duration': '23 min', 'X-ray Peak': '1.2×10⁻⁴ W/m²' },
    earthImpact: 'HF radio blackouts on sunlit side. Navigation signal degradation. Aurora possible at high latitudes.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-mercury-1',
    planetId: 'mercury',
    type: 'radiation_surge',
    title: 'Extreme Radiation Surge — Dayside',
    severity: 7,
    description: 'Mercury\'s dayside exposed to unfiltered solar radiation reaching 700°C surface temperatures.',
    aiAnalysis: 'With no magnetosphere or atmosphere, Mercury receives full solar wind bombardment. Surface erosion ongoing via sputtering.',
    dataSource: 'AI Analysis',
    scientificData: { 'Surface Temp': '700°C', 'Solar Wind': '450 km/s', 'Radiation Dose': '0.3 Sv/day' },
    earthImpact: 'No direct impact on Earth. Provides data for planetary shielding research.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-venus-1',
    planetId: 'venus',
    type: 'acid_storm',
    title: 'Sulfuric Acid Rain System — Upper Atmosphere',
    severity: 6,
    description: 'Massive sulfuric acid cloud system detected in Venus\'s upper atmosphere at 50km altitude.',
    aiAnalysis: 'Venus\'s thick H₂SO₄ cloud layers continuously recycle. Recent Venus Express data shows increased cloud opacity.',
    dataSource: 'ESA',
    scientificData: { 'Altitude': '50 km', 'H₂SO₄ Conc.': '85%', 'Wind Speed': '360 km/h', 'Pressure': '1 atm' },
    earthImpact: 'Reference data for Venus-analog exoplanet habitability models.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-earth-1',
    planetId: 'earth',
    type: 'magnetic_storm',
    title: 'G3 Geomagnetic Storm — Kp=7',
    severity: 7,
    description: 'A strong G3 geomagnetic storm is in progress following a CME impact. Kp index reached 7.',
    aiAnalysis: 'G3 storms can cause voltage corrections in power systems, false alarms in protective devices, and surface charging on satellites.',
    dataSource: 'NASA DONKI',
    scientificData: { 'Kp Index': '7', 'Dst': '-150 nT', 'Duration': '18 hours', 'Bz': '-20 nT' },
    earthImpact: 'Power grid fluctuations at high latitudes. GPS accuracy reduced. Aurora visible at 50° latitude.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-mars-1',
    planetId: 'mars',
    type: 'dust_storm',
    title: 'Planet-Encircling Dust Storm — Global Event',
    severity: 9,
    description: 'A planet-encircling dust storm has engulfed Mars, reducing visibility to near zero across the globe.',
    aiAnalysis: 'Global dust events occur every few Martian years. This storm raises opacity (tau) above 8.0, blocking solar power to surface missions.',
    dataSource: 'NASA JPL',
    scientificData: { 'Opacity (Tau)': '8.2', 'Coverage': '100%', 'Duration': '3+ months', 'Wind Speed': '97 km/h' },
    earthImpact: 'Threatens Perseverance rover operations. Critical for crewed Mars mission planning.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-jupiter-1',
    planetId: 'jupiter',
    type: 'atmospheric_vortex',
    title: 'Great Red Spot Expansion — Storm Intensification',
    severity: 8,
    description: 'Jupiter\'s Great Red Spot has absorbed two smaller storms and expanded 15% in the past 30 days.',
    aiAnalysis: 'The GRS anticyclonic storm system shows renewed intensity. Wind speeds at the periphery exceed 640 km/h.',
    dataSource: 'NASA JPL',
    scientificData: { 'Size': '16,350 km wide', 'Wind Speed': '640 km/h', 'Duration': '350+ years', 'Depth': '500 km' },
    earthImpact: 'No direct impact. Provides atmospheric dynamics model for Earth hurricane forecasting.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-saturn-1',
    planetId: 'saturn',
    type: 'ring_disruption',
    title: 'Ring Rain Event — B-Ring Density Decrease',
    severity: 5,
    description: 'Saturn\'s B-ring is shedding material into the planet\'s atmosphere at 10,000 kg/s — "ring rain".',
    aiAnalysis: 'Cassini confirmed ring rain drains Saturn\'s rings at 1,000-10,000 kg/s. At this rate rings may disappear in 100 million years.',
    dataSource: 'NASA JPL',
    scientificData: { 'Infall Rate': '10,000 kg/s', 'Ring Region': 'B-Ring', 'Age Loss': '100M years', 'Cause': 'Magnetic field lines' },
    earthImpact: 'Long-term observation data for planetary ring system evolution models.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-uranus-1',
    planetId: 'uranus',
    type: 'ice_storm',
    title: 'Diamond Rain Deep Atmosphere Detected',
    severity: 6,
    description: 'Model simulations confirm diamond precipitation in Uranus\'s deep mantle under extreme pressure conditions.',
    aiAnalysis: 'At pressures exceeding 1 million atmospheres, carbon atoms crystallize into diamond. This contributes to Uranus\'s unusual heat signature.',
    dataSource: 'AI Analysis',
    scientificData: { 'Depth': '7,000 km', 'Pressure': '1M atm', 'Temperature': '7,000°C', 'Diamond Size': 'mm-scale' },
    earthImpact: 'Validates high-pressure physics models. Potential applications in synthetic diamond research.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'seed-neptune-1',
    planetId: 'neptune',
    type: 'dark_spot',
    title: 'New Dark Spot Detected — Southern Hemisphere',
    severity: 7,
    description: 'Hubble Space Telescope has detected a new dark anticyclonic storm system in Neptune\'s southern hemisphere.',
    aiAnalysis: 'Neptunian dark spots are high-pressure systems surrounded by bright methane clouds. They typically last 2-5 years before dissipating.',
    dataSource: 'NASA JPL',
    scientificData: { 'Size': '6,800 km', 'Wind Speed': '2,400 km/h', 'Latitude': '48°S', 'Methane Band': '890 nm' },
    earthImpact: 'Provides comparison data for Uranus/Neptune ice giant atmospheric models.',
    createdAt: new Date().toISOString(),
  },
];

async function generateWithAI(): Promise<SpaceEvent[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') return [];

  try {
    const client = new Anthropic({ apiKey });
    const prompt = `You are a space weather and planetary science AI for the LASTLIGHT platform. Generate one realistic current event for each of these planetary bodies: mercury, venus, earth, mars, jupiter, saturn, uranus, neptune.

For each, return a JSON object with these exact fields:
- id: unique string like "ai-{planetId}-{timestamp}"
- planetId: one of the planets listed
- type: one of [solar_flare, dust_storm, acid_storm, magnetic_storm, radiation_surge, atmospheric_vortex, ring_disruption, ice_storm, dark_spot]
- title: short descriptive title (max 60 chars)
- severity: number 1-10
- description: 2-3 sentences
- aiAnalysis: 2-3 sentences of scientific analysis
- dataSource: "AI Analysis"
- scientificData: object with 4 key-value string pairs of relevant metrics
- earthImpact: one sentence on impact or relevance to Earth/humans
- createdAt: ISO timestamp string

Return ONLY a valid JSON array of 8 objects (one per planet). No markdown.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const events: SpaceEvent[] = JSON.parse(match[0]);
    return events;
  } catch {
    return [];
  }
}

export async function getSpaceEvents(planetId?: string): Promise<SpaceEvent[]> {
  const now = Date.now();

  if (cachedEvents.length === 0 || now - lastFetchTime > CACHE_TTL_MS) {
    const [flares, cmes, aiEvents] = await Promise.all([
      fetchNasaSolarFlares(),
      fetchNasaCME(),
      generateWithAI(),
    ]);

    const nasaAndAI = [...flares, ...cmes, ...aiEvents];

    // For planets not covered by NASA/AI, add seed events
    const coveredPlanets = new Set(nasaAndAI.map((e) => e.planetId));
    const seedFallbacks = SEED_EVENTS.filter((e) => !coveredPlanets.has(e.planetId));

    cachedEvents = [...nasaAndAI, ...seedFallbacks];
    lastFetchTime = now;
  }

  if (planetId) {
    return cachedEvents.filter((e) => e.planetId === planetId);
  }
  return cachedEvents;
}

export async function generateFreshEvents(): Promise<SpaceEvent[]> {
  lastFetchTime = 0; // Invalidate cache
  return getSpaceEvents();
}

export { PLANET_IDS };
