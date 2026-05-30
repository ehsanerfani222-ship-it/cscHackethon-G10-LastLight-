import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface DoctorInput {
  category: string;
  symptom: string;
  bodyArea: string;
  severity: number;
  age: number;
  additionalInfo?: string;
}

export interface DoctorResponse {
  urgencyLevel: 'CALL_911' | 'GO_ER' | 'URGENT_CARE' | 'SELF_CARE' | 'MONITOR';
  urgencyColor: string;
  headline: string;
  immediateSteps: string[];
  doNotDo: string[];
  whenToCallEmergency: string[];
  recoveryTips: string[];
  disclaimer: string;
}

export async function getAIDoctorAdvice(input: DoctorInput): Promise<DoctorResponse> {
  const prompt = `You are an emergency first aid AI assistant for the LASTLIGHT crisis platform. A user needs guidance.

Patient info:
- Category: ${input.category}
- Symptom/Condition: ${input.symptom}
- Body Area: ${input.bodyArea}
- Severity (1=mild, 5=severe): ${input.severity}/5
- Age: ${input.age}
- Additional: ${input.additionalInfo ?? 'none'}

Return ONLY a JSON object with this exact structure:
{
  "urgencyLevel": "CALL_911" | "GO_ER" | "URGENT_CARE" | "SELF_CARE" | "MONITOR",
  "urgencyColor": "#hex color matching urgency",
  "headline": "1 sentence summary of situation",
  "immediateSteps": ["step 1", "step 2", "step 3", "step 4"],
  "doNotDo": ["don't do this", "don't do that"],
  "whenToCallEmergency": ["call 911 if...", "call 911 if..."],
  "recoveryTips": ["tip 1", "tip 2"],
  "disclaimer": "Short medical disclaimer"
}

Rules:
- immediateSteps: 4-6 clear actionable steps
- doNotDo: 2-4 dangerous things to avoid
- whenToCallEmergency: 3-4 red flag symptoms
- Be specific and practical, not generic
- If severity >= 4 or life-threatening, set urgencyLevel to CALL_911 or GO_ER
- Return ONLY valid JSON, no markdown`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid AI response');
  return JSON.parse(jsonMatch[0]) as DoctorResponse;
}
