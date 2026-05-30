import Anthropic from '@anthropic-ai/sdk';

const client = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface BriefingRequest {
  lat?: number;
  lng?: number;
  crises: Array<{ title: string; type: string; severity: number; location: string; description: string; safetyProtocols: string[] }>;
  predictions: Array<{ title: string; probability: number; timeframe: string; reason: string; preparationAdvice: string }>;
  facilities?: Array<{ type: string; name: string; distanceKm?: number }>;
}

export interface BriefingResponse {
  greeting: string;
  threatSummary: string;
  topThreats: Array<{ title: string; severity: number; location: string; urgency: string; immediateAction: string }>;
  outlook48h: string;
  actionPlan: string[];
  locationAdvice: string;
  globalStatus: string;
  generatedAt: string;
}

export async function generateSurvivalBriefing(req: BriefingRequest): Promise<BriefingResponse> {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';

  if (!hasKey) {
    return buildFallbackBriefing(req, timeOfDay);
  }

  const topCrises = req.crises.slice(0, 5);
  const topPreds = req.predictions.slice(0, 3);

  const prompt = `You are LASTLIGHT, a global crisis intelligence AI. Generate a personalized survival briefing for an operative.

ACTIVE CRISES (${req.crises.length} total, showing top ${topCrises.length}):
${topCrises.map((c) => `- ${c.title} [Severity ${c.severity}/10] @ ${c.location}: ${c.description}`).join('\n')}

PREDICTIONS:
${topPreds.map((p) => `- ${p.title} (${Math.round(p.probability * 100)}% in ${p.timeframe}): ${p.reason}`).join('\n')}

${req.facilities?.length ? `NEARBY SAFE RESOURCES: ${req.facilities.slice(0, 5).map((f) => `${f.name} (${f.type}, ${f.distanceKm}km)`).join(', ')}` : ''}

Return ONLY this JSON structure:
{
  "greeting": "Good ${timeOfDay}, OPERATIVE. [1 sentence threat level summary]",
  "threatSummary": "2-3 sentences summarizing the current global situation",
  "topThreats": [
    {
      "title": "crisis title",
      "severity": number,
      "location": "location",
      "urgency": "CRITICAL|HIGH|MODERATE",
      "immediateAction": "1 specific action to take NOW"
    }
  ],
  "outlook48h": "2 sentences on what to expect in next 48 hours based on predictions",
  "actionPlan": ["Step 1: ...", "Step 2: ...", "Step 3: ...", "Step 4: ...", "Step 5: ..."],
  "locationAdvice": "${req.lat ? `Based on coordinates (${req.lat?.toFixed(1)}, ${req.lng?.toFixed(1)}), specific local advice` : 'General advice since location not provided'}",
  "globalStatus": "One word status: STABLE|ELEVATED|CRITICAL|CATASTROPHIC",
  "generatedAt": "${new Date().toISOString()}"
}`;

  try {
    const response = await client().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON');
    return JSON.parse(match[0]) as BriefingResponse;
  } catch {
    return buildFallbackBriefing(req, timeOfDay);
  }
}

function buildFallbackBriefing(req: BriefingRequest, timeOfDay: string): BriefingResponse {
  const top = req.crises.slice(0, 3);
  const maxSeverity = Math.max(...req.crises.map((c) => c.severity), 0);
  const status = maxSeverity >= 9 ? 'CATASTROPHIC' : maxSeverity >= 7 ? 'CRITICAL' : maxSeverity >= 5 ? 'ELEVATED' : 'STABLE';
  return {
    greeting: `Good ${timeOfDay}, OPERATIVE. Global threat level is currently ${status}.`,
    threatSummary: `${req.crises.length} active crisis events monitored worldwide. ${req.crises.filter((c) => c.severity >= 7).length} events rated critical or above.`,
    topThreats: top.map((c) => ({
      title: c.title,
      severity: c.severity,
      location: c.location,
      urgency: c.severity >= 8 ? 'CRITICAL' : c.severity >= 6 ? 'HIGH' : 'MODERATE',
      immediateAction: c.safetyProtocols[0] ?? 'Stay informed and follow official guidance',
    })),
    outlook48h: `${req.predictions.length} potential threats flagged for the next 48 hours. Continued monitoring of active events is advised.`,
    actionPlan: [
      'Monitor official government emergency channels',
      'Ensure 72-hour emergency supply kit is ready',
      'Know your nearest evacuation routes and safe zones',
      'Stay connected with family — establish a check-in protocol',
      'Charge all devices and keep emergency contacts accessible',
    ],
    locationAdvice: req.lat ? `Nearest safe facilities queried for your coordinates.` : 'Enable location in Safe Zones tab for personalized guidance.',
    globalStatus: status,
    generatedAt: new Date().toISOString(),
  };
}
