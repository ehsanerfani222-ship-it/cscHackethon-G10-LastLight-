import { useMemo, useRef, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Crisis } from '../../types/crisis';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York as demo center
const MAX_DIST_KM = 5000;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const la1 = (lat1 * Math.PI) / 180;
  const la2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function severityColor(s: number): string {
  if (s >= 8) return '#FF3B5C';
  if (s >= 6) return '#FF8C00';
  if (s >= 4) return '#FFC857';
  return '#2EF2A3';
}

interface PlottedCrisis {
  crisis: Crisis;
  x: number;
  y: number;
  color: string;
}

const SIZE = 220;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 90;

export function ThreatRadar() {
  const { crises, userLocation } = useStore();
  const center = userLocation ?? DEFAULT_CENTER;
  const isDemo = !userLocation;

  const [sweepAngle, setSweepAngle] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      setSweepAngle((elapsed / 4) * 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const plotted: PlottedCrisis[] = useMemo(() => {
    return crises
      .filter((c) => c.status === 'active')
      .slice(0, 20)
      .map((crisis) => {
        const dist = haversineKm(center.lat, center.lng, crisis.lat, crisis.lng);
        const bearing = bearingDeg(center.lat, center.lng, crisis.lat, crisis.lng);
        const frac = Math.min(dist / MAX_DIST_KM, 1);
        const rr = frac * R;
        const angle = ((bearing - 90) * Math.PI) / 180;
        return {
          crisis,
          x: CX + rr * Math.cos(angle),
          y: CY + rr * Math.sin(angle),
          color: severityColor(crisis.severity),
        };
      });
  }, [crises, center]);

  const rings = [0.25, 0.5, 0.75, 1.0];
  const ringLabels = ['1250km', '2500km', '3750km', '5000km'];

  const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;
  const sweepX = CX + R * Math.cos(sweepRad);
  const sweepY = CY + R * Math.sin(sweepRad);

  return (
    <div className="glass rounded-2xl p-3 flex flex-col items-center">
      <div className="text-xs text-slate-500 uppercase tracking-widest mb-2 self-start">Threat Radar</div>
      {isDemo && (
        <div className="text-[10px] text-yellow-400/70 mb-1 self-start">Demo — enable GPS for real data</div>
      )}

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE}>
          {/* Dark background circle */}
          <circle cx={CX} cy={CY} r={R + 4} fill="rgba(0,0,0,0.6)" />

          {/* Concentric rings */}
          {rings.map((frac, i) => (
            <g key={i}>
              <circle
                cx={CX} cy={CY} r={frac * R}
                fill="none"
                stroke="rgba(0,229,255,0.12)"
                strokeWidth={1}
              />
              <text
                x={CX + frac * R + 2}
                y={CY - 2}
                fill="rgba(0,229,255,0.35)"
                fontSize={7}
              >
                {ringLabels[i]}
              </text>
            </g>
          ))}

          {/* Compass cross lines */}
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="rgba(0,229,255,0.1)" strokeWidth={1} strokeDasharray="3 3" />
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="rgba(0,229,255,0.1)" strokeWidth={1} strokeDasharray="3 3" />

          {/* Compass labels */}
          {[['N', CX, CY - R - 8], ['S', CX, CY + R + 12], ['E', CX + R + 8, CY + 4], ['W', CX - R - 8, CY + 4]].map(([l, x, y]) => (
            <text key={l as string} x={x as number} y={y as number} fill="rgba(0,229,255,0.4)" fontSize={8} textAnchor="middle">{l as string}</text>
          ))}

          {/* Sweep sector */}
          <defs>
            <radialGradient id="sweepGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* Sweep wedge (60 degrees) */}
          {(() => {
            const sweepDeg = sweepAngle;
            const startDeg = sweepDeg - 60;
            const s1Rad = ((startDeg - 90) * Math.PI) / 180;
            const s2Rad = ((sweepDeg - 90) * Math.PI) / 180;
            const sx1 = CX + R * Math.cos(s1Rad);
            const sy1 = CY + R * Math.sin(s1Rad);
            const sx2 = CX + R * Math.cos(s2Rad);
            const sy2 = CY + R * Math.sin(s2Rad);
            return (
              <path
                d={`M ${CX} ${CY} L ${sx1} ${sy1} A ${R} ${R} 0 0 1 ${sx2} ${sy2} Z`}
                fill="url(#sweepGrad)"
              />
            );
          })()}

          {/* Sweep line */}
          <line
            x1={CX} y1={CY}
            x2={sweepX} y2={sweepY}
            stroke="#00E5FF"
            strokeWidth={1.5}
            opacity={0.8}
          />

          {/* Crisis blips */}
          {plotted.map(({ crisis, x, y, color }) => (
            <g key={crisis.id}>
              <circle cx={x} cy={y} r={4} fill={color} opacity={0.9}
                style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
              <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          {/* Center user dot */}
          <circle cx={CX} cy={CY} r={4} fill="#00E5FF"
            style={{ filter: 'drop-shadow(0 0 6px #00E5FF)' }} />
          <circle cx={CX} cy={CY} r={2} fill="white" />

          {/* Outer boundary */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth={1.5} />
        </svg>
      </div>

      <div className="text-[10px] text-slate-600 mt-1">{plotted.length} threats detected</div>
    </div>
  );
}
