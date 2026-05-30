import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';

function getDates(count: number): { value: string; label: string }[] {
  const dates = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    dates.push({ value, label });
  }
  return dates;
}

export function TimelineSlider() {
  const { selectedDate, setSelectedDate } = useStore();
  const dates = useMemo(() => getDates(7), []);
  const idx = dates.findIndex((d) => d.value === selectedDate);

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass rounded-2xl px-5 py-3"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <Calendar size={14} className="text-cyan-400" />
        <div className="flex items-center gap-1">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                d.value === selectedDate
                  ? 'text-white glow-cyan'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={d.value === selectedDate ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)' } : {}}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 ml-2">
          {idx + 1}/{dates.length}
        </div>
      </div>
    </motion.div>
  );
}
