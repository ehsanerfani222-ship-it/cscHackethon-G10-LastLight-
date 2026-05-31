import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Globe2, Users } from 'lucide-react';
import { useStore } from '../../store/useStore';

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function CompactStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="min-w-[72px]">
      <div className="text-sm font-bold leading-none" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

export function QuickStats() {
  const { crises } = useStore();

  const stats = useMemo(() => {
    const active = crises.filter((c) => c.status === 'active');
    const critical = active.filter((c) => c.severity >= 8);
    const high = active.filter((c) => c.severity >= 6 && c.severity < 8);
    const watch = active.filter((c) => c.severity < 6);
    const totalPop = active.reduce((s, c) => s + c.affectedPopulation, 0);
    const top = active[0] ?? null;

    return {
      active: active.length,
      critical: critical.length,
      high: high.length,
      watch: watch.length,
      pop: totalPop,
      top,
    };
  }, [crises]);

  const totalSegments = Math.max(1, stats.active);

  return (
    <motion.div
      className="w-[min(92vw,560px)] overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(5,8,22,0.88)',
        border: '1px solid rgba(0,229,255,0.18)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.34)',
      }}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: 'rgba(0,229,255,0.12)', color: '#00E5FF' }}>
            <Globe2 size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <div className="text-white text-xs font-bold uppercase tracking-wide">Global Crisis Record</div>
              {stats.critical > 0 && (
                <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-red-300" style={{ background: 'rgba(255,59,92,0.12)' }}>
                  <AlertTriangle size={10} />
                  {stats.critical}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-slate-500 text-xs truncate">
                {stats.top ? `${stats.top.title} - severity ${stats.top.severity.toFixed(1)}` : 'No active crisis records for this date'}
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-4 sm:flex">
            <CompactStat label="Active" value={stats.active} color="#00E5FF" />
            <CompactStat label="Affected" value={formatPop(stats.pop)} color="#FFC857" />
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 sm:hidden">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Globe2 size={12} className="text-cyan-300" />
            {stats.active} active
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Users size={12} className="text-yellow-300" />
            {formatPop(stats.pop)} affected
          </div>
        </div>

        <div className="mt-2 flex h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ width: `${(stats.critical / totalSegments) * 100}%`, background: '#FF3B5C' }} />
          <div style={{ width: `${(stats.high / totalSegments) * 100}%`, background: '#FFC857' }} />
          <div style={{ width: `${(stats.watch / totalSegments) * 100}%`, background: '#2EF2A3' }} />
        </div>
      </div>
    </motion.div>
  );
}
