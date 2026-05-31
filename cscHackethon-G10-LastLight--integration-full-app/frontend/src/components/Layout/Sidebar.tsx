import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle } from 'lucide-react';
import { useStore } from '../../store/useStore';

const TYPE_LABELS: Record<string, string> = {
  earthquake: 'EQ',
  pandemic: 'PA',
  flood: 'FL',
  war: 'WA',
  cyber_attack: 'CY',
  climate: 'CL',
  volcanic: 'VO',
  tsunami: 'TS',
  famine: 'FA',
  nuclear: 'NU',
};

function severityColor(s: number) {
  if (s >= 8) return '#FF3B5C';
  if (s >= 6) return '#FF8C00';
  if (s >= 4) return '#FFC857';
  return '#2EF2A3';
}

export function Sidebar() {
  const { crises, selectCrisis, selectedCrisis } = useStore();
  const sorted = [...crises].sort((a, b) => b.severity - a.severity).slice(0, 8);

  return (
    <motion.div
      className="fixed left-6 top-[76px] bottom-[190px] z-30 hidden w-72 flex-col overflow-hidden rounded-2xl xl:flex"
      style={{
        background: 'rgba(5,8,22,0.82)',
        border: '1px solid rgba(0,229,255,0.18)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 18px 60px rgba(0,0,0,0.34)',
      }}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,229,255,0.12)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-cyan-400" />
          <div className="text-xs text-slate-400 uppercase tracking-widest">Crisis Feed</div>
        </div>
        <div className="mt-1 text-white font-semibold text-sm">{crises.length} events monitored</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2.5 space-y-2">
        <AnimatePresence>
          {sorted.map((crisis, i) => {
            const color = severityColor(crisis.severity);
            return (
              <motion.button
                key={crisis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => selectCrisis(selectedCrisis?.id === crisis.id ? null : crisis)}
                className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:bg-white/5"
                style={
                  selectedCrisis?.id === crisis.id
                    ? { background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.24)' }
                    : { border: '1px solid rgba(255,255,255,0.04)' }
                }
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{ color, background: `${color}16` }}
                  >
                    {TYPE_LABELS[crisis.type] ?? <AlertTriangle size={13} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{crisis.title}</div>
                    <div className="text-slate-500 text-xs truncate">{crisis.location}</div>
                  </div>
                  <div className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ color, background: `${color}18` }}>
                    {crisis.severity.toFixed(1)}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
