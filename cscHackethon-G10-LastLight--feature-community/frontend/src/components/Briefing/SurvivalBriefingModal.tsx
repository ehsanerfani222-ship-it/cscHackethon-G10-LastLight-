import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCheck, Loader2, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import axios from 'axios';
import toast from 'react-hot-toast';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

interface Props { isOpen: boolean; onClose: () => void; }

export function SurvivalBriefingModal({ isOpen, onClose }: Props) {
  const { crises, predictions, userLocation } = useStore();
  const [text, setText] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);

  const activeCrises = crises.filter((c) => c.status === 'active').sort((a, b) => b.severity - a.severity);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      setText('');
      setDisplayedText('');
      idxRef.current = 0;
      try {
        const { data } = await axios.post('/api/briefing', {
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          crisisIds: activeCrises.slice(0, 10).map((c) => c.id),
          predictionIds: predictions.slice(0, 5).map((_, i) => String(i)),
        });
        setText(data.text ?? generateLocalBriefing());
      } catch {
        setText(generateLocalBriefing());
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typing effect
  useEffect(() => {
    if (!text || loading) return;
    idxRef.current = 0;
    setDisplayedText('');
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      idxRef.current += 2;
      setDisplayedText(text.slice(0, idxRef.current));
      if (idxRef.current >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 12);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [text, loading]);

  function generateLocalBriefing(): string {
    const top3 = activeCrises.slice(0, 3);
    const dateStr = formatDate();
    const count = activeCrises.length;
    const lines: string[] = [
      `${getGreeting()}, OPERATIVE.`,
      `DATE: ${dateStr}`,
      `GLOBAL THREAT STATUS: ${count} active crisis event${count !== 1 ? 's' : ''} monitored.`,
      '',
      '━━━ TOP ACTIVE THREATS ━━━',
      ...top3.map((c, i) =>
        `${i + 1}. [SEV ${c.severity.toFixed(1)}] ${c.title}\n   Location: ${c.location}\n   ${c.description?.split('.')[0] ?? ''}.`
      ),
      '',
      '━━━ 48-HOUR OUTLOOK ━━━',
      ...(predictions.slice(0, 3).map((p) =>
        `▸ ${p.title} — ${p.timeframe} (${Math.round(p.probability * 100)}% probability)\n  ${p.reason}`
      )),
      '',
      '━━━ YOUR ACTION PLAN ━━━',
      '1. Monitor official emergency broadcasts in your region.',
      '2. Ensure emergency kit is stocked: water (3 days), food, first aid, documents.',
      '3. Identify two evacuation routes from your current location.',
      '4. Charge all communication devices and keep power banks ready.',
      '5. Share your location with trusted contacts and check in every 12 hours.',
      '',
      '— LASTLIGHT AI THREAT INTELLIGENCE SYSTEM —',
    ];
    return lines.join('\n');
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success('Briefing copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #050816 0%, #0a1428 100%)',
              border: '1px solid rgba(0,229,255,0.2)',
              boxShadow: '0 0 60px rgba(0,229,255,0.08)',
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(0,229,255,0.03)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.3)' }}>
                  <Shield size={16} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-white tracking-wider" style={{ fontFamily: 'monospace' }}>
                    LASTLIGHT // DAILY BRIEFING
                  </div>
                  <div className="text-slate-500 text-xs">{formatDate()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={loading || !text}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all disabled:opacity-40"
                  style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}
                >
                  {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Export'}
                </button>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6" style={{ fontFamily: 'monospace' }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-6">
                  <div className="relative">
                    <motion.div
                      className="w-16 h-16 rounded-full border-2 border-cyan-400/30"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      style={{ borderTopColor: '#00E5FF' }}
                    />
                    <Loader2 size={20} className="absolute inset-0 m-auto text-cyan-400 animate-spin" />
                  </div>
                  <div>
                    <motion.div
                      className="text-cyan-400 text-sm font-mono text-center tracking-wider"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      ANALYZING GLOBAL THREAT MATRIX...
                    </motion.div>
                    <div className="text-slate-600 text-xs text-center mt-2">
                      Processing {activeCrises.length} active crises
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full"
                        style={{ background: '#00E5FF', height: 4 + (i % 3) * 4 }}
                        animate={{ height: [4, 20, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed"
                  style={{ fontFamily: 'monospace' }}>
                  {displayedText}
                  {displayedText.length < text.length && (
                    <motion.span
                      className="inline-block w-2 h-4 bg-cyan-400 ml-0.5 align-middle"
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                  )}
                </pre>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
