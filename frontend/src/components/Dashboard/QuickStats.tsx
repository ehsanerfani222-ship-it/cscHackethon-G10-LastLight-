import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store/useStore';

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

interface StatPillProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  delay?: number;
}

function StatPill({ icon, label, value, color = '#00E5FF', delay = 0 }: StatPillProps) {
  return (
    <motion.div
      className="glass rounded-full px-3 py-1.5 flex items-center gap-2 whitespace-nowrap"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <span className="text-sm">{icon}</span>
      <div>
        <div className="text-white font-bold text-xs" style={{ color }}>{value}</div>
        <div className="text-slate-600 text-[10px] leading-none">{label}</div>
      </div>
    </motion.div>
  );
}

export function QuickStats() {
  const { crises, predictions, pipelineState } = useStore();

  const stats = useMemo(() => {
    const active = crises.filter((c) => c.status === 'active');
    const critical = active.filter((c) => c.severity >= 8);
    const totalPop = active.reduce((s, c) => s + c.affectedPopulation, 0);
    return { active: active.length, critical: critical.length, pop: totalPop };
  }, [crises]);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <StatPill icon="🌍" label="Active Crises" value={stats.active} color="#00E5FF" delay={0} />
      <StatPill icon="💀" label="Critical ≥8" value={stats.critical} color="#FF3B5C" delay={0.05} />
      <StatPill icon="👥" label="Affected" value={formatPop(stats.pop)} color="#FFC857" delay={0.1} />
      <StatPill icon="🔮" label="Predictions" value={predictions.length} color="#7B61FF" delay={0.15} />
      <StatPill icon="⚡" label="Last Scan" value={timeAgo(pipelineState.lastRun)} color="#2EF2A3" delay={0.2} />
    </div>
  );
}
