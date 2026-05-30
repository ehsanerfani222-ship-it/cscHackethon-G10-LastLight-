import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Zap, Wind, Droplets, Radio, Globe, Orbit, Snowflake, Eye } from 'lucide-react';
import type { SpaceEvent } from '../../types/crisis';
import { fetchSpaceEvents } from '../../services/api';

const PLANET_INFO: Record<string, { name: string; emoji: string; description: string; color: string }> = {
  sun:     { name: 'Sun',     emoji: '☀️',  description: 'Our star — a G-type main-sequence star powering the solar system.', color: '#ffaa00' },
  mercury: { name: 'Mercury', emoji: '🪨',  description: 'Smallest planet, closest to the Sun. No atmosphere, extreme temperature swings.', color: '#9b9b9b' },
  venus:   { name: 'Venus',   emoji: '🌡️', description: 'Hottest planet due to runaway greenhouse effect. Sulfuric acid clouds.', color: '#e8cda0' },
  earth:   { name: 'Earth',   emoji: '🌍',  description: 'Our home world. The only known planet with liquid water and life.', color: '#4fa3e0' },
  mars:    { name: 'Mars',    emoji: '🔴',  description: 'The Red Planet. Thin CO₂ atmosphere, massive dust storms, Olympus Mons.', color: '#c1440e' },
  jupiter: { name: 'Jupiter', emoji: '🪐',  description: 'Largest planet. Great Red Spot storm has raged for centuries.', color: '#c88b3a' },
  saturn:  { name: 'Saturn',  emoji: '💫',  description: 'Known for its spectacular ring system made of ice and rock debris.', color: '#e4d191' },
  uranus:  { name: 'Uranus',  emoji: '🔵',  description: 'Ice giant rotating on its side. Emits almost no internal heat.', color: '#b2e0e8' },
  neptune: { name: 'Neptune', emoji: '🌊',  description: 'Windiest planet with speeds up to 2,400 km/h. Triton orbits retrograde.', color: '#5b73df' },
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  solar_flare:       <Zap size={14} />,
  dust_storm:        <Wind size={14} />,
  acid_storm:        <Droplets size={14} />,
  magnetic_storm:    <Radio size={14} />,
  radiation_surge:   <AlertTriangle size={14} />,
  atmospheric_vortex:<Wind size={14} />,
  ring_disruption:   <Orbit size={14} />,
  ice_storm:         <Snowflake size={14} />,
  dark_spot:         <Eye size={14} />,
};

function severityColor(s: number): string {
  if (s >= 8) return '#FF3B5C';
  if (s >= 6) return '#FF8C00';
  if (s >= 4) return '#FFC857';
  return '#2EF2A3';
}

function severityLabel(s: number): string {
  if (s >= 8) return 'CRITICAL';
  if (s >= 6) return 'HIGH';
  if (s >= 4) return 'MODERATE';
  return 'LOW';
}

function sourceColor(src: string): string {
  if (src === 'NASA DONKI' || src === 'NASA JPL') return 'rgba(0,229,255,0.15)';
  if (src === 'ESA') return 'rgba(100,160,255,0.15)';
  return 'rgba(150,100,255,0.15)';
}

interface PlanetEventModalProps {
  planetId: string | null;
  onClose: () => void;
}

export function PlanetEventModal({ planetId, onClose }: PlanetEventModalProps) {
  const [events, setEvents] = useState<SpaceEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planetId) return;
    setLoading(true);
    fetchSpaceEvents(planetId)
      .then((data: SpaceEvent[]) => setEvents(data))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [planetId]);

  const planet = planetId ? PLANET_INFO[planetId] : null;

  return (
    <AnimatePresence>
      {planetId && planet && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

          <motion.div
            className="relative w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            style={{
              background: 'rgba(5,8,22,0.95)',
              border: `1px solid ${planet.color}33`,
              borderRadius: '20px',
              backdropFilter: 'blur(24px)',
            }}
            initial={{ y: 40, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${planet.color}22` }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{planet.emoji}</span>
                <div>
                  <div className="font-bold text-white text-lg leading-none">{planet.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: planet.color }}>
                    {events.length} active event{events.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                style={{ color: '#94a3b8' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Planet description */}
            <div className="px-5 py-3 text-xs text-slate-400" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {planet.description}
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {loading && (
                <div className="flex justify-center py-8">
                  <motion.div
                    className="w-6 h-6 rounded-full"
                    style={{ border: '2px solid transparent', borderTopColor: planet.color, borderRightColor: planet.color }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  />
                </div>
              )}

              {!loading && events.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <Globe size={24} className="mx-auto mb-2 opacity-30" />
                  No active events detected
                </div>
              )}

              {!loading && events.map((event) => (
                <motion.div
                  key={event.id}
                  className="rounded-xl p-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Type + Severity */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: severityColor(event.severity) }}>
                        {EVENT_ICONS[event.type] ?? <Zap size={14} />}
                      </span>
                      <span className="text-xs font-medium text-slate-300 capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: `${severityColor(event.severity)}22`,
                          color: severityColor(event.severity),
                          border: `1px solid ${severityColor(event.severity)}44`,
                        }}
                      >
                        {severityLabel(event.severity)}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{event.severity.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="font-semibold text-white text-sm mb-1 leading-snug">{event.title}</div>

                  {/* Description */}
                  <div className="text-xs text-slate-400 mb-2 leading-relaxed">{event.description}</div>

                  {/* Scientific data */}
                  {Object.keys(event.scientificData).length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mb-2">
                      {Object.entries(event.scientificData).slice(0, 4).map(([k, v]) => (
                        <div key={k} className="rounded-lg px-2 py-1" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)' }}>
                          <div className="text-xs text-slate-500 leading-none">{k}</div>
                          <div className="text-xs font-mono text-cyan-300">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Earth impact */}
                  {event.earthImpact && (
                    <div className="rounded-lg px-3 py-2 mt-1" style={{ background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.15)' }}>
                      <div className="text-xs text-orange-300 flex items-center gap-1.5">
                        <AlertTriangle size={10} />
                        <span className="font-medium">Earth Impact:</span>
                      </div>
                      <div className="text-xs text-orange-200/70 mt-0.5">{event.earthImpact}</div>
                    </div>
                  )}

                  {/* Data source badge */}
                  <div className="flex justify-end mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: sourceColor(event.dataSource),
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      {event.dataSource}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
