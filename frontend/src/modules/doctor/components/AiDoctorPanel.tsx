import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  Clock,
  Edit3,
  Phone,
  Shield,
  Stethoscope,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  consultAIDoctor,
  deleteConsultation,
  getConsultation,
  getConsultationHistory,
  updateConsultation,
} from '../../../services/api';

const CATEGORIES = [
  { value: 'injury', label: 'Injury', icon: 'IN', desc: 'Cuts, burns, fractures' },
  { value: 'illness', label: 'Illness', icon: 'IL', desc: 'Fever, infection, pain' },
  { value: 'mental', label: 'Mental Crisis', icon: 'MC', desc: 'Anxiety, shock, trauma' },
  { value: 'emergency', label: 'Emergency', icon: 'ER', desc: 'Severe, life-threatening' },
  { value: 'environmental', label: 'Exposure', icon: 'EX', desc: 'Chemical, radiation, smoke' },
];

const SYMPTOMS: Record<string, { value: string; label: string; icon: string }[]> = {
  injury: [
    { value: 'cut_bleeding', label: 'Cut / Bleeding', icon: 'CB' },
    { value: 'burn', label: 'Burn', icon: 'BU' },
    { value: 'fracture', label: 'Fracture / Break', icon: 'FR' },
    { value: 'head_injury', label: 'Head Injury', icon: 'HI' },
    { value: 'sprain', label: 'Sprain / Strain', icon: 'SP' },
    { value: 'crush_injury', label: 'Crush Injury', icon: 'CI' },
  ],
  illness: [
    { value: 'high_fever', label: 'High Fever', icon: 'HF' },
    { value: 'breathing_difficulty', label: 'Breathing Difficulty', icon: 'BD' },
    { value: 'severe_pain', label: 'Severe Pain', icon: 'SP' },
    { value: 'vomiting', label: 'Vomiting / Diarrhea', icon: 'VD' },
    { value: 'rash', label: 'Rash / Skin Issue', icon: 'RS' },
    { value: 'dizziness', label: 'Dizziness / Faint', icon: 'DZ' },
  ],
  mental: [
    { value: 'panic_attack', label: 'Panic Attack', icon: 'PA' },
    { value: 'shock', label: 'Shock / Trauma', icon: 'SH' },
    { value: 'suicidal', label: 'Suicidal Thoughts', icon: 'ST' },
    { value: 'ptsd', label: 'PTSD Symptoms', icon: 'PT' },
    { value: 'grief', label: 'Grief / Loss', icon: 'GR' },
  ],
  emergency: [
    { value: 'cardiac_arrest', label: 'Cardiac Arrest', icon: 'CA' },
    { value: 'choking', label: 'Choking', icon: 'CH' },
    { value: 'drowning', label: 'Near Drowning', icon: 'DR' },
    { value: 'poisoning', label: 'Poisoning', icon: 'PO' },
    { value: 'anaphylaxis', label: 'Allergic Reaction', icon: 'AR' },
    { value: 'stroke', label: 'Stroke Symptoms', icon: 'SK' },
  ],
  environmental: [
    { value: 'smoke_inhalation', label: 'Smoke Inhalation', icon: 'SI' },
    { value: 'radiation_exposure', label: 'Radiation Exposure', icon: 'RX' },
    { value: 'chemical_exposure', label: 'Chemical Exposure', icon: 'CX' },
    { value: 'heatstroke', label: 'Heatstroke', icon: 'HS' },
    { value: 'hypothermia', label: 'Hypothermia', icon: 'HY' },
    { value: 'dehydration', label: 'Severe Dehydration', icon: 'DH' },
  ],
};

const BODY_AREAS = ['Head', 'Chest', 'Abdomen', 'Back', 'Arms', 'Legs', 'Skin', 'Whole Body'];
const SEVERITY_LABELS = ['', 'Mild - manageable', 'Uncomfortable', 'Moderate - concerning', 'Severe - alarming', 'Critical - life-threatening'];
const SEVERITY_COLORS = ['', '#2EF2A3', '#FFC857', '#FF8C00', '#FF3B5C', '#FF0033'];

interface DoctorResult {
  id?: string;
  urgencyLevel: string;
  urgencyColor: string;
  headline: string;
  immediateSteps: string[];
  doNotDo: string[];
  whenToCallEmergency: string[];
  recoveryTips: string[];
  disclaimer: string;
}

interface DoctorConsultation extends DoctorResult {
  id: string;
  category: string;
  symptom: string;
  bodyArea: string;
  severity: number;
  age: number;
  additionalInfo?: string | null;
  createdAt: string;
}

type Step = 'category' | 'symptom' | 'body' | 'severity' | 'age' | 'result';

function formatLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function ResultCard({ result }: { result: DoctorResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 text-center" style={{ background: `${result.urgencyColor}15`, border: `1px solid ${result.urgencyColor}40` }}>
        <div className="text-2xl font-black mb-1" style={{ color: result.urgencyColor }}>{result.urgencyLevel.replace('_', ' ')}</div>
        <div className="text-white text-sm font-medium">{result.headline}</div>
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Shield size={14} className="text-cyan-400" />
          <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Immediate Steps</span>
        </div>
        {result.immediateSteps.map((item, i) => (
          <div key={item} className="flex items-start gap-2 text-sm">
            <span className="text-cyan-400 font-bold w-5 flex-shrink-0">{i + 1}.</span>
            <span className="text-slate-200">{item}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,59,92,0.05)', border: '1px solid rgba(255,59,92,0.15)' }}>
        <div className="flex items-center gap-2 mb-2">
          <XCircle size={14} className="text-red-400" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-wider">Do NOT Do</span>
        </div>
        {result.doNotDo.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm">
            <span className="text-red-400">x</span>
            <span className="text-slate-300">{item}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,200,0,0.04)', border: '1px solid rgba(255,200,0,0.15)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Phone size={14} className="text-yellow-400" />
          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Call Emergency If...</span>
        </div>
        {result.whenToCallEmergency.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
            <AlertTriangle size={12} className="text-yellow-400 mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-600 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
        Warning: {result.disclaimer}
      </div>
    </div>
  );
}

export function AiDoctorPanel() {
  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState('');
  const [symptom, setSymptom] = useState('');
  const [bodyArea, setBodyArea] = useState('');
  const [severity, setSeverity] = useState(0);
  const [age, setAge] = useState(30);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [result, setResult] = useState<DoctorResult | null>(null);
  const [history, setHistory] = useState<DoctorConsultation[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<DoctorConsultation | null>(null);
  const [editingInfo, setEditingInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const consultations = await getConsultationHistory();
      setHistory(consultations);
    } catch {
      toast.error('Unable to load consultation history');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const reset = () => {
    setStep('category');
    setCategory('');
    setSymptom('');
    setBodyArea('');
    setSeverity(0);
    setAdditionalInfo('');
    setResult(null);
    setSelectedConsultation(null);
  };

  const consult = async () => {
    setIsLoading(true);
    try {
      const res = await consultAIDoctor({ category, symptom, bodyArea, severity, age, additionalInfo });
      setResult(res);
      setStep('result');
      await loadHistory();
    } catch {
      toast.error('AI Doctor unavailable, check the backend service');
    } finally {
      setIsLoading(false);
    }
  };

  const openConsultation = async (id: string) => {
    try {
      const consultation = await getConsultation(id);
      setSelectedConsultation(consultation);
      setEditingInfo(consultation.additionalInfo ?? '');
    } catch {
      toast.error('Unable to open consultation');
    }
  };

  const saveConsultation = async () => {
    if (!selectedConsultation) return;

    try {
      const updated = await updateConsultation(selectedConsultation.id, editingInfo);
      setSelectedConsultation(updated);
      await loadHistory();
      toast.success('Consultation updated');
    } catch {
      toast.error('Unable to update consultation');
    }
  };

  const removeConsultation = async (id: string) => {
    try {
      await deleteConsultation(id);
      setSelectedConsultation((current) => (current?.id === id ? null : current));
      await loadHistory();
      toast.success('Consultation deleted');
    } catch {
      toast.error('Unable to delete consultation');
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin" style={{ background: '#050816' }}>
      <div
        className="px-4 py-4 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}
      >
        {step !== 'category' && step !== 'result' && (
          <button
            onClick={() => setStep((current) => {
              const steps: Step[] = ['category', 'symptom', 'body', 'severity', 'age', 'result'];
              const idx = steps.indexOf(current);
              return steps[Math.max(0, idx - 1)];
            })}
            className="text-slate-400 hover:text-white p-1"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        <Stethoscope size={18} className="text-cyan-400" />
        <div>
          <div className="text-white font-bold text-base">AI Emergency Doctor</div>
          <div className="text-slate-500 text-xs">First-aid guidance - Not a substitute for medical care</div>
        </div>
        {step !== 'category' && <button onClick={reset} className="ml-auto text-slate-500 hover:text-white text-xs">Restart</button>}
      </div>

      <div className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div key="cat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">What type of emergency is this?</p>
              {CATEGORIES.map((item) => (
                <OptionButton key={item.value} onClick={() => { setCategory(item.value); setStep('symptom'); }} color="#00E5FF">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-cyan-300 w-8 text-center">{item.icon}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{item.label}</div>
                      <div className="text-slate-500 text-xs">{item.desc}</div>
                    </div>
                  </div>
                </OptionButton>
              ))}
            </motion.div>
          )}

          {step === 'symptom' && (
            <motion.div key="sym" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
              <p className="text-slate-400 text-sm mb-4">What is the main symptom?</p>
              <div className="grid grid-cols-2 gap-2">
                {(SYMPTOMS[category] ?? []).map((item) => (
                  <OptionButton key={item.value} onClick={() => { setSymptom(item.value); setStep('body'); }} color="#00E5FF">
                    <div className="text-center">
                      <div className="text-xs font-black text-cyan-300 mb-1">{item.icon}</div>
                      <div className="text-white text-xs font-medium leading-tight">{item.label}</div>
                    </div>
                  </OptionButton>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'body' && (
            <motion.div key="body" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
              <p className="text-slate-400 text-sm mb-4">Which area of the body is affected?</p>
              <div className="grid grid-cols-2 gap-2">
                {BODY_AREAS.map((area) => (
                  <OptionButton key={area} onClick={() => { setBodyArea(area); setStep('severity'); }} color="#2EF2A3">
                    <div className="text-white text-sm font-medium text-center py-1">{area}</div>
                  </OptionButton>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'severity' && (
            <motion.div key="sev" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
              <p className="text-slate-400 text-sm mb-4">How severe is it?</p>
              {[1, 2, 3, 4, 5].map((value) => (
                <OptionButton key={value} onClick={() => { setSeverity(value); setStep('age'); }} color={SEVERITY_COLORS[value]}>
                  <div className="flex items-center gap-3">
                    <div className="text-xl font-bold w-8 text-center" style={{ color: SEVERITY_COLORS[value] }}>{value}</div>
                    <div className="text-white text-sm">{SEVERITY_LABELS[value]}</div>
                  </div>
                </OptionButton>
              ))}
            </motion.div>
          )}

          {step === 'age' && (
            <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <p className="text-slate-400 text-sm">Patient age helps tailor first-aid advice</p>
              <div className="flex items-center gap-4">
                <input type="range" min={1} max={100} value={age} onChange={(event) => setAge(parseInt(event.target.value, 10))} className="flex-1" style={{ accentColor: '#00E5FF' }} />
                <div className="text-3xl font-bold text-white w-16 text-center">{age}</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[5, 12, 25, 40, 60, 75].map((value) => (
                  <button
                    key={value}
                    onClick={() => setAge(value)}
                    className="px-3 py-1 rounded-lg text-xs transition-all"
                    style={age === value ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.4)', color: '#00E5FF' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b' }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <textarea
                value={additionalInfo}
                onChange={(event) => setAdditionalInfo(event.target.value)}
                rows={3}
                placeholder="Additional details, medications, allergies, or context"
                className="w-full rounded-2xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <motion.button
                onClick={consult}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-2xl font-bold text-black text-sm disabled:opacity-50"
                style={{ background: isLoading ? '#334' : 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}
              >
                {isLoading ? 'AI analyzing...' : 'Get AI First Aid Guidance'}
              </motion.button>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <ResultCard result={result} />
              <button onClick={reset} className="w-full py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                Start New Consultation
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-cyan-400" />
              <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Consultation History</span>
            </div>
            <button onClick={loadHistory} className="text-slate-500 hover:text-white text-xs">
              {isHistoryLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {history.length === 0 && (
            <div className="text-xs text-slate-600 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
              No saved consultations yet.
            </div>
          )}

          {history.map((consultation) => (
            <div key={consultation.id} className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <button onClick={() => openConsultation(consultation.id)} className="w-full text-left">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white text-sm font-semibold">{formatLabel(consultation.symptom)}</div>
                    <div className="text-slate-500 text-xs">{consultation.bodyArea} - severity {consultation.severity} - age {consultation.age}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: consultation.urgencyColor, background: `${consultation.urgencyColor}15` }}>
                    {consultation.urgencyLevel.replace('_', ' ')}
                  </span>
                </div>
              </button>
              <div className="flex gap-2">
                <button onClick={() => openConsultation(consultation.id)} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                  <Edit3 size={12} />
                  View/Edit
                </button>
                <button onClick={() => removeConsultation(consultation.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300">
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          ))}

          {selectedConsultation && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.15)' }}>
              <div>
                <div className="text-white text-sm font-bold">{formatLabel(selectedConsultation.symptom)}</div>
                <div className="text-slate-500 text-xs">{new Date(selectedConsultation.createdAt).toLocaleString()}</div>
              </div>
              <textarea
                value={editingInfo}
                onChange={(event) => setEditingInfo(event.target.value)}
                rows={3}
                className="w-full rounded-xl p-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                placeholder="Update additional notes"
              />
              <div className="flex gap-2">
                <button onClick={saveConsultation} className="flex-1 py-2 rounded-xl text-xs font-bold text-black" style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
                  Save
                </button>
                <button onClick={() => setSelectedConsultation(null)} className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
