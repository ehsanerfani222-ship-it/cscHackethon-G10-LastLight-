import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../../store/useStore';

const LS_KEY = 'lastlight_voice_on';

export function VoiceNarrator() {
  const { crises, pipelineState } = useStore();
  const [enabled, setEnabled] = useState(() => localStorage.getItem(LS_KEY) === 'true');
  const [speaking, setSpeaking] = useState(false);
  const lastCrisisRef = useRef<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9;
    utt.pitch = 0.8;
    utt.volume = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    synthRef.current.speak(utt);
  }, []);

  // Speak top crisis on pipeline update
  useEffect(() => {
    if (!enabled || pipelineState.status !== 'done') return;
    const top = [...crises].filter((c) => c.status === 'active').sort((a, b) => b.severity - a.severity)[0];
    if (!top) return;
    if (lastCrisisRef.current === top.id) return;
    lastCrisisRef.current = top.id;
    const firstSentence = top.description?.split('. ')[0] ?? '';
    speak(
      `LASTLIGHT Alert. ${top.title}. Severity ${top.severity.toFixed(0)}. Location: ${top.location}. ${firstSentence}`
    );
  }, [pipelineState.status, crises, enabled, speak]);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    localStorage.setItem(LS_KEY, next ? 'true' : 'false');
    if (!next && synthRef.current) {
      synthRef.current.cancel();
      setSpeaking(false);
    }
  };

  const bars = [3, 5, 8, 5, 3, 7, 4, 6, 3, 5];

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence>
        {speaking && enabled && (
          <motion.div
            className="flex items-end gap-0.5 h-4"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
          >
            {bars.map((h, i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full"
                style={{ background: '#00E5FF', height: h }}
                animate={{ height: [h, h * 2.5, h] }}
                transition={{ repeat: Infinity, duration: 0.3 + i * 0.05, ease: 'easeInOut' }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggle}
        title={enabled ? 'Disable voice narration' : 'Enable voice narration'}
        className="w-7 h-7 rounded-xl flex items-center justify-center transition-all"
        style={{
          background: enabled ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
          border: enabled ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: enabled ? '#00E5FF' : '#64748b',
        }}
      >
        {enabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
      </button>
    </div>
  );
}
