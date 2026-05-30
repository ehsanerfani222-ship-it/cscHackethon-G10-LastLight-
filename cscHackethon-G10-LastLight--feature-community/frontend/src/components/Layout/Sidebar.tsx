import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

const TYPE_ICONS: Record<string, string> = {
  earthquake: '🌍', pandemic: '🦠', flood: '🌊', war: '⚔️',
  cyber_attack: '💻', climate: '🌡️', volcanic: '🌋', tsunami: '🌊',
  famine: '🌾', nuclear: '☢️',
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
      className="fixed left-4 top-16 bottom-20 z-30 w-64 glass rounded-2xl overflow-hidden flex flex-col"
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
        <div className="text-xs text-slate-400 uppercase tracking-widest">Crisis Feed</div>
        <div className="text-white font-semibold text-sm mt-0.5">{crises.length} Events Monitored</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        <AnimatePresence>
          {sorted.map((crisis, i) => (
            <motion.button
              key={crisis.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => selectCrisis(selectedCrisis?.id === crisis.id ? null : crisis)}
              className="w-full text-left rounded-xl p-3 transition-all duration-200 hover:bg-white/5"
              style={
                selectedCrisis?.id === crisis.id
                  ? { background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }
                  : { border: '1px solid transparent' }
              }
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{TYPE_ICONS[crisis.type] ?? '⚠️'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{crisis.title}</div>
                  <div className="text-slate-500 text-xs truncate">{crisis.location}</div>
                </div>
                <div
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ color: severityColor(crisis.severity), background: `${severityColor(crisis.severity)}18` }}
                >
                  {crisis.severity.toFixed(1)}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
