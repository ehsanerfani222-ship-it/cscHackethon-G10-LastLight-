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
      className="fixed bottom-[150px] left-1/2 z-40 w-[min(94vw,560px)] -translate-x-1/2 rounded-2xl px-3 py-2.5"
      style={{
        background: 'rgba(5,8,22,0.88)',
        border: '1px solid rgba(0,229,255,0.18)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.36)',
      }}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center gap-2">
        <div className="hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl sm:flex" style={{ background: 'rgba(0,229,255,0.12)', color: '#00E5FF' }}>
          <Calendar size={14} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
          {dates.map((d) => (
            <button
              key={d.value}
              onClick={() => setSelectedDate(d.value)}
              className={`min-w-fit rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                d.value === selectedDate
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              style={d.value === selectedDate ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)' } : { border: '1px solid transparent' }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="ml-1 flex-shrink-0 rounded-lg px-2 py-1 text-xs text-slate-500" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {idx + 1}/{dates.length}
        </div>
      </div>
    </motion.div>
  );
}
