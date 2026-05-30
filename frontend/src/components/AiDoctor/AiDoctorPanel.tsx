import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, ChevronLeft, AlertTriangle, Shield, XCircle, Phone } from 'lucide-react';
import { consultAIDoctor } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'injury', label: 'Injury', emoji: '🩹', desc: 'Cuts, burns, fractures' },
  { value: 'illness', label: 'Illness', emoji: '🤒', desc: 'Fever, infection, pain' },
  { value: 'mental', label: 'Mental Crisis', emoji: '🧠', desc: 'Anxiety, shock, trauma' },
  { value: 'emergency', label: 'Emergency', emoji: '🚨', desc: 'Severe, life-threatening' },
  { value: 'environmental', label: 'Exposure', emoji: '☢️', desc: 'Chemical, radiation, smoke' },
];

const SYMPTOMS: Record<string, { value: string; label: string; emoji: string }[]> = {
  injury: [
    { value: 'cut_bleeding', label: 'Cut / Bleeding', emoji: '🩸' },
    { value: 'burn', label: 'Burn', emoji: '🔥' },
    { value: 'fracture', label: 'Fracture / Break', emoji: '🦴' },
    { value: 'head_injury', label: 'Head Injury', emoji: '🤕' },
    { value: 'sprain', label: 'Sprain / Strain', emoji: '🦶' },
    { value: 'crush_injury', label: 'Crush Injury', emoji: '⚠️' },
  ],
  illness: [
    { value: 'high_fever', label: 'High Fever', emoji: '🌡️' },
    { value: 'breathing_difficulty', label: 'Breathing Difficulty', emoji: '😮‍💨' },
    { value: 'severe_pain', label: 'Severe Pain', emoji: '😣' },
    { value: 'vomiting', label: 'Vomiting / Diarrhea', emoji: '🤢' },
    { value: 'rash', label: 'Rash / Skin Issue', emoji: '🔴' },
    { value: 'dizziness', label: 'Dizziness / Faint', emoji: '💫' },
  ],
  mental: [
    { value: 'panic_attack', label: 'Panic Attack', emoji: '😰' },
    { value: 'shock', label: 'Shock / Trauma', emoji: '😶' },
    { value: 'suicidal', label: 'Suicidal Thoughts', emoji: '🆘' },
    { value: 'ptsd', label: 'PTSD Symptoms', emoji: '🌀' },
    { value: 'grief', label: 'Grief / Loss', emoji: '💔' },
  ],
  emergency: [
    { value: 'cardiac_arrest', label: 'Cardiac Arrest', emoji: '💔' },
    { value: 'choking', label: 'Choking', emoji: '😤' },
    { value: 'drowning', label: 'Near Drowning', emoji: '🌊' },
    { value: 'poisoning', label: 'Poisoning', emoji: '☠️' },
    { value: 'anaphylaxis', label: 'Allergic Reaction', emoji: '🐝' },
    { value: 'stroke', label: 'Stroke Symptoms', emoji: '🧠' },
  ],
  environmental: [
    { value: 'smoke_inhalation', label: 'Smoke Inhalation', emoji: '💨' },
    { value: 'radiation_exposure', label: 'Radiation Exposure', emoji: '☢️' },
    { value: 'chemical_exposure', label: 'Chemical Exposure', emoji: '🧪' },
    { value: 'heatstroke', label: 'Heatstroke', emoji: '🥵' },
    { value: 'hypothermia', label: 'Hypothermia', emoji: '🥶' },
    { value: 'dehydration', label: 'Severe Dehydration', emoji: '💧' },
  ],
};

const BODY_AREAS = ['Head', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Skin', 'Whole Body'];
const SEVERITY_LABELS = ['', 'Mild — manageable', 'Uncomfortable', 'Moderate — concerning', 'Severe — alarming', 'Critical — life-threatening'];
const SEVERITY_COLORS = ['', '#2EF2A3', '#FFC857', '#FF8C00', '#FF3B5C', '#FF0033'];

interface DoctorResult {
  urgencyLevel: string;
  urgencyColor: string;
  headline: string;
  immediateSteps: string[];
  doNotDo: string[];
  whenToCallEmergency: string[];
  recoveryTips: string[];
  disclaimer: string;
}

type Step = 'category' | 'symptom' | 'body' | 'severity' | 'age' | 'result';

function OptionButton({ onClick, children, color }: { onClick: () => void; children: React.ReactNode; color?: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="rounded-2xl p-3 text-left transition-all w-full"
      style={{ background: color ? `${color}12` : 'rgba(255,255,255,0.05)', border: `1px solid ${color ?? 'rgba(255,255,255,0.1)'}50` }}
    >
      {children}
    </motion.button>
  );
}

export function AiDoctorPanel() {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState('');
  const [symptom, setSymptom] = useState('');
  const [bodyArea, setBodyArea] = useState('');
  const [severity, setSeverity] = useState(0);
  const [age, setAge] = useState(30);
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => { setStep('category'); setCategory(''); setSymptom(''); setBodyArea(''); setSeverity(0); setResult(null); };

  const consult = async () => {
    setIsLoading(true);
    try {
      const res = await consultAIDoctor({ category, symptom, bodyArea, severity, age });
      setResult(res);
      setStep('result');
    } catch { toast.error('AI Doctor unavailable, check API key'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ background: '#050816' }}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
        {step !== 'category' && step !== 'result' && (
          <button onClick={() => setStep((s) => {
            const steps: Step[] = ['category', 'symptom', 'body', 'severity', 'age', 'result'];
            const idx = steps.indexOf(s);
            return steps[Math.max(0, idx - 1)];
          })} className="text-slate-400 hover:text-white p-1"><ChevronLeft size={18} /></button>
        )}
        <Stethoscope size={18} className="text-cyan-400" />
        <div>
          <div className="text-white font-bold text-base">AI Emergency Doctor</div>
          <div className="text-slate-500 text-xs">First-aid guidance • Not a substitute for medical care</div>
        </div>
        {step !== 'category' && <button onClick={reset} className="ml-auto text-slate-500 hover:text-white text-xs">Restart</button>}
      </div>

      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {/* Step: Category */}
          {step === 'category' && (
            <motion.div key="cat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">What type of emergency is this?</p>
              {CATEGORIES.map((c) => (
                <OptionButton key={c.value} onClick={() => { setCategory(c.value); setStep('symptom'); }} color="#00E5FF">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{c.label}</div>
                      <div className="text-slate-500 text-xs">{c.desc}</div>
                    </div>
                  </div>
                </OptionButton>
              ))}
            </motion.div>
          )}

          {/* Step: Symptom */}
          {step === 'symptom' && (
            <motion.div key="sym" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-2">
              <p className="text-slate-400 text-sm mb-4">What is the main symptom?</p>
              <div className="grid grid-cols-2 gap-2">
                {(SYMPTOMS[category] ?? []).map((s) => (
                  <OptionButton key={s.value} onClick={() => { setSymptom(s.value); setStep('body'); }} color="#00E5FF">
                    <div className="text-center">
                      <div className="text-xl mb-1">{s.emoji}</div>
                      <div className="text-white text-xs font-medium leading-tight">{s.label}</div>
                    </div>
                  </OptionButton>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step: Body area */}
          {step === 'body' && (
            <motion.div key="body" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-2">
              <p className="text-slate-400 text-sm mb-4">Which area of the body is affected?</p>
              <div className="grid grid-cols-2 gap-2">
                {BODY_AREAS.map((a) => (
                  <OptionButton key={a} onClick={() => { setBodyArea(a); setStep('severity'); }} color="#2EF2A3">
                    <div className="text-white text-sm font-medium text-center py-1">{a}</div>
                  </OptionButton>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step: Severity */}
          {step === 'severity' && (
            <motion.div key="sev" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">How severe is it?</p>
              {[1, 2, 3, 4, 5].map((s) => (
                <OptionButton key={s} onClick={() => { setSeverity(s); setStep('age'); }} color={SEVERITY_COLORS[s]}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold w-8 text-center" style={{ color: SEVERITY_COLORS[s] }}>{s}</div>
                    <div className="text-white text-sm">{SEVERITY_LABELS[s]}</div>
                  </div>
                </OptionButton>
              ))}
            </motion.div>
          )}

          {/* Step: Age */}
          {step === 'age' && (
            <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="space-y-6">
              <p className="text-slate-400 text-sm">Patient age (helps tailor first-aid advice)</p>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={100} value={age} onChange={(e) => setAge(parseInt(e.target.value))}
                  className="flex-1" style={{ accentColor: '#00E5FF' }} />
                <div className="text-3xl font-bold text-white w-16 text-center">{age}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 12, 25, 40, 60, 75].map((a) => (
                  <button key={a} onClick={() => setAge(a)}
                    className="px-3 py-1 rounded-lg text-xs transition-all"
                    style={age === a ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', color: '#00E5FF' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}>
                    {a}
                  </button>
                ))}
              </div>
              <motion.button onClick={consult} disabled={isLoading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: isLoading ? '#334' : 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                      animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} />
                    AI analyzing...
                  </div>
                ) : '🩺 Get AI First Aid Guidance'}
              </motion.button>
            </motion.div>
          )}

          {/* Result */}
          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="space-y-4">
              {/* Urgency badge */}
              <div className="rounded-2xl p-4 text-center" style={{ background: `${result.urgencyColor}15`, border: `1px solid ${result.urgencyColor}40` }}>
                <div className="text-2xl font-black mb-1" style={{ color: result.urgencyColor }}>{result.urgencyLevel.replace('_', ' ')}</div>
                <div className="text-white text-sm font-medium">{result.headline}</div>
              </div>

              {/* Immediate steps */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-cyan-400" />
                  <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Immediate Steps</span>
                </div>
                {result.immediateSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-cyan-400 font-bold w-5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-slate-200">{step}</span>
                  </div>
                ))}
              </div>

              {/* Don't do */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,59,92,0.05)', border: '1px solid rgba(255,59,92,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} className="text-red-400" />
                  <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Do NOT Do</span>
                </div>
                {result.doNotDo.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-red-400">✗</span>
                    <span className="text-slate-300">{d}</span>
                  </div>
                ))}
              </div>

              {/* When to call 911 */}
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Phone size={14} className="text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Call Emergency If...</span>
                </div>
                {result.whenToCallEmergency.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="text-xs text-slate-600 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                ⚠️ {result.disclaimer}
              </div>

              <button onClick={reset} className="w-full py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Start New Consultation
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
