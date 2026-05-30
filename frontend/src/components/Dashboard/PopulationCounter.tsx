import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CrisisType } from '../../types/crisis';

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const TYPE_ICONS: Record<CrisisType, string> = {
  earthquake: '🌍', pandemic: '🦠', flood: '🌊', war: '⚔️',
  cyber_attack: '💻', climate: '🌡️', volcanic: '🌋', tsunami: '🌊',
  famine: '🌾', nuclear: '☢️',
};

export function PopulationCounter() {
  const { crises } = useStore();

  const { total, byType } = useMemo(() => {
    const active = crises.filter((c) => c.status === 'active');
    const total = active.reduce((s, c) => s + c.affectedPopulation, 0);
    const typeMap: Record<string, number> = {};
    for (const c of active) {
      typeMap[c.type] = (typeMap[c.type] ?? 0) + c.affectedPopulation;
    }
    const byType = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    return { total, byType };
  }, [crises]);

  return (
    <div className="glass rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(255,59,92,0.08), rgba(5,8,22,0.95))' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)' }}>
          <Users size={12} style={{ color: '#FF3B5C' }} />
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest">Affected Population</div>
      </div>

      <motion.div
        className="font-bold text-white"
        style={{ fontSize: 28, lineHeight: 1 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {formatPop(total)}
      </motion.div>
      <div className="text-xs text-slate-500 mt-0.5">People in Crisis Zones</div>

      {byType.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {byType.map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{TYPE_ICONS[type as CrisisType] ?? '⚠️'}</span>
                <span className="text-xs text-slate-400 capitalize">{type.replace('_', ' ')}</span>
              </div>
              <span className="text-xs font-medium text-white">{formatPop(count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
