import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useStore } from '../../store/useStore';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayData {
  day: string;
  avg: number;
  max: number;
}

export function SeverityTimeline() {
  const { crises } = useStore();

  const data: DayData[] = useMemo(() => {
    const today = new Date();
    const active = crises.filter((c) => c.status === 'active');
    const avgToday = active.length > 0
      ? active.reduce((s, c) => s + c.severity, 0) / active.length
      : 0;
    const maxToday = active.length > 0 ? Math.max(...active.map((c) => c.severity)) : 0;

    // Seed deterministic mock for past 6 days
    const seed = crises.length;
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dayName = DAY_NAMES[d.getDay()];
      if (i === 6) return { day: 'Today', avg: parseFloat(avgToday.toFixed(1)), max: parseFloat(maxToday.toFixed(1)) };
      const mockAvg = parseFloat((3 + ((seed + i * 3) % 40) / 10).toFixed(1));
      const mockMax = parseFloat((mockAvg + 1 + ((seed + i) % 30) / 10).toFixed(1));
      return { day: dayName, avg: mockAvg, max: Math.min(mockMax, 10) };
    });
  }, [crises]);

  interface TooltipPayload { name: string; value: number; color: string }
  interface CustomTooltipProps { active?: boolean; payload?: TooltipPayload[]; label?: string }

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="glass rounded-xl px-3 py-2 text-xs">
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-slate-300 capitalize">{p.name}:</span>
            <span className="text-white font-bold">{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      className="glass rounded-2xl p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-3">7-Day Severity Trend</div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF3B5C" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#FF3B5C" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="avg" stroke="#00E5FF" strokeWidth={2} fill="url(#avgGrad)" dot={false} name="avg" />
          <Area type="monotone" dataKey="max" stroke="#FF3B5C" strokeWidth={2} fill="url(#maxGrad)" dot={false} name="max" />
          <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 10 }}>{v}</span>} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
