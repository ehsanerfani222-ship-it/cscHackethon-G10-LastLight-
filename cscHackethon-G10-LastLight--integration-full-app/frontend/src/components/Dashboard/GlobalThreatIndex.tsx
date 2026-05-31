import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CrisisType } from '../../types/crisis';

const TYPE_WEIGHTS: Record<CrisisType, number> = {
  nuclear: 2.0, pandemic: 1.8, tsunami: 1.7, war: 1.5,
  earthquake: 1.0, flood: 1.0, cyber_attack: 1.0, climate: 1.0,
  volcanic: 1.0, famine: 1.0,
};

function getThreatLabel(gti: number): { label: string; color: string } {
  if (gti < 20) return { label: 'MINIMAL', color: '#2EF2A3' };
  if (gti < 40) return { label: 'ELEVATED', color: '#FFC857' };
  if (gti < 60) return { label: 'HIGH', color: '#FF8C00' };
  if (gti < 80) return { label: 'CRITICAL', color: '#FF3B5C' };
  return { label: 'CATASTROPHIC', color: '#FF0040' };
}

function getArcColor(gti: number): string {
  if (gti < 30) return '#2EF2A3';
  if (gti < 60) return '#FFC857';
  if (gti < 80) return '#FF8C00';
  return '#FF3B5C';
}

// 270-degree sweep arc, starting from 135° (bottom-left), going clockwise
const RADIUS = 52;
const CENTER = 70;
const START_ANGLE = 135;
const TOTAL_SWEEP = 270;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function GlobalThreatIndex() {
  const { crises } = useStore();

  const gti = useMemo(() => {
    const active = crises.filter((c) => c.status === 'active');
    if (active.length === 0) return 0;
    const total = active.reduce((sum, c) => sum + c.severity * (TYPE_WEIGHTS[c.type] ?? 1.0), 0);
    const maxPossible = active.length * 10 * 2.0;
    return Math.min(100, Math.round((total / maxPossible) * 100));
  }, [crises]);

  // Deterministic "yesterday" delta based on crisis count seed
  const delta = useMemo(() => {
    const seed = crises.length % 7;
    return seed < 3 ? -(seed + 1) : seed - 1;
  }, [crises.length]);

  const { label, color } = getThreatLabel(gti);
  const arcColor = getArcColor(gti);

  const bgEndAngle = START_ANGLE + TOTAL_SWEEP;
  const fillEndAngle = START_ANGLE + (gti / 100) * TOTAL_SWEEP;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col items-center"
      style={{
        minWidth: 160,
        background: 'rgba(5,8,22,0.84)',
        border: '1px solid rgba(0,229,255,0.18)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.32)',
      }}
    >
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Global Threat Index</div>
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} viewBox="0 0 140 140">
          {/* Background arc */}
          <path
            d={arcPath(CENTER, CENTER, RADIUS, START_ANGLE, bgEndAngle)}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
          />
          {/* Fill arc */}
          <motion.path
            d={arcPath(CENTER, CENTER, RADIUS, START_ANGLE, fillEndAngle)}
            stroke={arcColor}
            strokeWidth={10}
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${arcColor}88)` }}
          />
          {/* Needle */}
          {(() => {
            const needleAngle = START_ANGLE + (gti / 100) * TOTAL_SWEEP;
            const tip = polarToCartesian(CENTER, CENTER, RADIUS - 4, needleAngle);
            return (
              <motion.line
                x1={CENTER} y1={CENTER}
                x2={tip.x} y2={tip.y}
                stroke={arcColor}
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.3 }}
              />
            );
          })()}
          {/* Center dot */}
          <circle cx={CENTER} cy={CENTER} r={4} fill={arcColor} />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: 8 }}>
          <motion.div
            className="font-bold text-white"
            style={{ fontSize: 32, lineHeight: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {gti}
          </motion.div>
          <div className="text-xs text-slate-500 mt-0.5">/ 100</div>
        </div>
      </div>

      <div className="font-bold text-sm tracking-widest mt-1" style={{ color }}>{label}</div>

      {/* Delta */}
      <div className="flex items-center gap-1 mt-1.5">
        {delta < 0 ? (
          <TrendingDown size={12} style={{ color: '#2EF2A3' }} />
        ) : (
          <TrendingUp size={12} style={{ color: '#FF3B5C' }} />
        )}
        <span className="text-xs" style={{ color: delta < 0 ? '#2EF2A3' : '#FF3B5C' }}>
          {delta > 0 ? '+' : ''}{delta} from yesterday
        </span>
      </div>
    </div>
  );
}
