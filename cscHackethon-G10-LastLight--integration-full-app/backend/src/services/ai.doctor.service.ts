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

type UrgencyLevel = DoctorResponse['urgencyLevel'];

interface SymptomGuide {
  headline: string;
  immediateSteps: string[];
  doNotDo: string[];
  whenToCallEmergency: string[];
  recoveryTips: string[];
  emergency: boolean;
}

const lifeThreateningSymptoms = new Set([
  'cardiac_arrest',
  'choking',
  'drowning',
  'anaphylaxis',
  'stroke',
  'breathing_difficulty',
  'suicidal',
]);

const symptomGuides: Record<string, SymptomGuide> = {
  cut_bleeding: {
    headline: 'Control bleeding, protect the wound, and watch for shock.',
    immediateSteps: [
      'Apply firm direct pressure with clean cloth or gauze for at least 10 minutes.',
      'Raise the injured area above heart level if this does not worsen pain.',
      'Rinse visible dirt away with clean running water once bleeding is controlled.',
      'Cover with a clean dressing and keep pressure on if bleeding restarts.',
    ],
    doNotDo: [
      'Do not remove cloths soaked with blood; add more layers and keep pressure.',
      'Do not dig deeply for embedded objects or close a dirty wound with glue.',
    ],
    whenToCallEmergency: [
      'Bleeding spurts, soaks dressings, or does not slow after 10 minutes of pressure.',
      'The wound is deep, gaping, on the face, or has an embedded object.',
      'The patient becomes pale, sweaty, confused, weak, or faints.',
    ],
    recoveryTips: [
      'Change dressings daily and keep the wound clean and dry.',
      'Ask a clinician about tetanus protection if the wound is dirty or deep.',
    ],
    emergency: false,
  },
  burn: {
    headline: 'Cool the burn quickly and protect the skin from further damage.',
    immediateSteps: [
      'Hold the burn under cool running water for 20 minutes as soon as possible.',
      'Remove rings, watches, or tight clothing near the burn before swelling starts.',
      'Cover with sterile non-stick dressing or clean plastic wrap.',
      'Give small sips of water if the patient is alert and not vomiting.',
    ],
    doNotDo: [
      'Do not use ice, butter, toothpaste, or oily creams on a fresh burn.',
      'Do not pop blisters or peel stuck clothing from burned skin.',
    ],
    whenToCallEmergency: [
      'The burn is on the face, hands, genitals, major joints, chest, or airway.',
      'The burn is larger than the patient palm or looks white, leathery, or charred.',
      'There is smoke inhalation, trouble breathing, confusion, or severe pain.',
    ],
    recoveryTips: [
      'Keep the dressing clean and watch for spreading redness, pus, fever, or swelling.',
      'Use pain relief only as directed on the label or by a clinician.',
    ],
    emergency: false,
  },
  fracture: {
    headline: 'Immobilize the injury and avoid moving the suspected fracture.',
    immediateSteps: [
      'Keep the injured limb still in the position found.',
      'Support the area with padding, a splint, or rolled clothing if available.',
      'Apply a cold pack wrapped in cloth for 15 to 20 minutes.',
      'Check fingers or toes beyond the injury for warmth, color, and feeling.',
    ],
    doNotDo: [
      'Do not try to straighten a deformed limb or push bone back under skin.',
      'Do not let the patient walk on a suspected leg or foot fracture.',
    ],
    whenToCallEmergency: [
      'Bone is visible, the limb is deformed, numb, blue, cold, or cannot move.',
      'There is heavy bleeding, head or spine injury, or severe uncontrolled pain.',
      'The injury involves the hip, pelvis, neck, back, or multiple bones.',
    ],
    recoveryTips: [
      'Keep the limb elevated if comfortable and monitor swelling.',
      'Arrange imaging or clinical evaluation before returning to activity.',
    ],
    emergency: false,
  },
  head_injury: {
    headline: 'Monitor closely because head injuries can worsen after the impact.',
    immediateSteps: [
      'Have the patient stop activity and sit or lie down quietly.',
      'Check responsiveness, speech, vision, balance, and memory.',
      'Apply a cold pack wrapped in cloth to swelling for 15 minutes.',
      'Keep the patient awake and observed until a clinician or emergency dispatcher advises otherwise.',
    ],
    doNotDo: [
      'Do not give alcohol, sedatives, or strong pain medication.',
      'Do not let the patient drive, return to sport, or be left alone.',
    ],
    whenToCallEmergency: [
      'Loss of consciousness, repeated vomiting, seizure, worsening headache, or confusion.',
      'Unequal pupils, weakness, slurred speech, neck pain, or fluid from nose or ears.',
      'Any head injury in a baby, older adult, anticoagulant user, or high-speed crash.',
    ],
    recoveryTips: [
      'Rest in a quiet place and avoid screens if symptoms worsen.',
      'Seek medical clearance before returning to work, driving, or sports.',
    ],
    emergency: true,
  },
  sprain: {
    headline: 'Protect the joint, reduce swelling, and avoid loading it too soon.',
    immediateSteps: [
      'Rest the joint and stop the activity that caused the injury.',
      'Apply a cold pack wrapped in cloth for 15 to 20 minutes.',
      'Use light compression if it does not cause numbness or color change.',
      'Elevate the area above heart level when possible.',
    ],
    doNotDo: [
      'Do not massage hard, apply heat early, or force movement through sharp pain.',
      'Do not walk on an injured ankle or knee if it cannot bear weight.',
    ],
    whenToCallEmergency: [
      'The joint is deformed, numb, blue, cold, or cannot bear weight.',
      'Pain is severe, swelling is rapid, or there was a loud pop with instability.',
      'Symptoms do not improve after 24 to 48 hours of careful care.',
    ],
    recoveryTips: [
      'Begin gentle motion only when pain allows.',
      'Use support and gradual return to activity after swelling improves.',
    ],
    emergency: false,
  },
  breathing_difficulty: {
    headline: 'Breathing trouble can become life-threatening and needs urgent action.',
    immediateSteps: [
      'Call emergency services now if breathing is severe, sudden, or worsening.',
      'Help the patient sit upright and loosen tight clothing.',
      'Keep the area clear of smoke, dust, chemicals, or crowding.',
      'Use prescribed inhaler, oxygen, or rescue medication exactly as directed if available.',
    ],
    doNotDo: [
      'Do not make the patient lie flat if it worsens breathing.',
      'Do not give food or drink while breathing is difficult.',
    ],
    whenToCallEmergency: [
      'Blue lips, chest pain, confusion, fainting, or inability to speak full sentences.',
      'Breathing does not improve quickly after prescribed rescue medication.',
      'Symptoms started after allergy, smoke, chemical exposure, injury, or choking.',
    ],
    recoveryTips: [
      'Note triggers, medication used, and timing for clinicians.',
      'Get medical review even after improvement if this is new or unusually severe.',
    ],
    emergency: true,
  },
  high_fever: {
    headline: 'Lower risk by cooling gently, hydrating, and watching for red flags.',
    immediateSteps: [
      'Measure temperature and repeat it after fluids or fever medicine as directed.',
      'Offer frequent small sips of water or oral rehydration solution.',
      'Keep clothing light and the room comfortably cool.',
      'Use age-appropriate fever medicine only according to the label.',
    ],
    doNotDo: [
      'Do not use ice baths, alcohol rubs, or multiple fever medicines at once.',
      'Do not give aspirin to children or teens unless a clinician says to.',
    ],
    whenToCallEmergency: [
      'Fever with stiff neck, rash that does not blanch, seizure, confusion, or trouble breathing.',
      'A baby under 3 months has a temperature of 100.4 F / 38 C or higher.',
      'Signs of dehydration, persistent vomiting, or fever above 104 F / 40 C.',
    ],
    recoveryTips: [
      'Track fluids, urination, temperature, and new symptoms.',
      'Seek care if fever lasts more than 3 days or returns after improving.',
    ],
    emergency: false,
  },
  panic_attack: {
    headline: 'Reduce stimulation, slow breathing, and confirm there are no medical red flags.',
    immediateSteps: [
      'Move to a quieter place and speak in short calm sentences.',
      'Coach slow breathing: inhale 4 seconds, exhale 6 seconds for several minutes.',
      'Name five things the patient can see, four they can feel, and three they can hear.',
      'Ask whether chest pain, fainting, injury, or substance use is present.',
    ],
    doNotDo: [
      'Do not crowd, shame, restrain, or tell the patient to simply calm down.',
      'Do not dismiss chest pain or breathing symptoms as anxiety without checking safety.',
    ],
    whenToCallEmergency: [
      'Chest pain, fainting, blue lips, new confusion, or symptoms unlike prior panic attacks.',
      'The patient may harm themselves or cannot stay safe.',
      'Symptoms follow injury, drug exposure, or severe dehydration.',
    ],
    recoveryTips: [
      'After symptoms settle, encourage hydration, rest, and contact with a trusted person.',
      'Arrange mental health follow-up if attacks recur or daily life is affected.',
    ],
    emergency: false,
  },
  suicidal: {
    headline: 'Treat this as an immediate safety emergency and keep the person with support.',
    immediateSteps: [
      'Call emergency services or a local crisis line now if there is immediate danger.',
      'Stay with the person and move weapons, medicines, cords, or sharp objects away.',
      'Use direct, calm language and ask if they have a plan or access to means.',
      'Contact a trusted nearby person who can help keep them safe.',
    ],
    doNotDo: [
      'Do not leave the person alone if they may act on suicidal thoughts.',
      'Do not argue, judge, promise secrecy, or minimize what they are saying.',
    ],
    whenToCallEmergency: [
      'They have a plan, intent, access to means, intoxication, psychosis, or recent attempt.',
      'They cannot agree to stay safe or you cannot remove immediate dangers.',
      'You are unsure: emergency dispatch can help decide the safest next step.',
    ],
    recoveryTips: [
      'Write down contacts, triggers, medicines, and recent events for the care team.',
      'Stay connected after the crisis and arrange professional follow-up.',
    ],
    emergency: true,
  },
  choking: {
    headline: 'Severe choking needs immediate airway first aid.',
    immediateSteps: [
      'Ask if the person can cough or speak; encourage coughing if air is moving.',
      'If they cannot breathe, speak, or cough, call emergency services.',
      'Give abdominal thrusts for adults and children over 1 year if trained.',
      'Start CPR if the person becomes unresponsive and follow dispatcher instructions.',
    ],
    doNotDo: [
      'Do not do blind finger sweeps inside the mouth.',
      'Do not give water or food while choking is ongoing.',
    ],
    whenToCallEmergency: [
      'The person cannot breathe, speak, cry, cough, or becomes blue or weak.',
      'The person becomes unconscious or choking happened in an infant.',
      'Persistent coughing, wheezing, or throat pain remains after the object clears.',
    ],
    recoveryTips: [
      'After severe choking, get checked for airway irritation or injury.',
      'Watch for delayed coughing, fever, or breathing trouble.',
    ],
    emergency: true,
  },
};

function genericGuide(input: DoctorInput): SymptomGuide {
  if (input.category === 'environmental') {
    return {
      headline: 'Stop the exposure, decontaminate safely, and watch breathing closely.',
      immediateSteps: [
        'Move away from the source only if it is safe for rescuers.',
        'Remove contaminated outer clothing and bag it away from others.',
        'Rinse exposed skin or eyes with clean running water for at least 15 minutes.',
        'Call poison control, emergency services, or local hazard response for substance-specific guidance.',
      ],
      doNotDo: [
        'Do not enter contaminated areas without protection.',
        'Do not mix chemicals or apply creams before decontamination.',
      ],
      whenToCallEmergency: [
        'Trouble breathing, chest pain, burns, confusion, seizure, or loss of consciousness.',
        'Exposure involves radiation, unknown chemicals, carbon monoxide, or large smoke inhalation.',
        'Symptoms affect a child, older adult, pregnant patient, or medically fragile person.',
      ],
      recoveryTips: [
        'Record the substance, time, duration, and any safety labels.',
        'Follow official decontamination and monitoring instructions.',
      ],
      emergency: input.symptom !== 'dehydration',
    };
  }

  return {
    headline: 'Start first aid and monitor closely for any worsening symptoms.',
    immediateSteps: [
      'Rest the affected area and keep the patient comfortable.',
      'Check breathing, responsiveness, bleeding, pain level, and skin color.',
      'Use clean water, dressings, cooling, or support based on the visible problem.',
      'Write down symptoms, timing, medicines, allergies, and changes.',
    ],
    doNotDo: [
      'Do not ignore symptoms that are getting worse or spreading.',
      'Do not use unverified treatments or mix medications without professional advice.',
    ],
    whenToCallEmergency: [
      'Breathing becomes difficult or the patient becomes confused, faint, or blue.',
      'Pain becomes severe, bleeding will not stop, or fever is very high.',
      'Symptoms affect a child, older adult, pregnant patient, or medically fragile person.',
    ],
    recoveryTips: [
      'Hydrate, rest, and keep the affected area clean and protected.',
      'Seek medical care if symptoms do not improve or return after initial recovery.',
    ],
    emergency: false,
  };
}

function urgencyFor(input: DoctorInput, guide: SymptomGuide): { urgencyLevel: UrgencyLevel; urgencyColor: string } {
  if (input.severity >= 5 || lifeThreateningSymptoms.has(input.symptom)) {
    return { urgencyLevel: 'CALL_911', urgencyColor: '#FF0033' };
  }
  if (input.severity >= 4 || guide.emergency) {
    return { urgencyLevel: 'GO_ER', urgencyColor: '#FF3B5C' };
  }
  if (input.severity >= 3) {
    return { urgencyLevel: 'URGENT_CARE', urgencyColor: '#FFC857' };
  }
  return { urgencyLevel: input.severity <= 1 ? 'MONITOR' : 'SELF_CARE', urgencyColor: '#2EF2A3' };
}

function ruleBasedAdvice(input: DoctorInput): DoctorResponse {
  const guide = symptomGuides[input.symptom] ?? genericGuide(input);
  const urgency = urgencyFor(input, guide);
  const ageNote = input.age < 12
    ? 'Because the patient is a child, use child-specific doses and seek care earlier if symptoms worsen.'
    : input.age >= 65
      ? 'Because the patient is older, seek care earlier for weakness, confusion, dehydration, or breathing changes.'
      : null;

  return {
    ...urgency,
    headline: guide.headline,
    immediateSteps: ageNote ? [...guide.immediateSteps, ageNote].slice(0, 6) : guide.immediateSteps,
    doNotDo: guide.doNotDo,
    whenToCallEmergency: guide.whenToCallEmergency,
    recoveryTips: guide.recoveryTips,
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
  "whenToCallEmergency": ["call emergency services if...", "call emergency services if..."],
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

    if (!jsonMatch) {
      return ruleBasedAdvice(input);
    }

    return DoctorResponseSchema.parse(JSON.parse(jsonMatch[0]));
  } catch {
    return ruleBasedAdvice(input);
  }
}
