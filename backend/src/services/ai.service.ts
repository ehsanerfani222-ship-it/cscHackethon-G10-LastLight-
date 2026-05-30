import Anthropic from '@anthropic-ai/sdk';
import type { Crisis } from '@prisma/client';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CRISIS_TYPES = [
  'earthquake', 'pandemic', 'flood', 'war', 'cyber_attack',
  'climate', 'volcanic', 'tsunami', 'famine', 'nuclear',
];

const CRISIS_LOCATIONS = [
  { location: 'Tokyo, Japan', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { location: 'Manila, Philippines', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { location: 'Jakarta, Indonesia', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { location: 'Istanbul, Turkey', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
  { location: 'Los Angeles, USA', country: 'USA', lat: 34.0522, lng: -118.2437 },
  { location: 'Mumbai, India', country: 'India', lat: 19.0760, lng: 72.8777 },
  { location: 'São Paulo, Brazil', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
  { location: 'Lagos, Nigeria', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
  { location: 'Kyiv, Ukraine', country: 'Ukraine', lat: 50.4501, lng: 30.5234 },
  { location: 'Kabul, Afghanistan', country: 'Afghanistan', lat: 34.5553, lng: 69.2075 },
  { location: 'Bangladesh', country: 'Bangladesh', lat: 23.6850, lng: 90.3563 },
  { location: 'Pakistan', country: 'Pakistan', lat: 30.3753, lng: 69.3451 },
  { location: 'Myanmar', country: 'Myanmar', lat: 19.7633, lng: 96.0785 },
  { location: 'Horn of Africa', country: 'Ethiopia', lat: 9.1450, lng: 40.4897 },
  { location: 'Gaza', country: 'Palestine', lat: 31.3547, lng: 34.3088 },
  { location: 'Yellowstone, USA', country: 'USA', lat: 44.4280, lng: -110.5885 },
  { location: 'Sicily, Italy', country: 'Italy', lat: 37.5999, lng: 14.0154 },
  { location: 'Caribbean Sea', country: 'Haiti', lat: 18.9712, lng: -72.2852 },
  { location: 'North Sea', country: 'Netherlands', lat: 52.3702, lng: 4.8952 },
  { location: 'Taiwan Strait', country: 'Taiwan', lat: 25.0330, lng: 121.5654 },
];

export interface GeneratedCrisis {
  type: string;
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
  status: string;
}

export async function generateCrisesWithAI(dateLabel: string): Promise<GeneratedCrisis[]> {
  const count = 8 + Math.floor(Math.random() * 5); // 8-12 crises
  const selected = CRISIS_LOCATIONS.sort(() => Math.random() - 0.5).slice(0, count);

  const prompt = `You are a global crisis intelligence AI for the LASTLIGHT platform. Generate ${count} realistic global crisis events for ${dateLabel}.

For each crisis, create a JSON object with these EXACT fields:
- type: one of [${CRISIS_TYPES.join(', ')}]
- title: short descriptive title (max 60 chars)
- severity: number 1.0-10.0 (realistic, varied distribution)
- affectedPopulation: integer (realistic for the crisis type and location)
- description: 2-3 sentences describing the crisis situation
- aiAnalysis: 2-3 sentences of AI-generated intelligence analysis
- safetyProtocols: array of 3-5 specific safety recommendations
- scientificData: object with 3-5 key-value pairs of relevant metrics (e.g., "Magnitude": "7.2", "Depth": "10km")
- status: one of [active, monitoring, resolved]

Use these locations (in order):
${selected.map((l, i) => `${i + 1}. ${l.location} (${l.country})`).join('\n')}

Return ONLY a valid JSON array. No markdown, no explanation. Each object must have all fields listed above.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('AI response did not contain valid JSON array');

  const raw: Omit<GeneratedCrisis, 'location' | 'lat' | 'lng' | 'country'>[] = JSON.parse(jsonMatch[0]);

  return raw.map((item, i) => ({
    ...item,
    location: selected[i]?.location ?? 'Unknown',
    country: selected[i]?.country ?? 'Unknown',
    lat: selected[i]?.lat ?? 0,
    lng: selected[i]?.lng ?? 0,
  }));
}
