import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

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

const DoctorResponseSchema = z.object({
  urgencyLevel: z.enum(['CALL_911', 'GO_ER', 'URGENT_CARE', 'SELF_CARE', 'MONITOR']),
  urgencyColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  headline: z.string().min(1),
  immediateSteps: z.array(z.string().min(1)).min(1),
  doNotDo: z.array(z.string().min(1)).min(1),
  whenToCallEmergency: z.array(z.string().min(1)).min(1),
  recoveryTips: z.array(z.string().min(1)).min(1),
  disclaimer: z.string().min(1),
});

function ruleBasedAdvice(input: DoctorInput): DoctorResponse {
  const isEmergency =
    input.severity >= 4 ||
    [
      'cardiac_arrest',
      'choking',
      'drowning',
      'poisoning',
      'anaphylaxis',
      'stroke',
      'breathing_difficulty',
      'suicidal',
    ].includes(input.symptom);

  if (isEmergency) {
    return {
      urgencyLevel: input.severity >= 5 ? 'CALL_911' : 'GO_ER',
      urgencyColor: input.severity >= 5 ? '#FF0033' : '#FF3B5C',
      headline: 'This situation may need emergency medical help now.',
      immediateSteps: [
        'Move the patient away from immediate danger if it is safe to do so.',
        'Call local emergency services or ask a nearby person to call.',
        'Keep the patient still, warm, and monitored while help is on the way.',
        'Check breathing and responsiveness, and begin CPR only if trained or instructed.',
      ],
      doNotDo: [
        'Do not give food, drink, or medication unless a clinician tells you to.',
        'Do not move the patient if you suspect head, neck, spine, or major bone injury.',
      ],
      whenToCallEmergency: [
        'Call immediately for trouble breathing, chest pain, blue lips, or loss of consciousness.',
        'Call immediately for severe bleeding, seizure, stroke signs, or allergic swelling.',
        'Call immediately if the patient may harm themselves or someone else.',
      ],
      recoveryTips: [
        'After urgent care, write down symptoms, times, medications, and allergies.',
        'Follow professional discharge instructions and arrange follow-up care.',
      ],
      disclaimer: 'This is first-aid information only and is not a medical diagnosis.',
    };
  }

  return {
    urgencyLevel: input.severity >= 3 ? 'URGENT_CARE' : 'SELF_CARE',
    urgencyColor: input.severity >= 3 ? '#FFC857' : '#2EF2A3',
    headline: 'Start first aid and monitor closely for any worsening symptoms.',
    immediateSteps: [
      'Rest the affected area and keep the patient comfortable.',
      'Clean minor wounds with clean water and cover with a sterile dressing if available.',
      'Use cool running water for minor burns, and avoid ice directly on skin.',
      'Track symptoms, pain level, temperature, and any new warning signs.',
    ],
    doNotDo: [
      'Do not ignore symptoms that are getting worse or spreading.',
      'Do not use unverified treatments or mix medications without professional advice.',
    ],
    whenToCallEmergency: [
      'Call emergency services if breathing becomes difficult or the patient becomes confused.',
      'Call if pain becomes severe, bleeding will not stop, or fever is very high.',
      'Call if symptoms affect a child, older adult, pregnant patient, or medically fragile person.',
    ],
    recoveryTips: [
      'Hydrate, rest, and keep the affected area clean and protected.',
      'Seek medical care if symptoms do not improve or return after initial recovery.',
    ],
    disclaimer: 'This is first-aid information only and is not a medical diagnosis.',
  };
}

export async function getAIDoctorAdvice(input: DoctorInput): Promise<DoctorResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return ruleBasedAdvice(input);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

  try {
    const response = await client.messages.create({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return ruleBasedAdvice(input);

    return DoctorResponseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    return ruleBasedAdvice(input);
  }
}
