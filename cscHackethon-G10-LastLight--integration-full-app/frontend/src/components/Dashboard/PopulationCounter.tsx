import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { useStore } from '../../store/useStore';

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

const TYPE_LABELS: Record<string, string> = {
  earthquake: 'Earthquake',
  pandemic: 'Pandemic',
  flood: 'Flood',
  war: 'Conflict',
  cyber_attack: 'Cyber',
  climate: 'Climate',
  volcanic: 'Volcanic',
  tsunami: 'Tsunami',
  famine: 'Famine',
  nuclear: 'Nuclear',
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
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, rgba(255,59,92,0.10), rgba(5,8,22,0.88))',
        border: '1px solid rgba(255,59,92,0.18)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.32)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,59,92,0.15)', border: '1px solid rgba(255,59,92,0.3)' }}>
          <Users size={13} style={{ color: '#FF3B5C' }} />
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest">Affected</div>
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
      <div className="text-xs text-slate-500 mt-0.5">People in crisis zones</div>

      {byType.length > 0 && (
        <div className="mt-3 space-y-2">
          {byType.map(([type, count]) => (
            <div key={type}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{TYPE_LABELS[type] ?? type.replace('_', ' ')}</span>
                <span className="font-medium text-white">{formatPop(count)}</span>
              </div>
              <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(6, (count / Math.max(1, total)) * 100)}%`, background: '#FF3B5C' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
