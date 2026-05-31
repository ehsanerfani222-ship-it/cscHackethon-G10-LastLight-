import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, MapPin, Users, Activity, Shield, Brain, Newspaper, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Crisis } from '../../types/crisis';
import type { NewsItem } from '../../types/news';
import { fetchNews } from '../../services/api';

const TYPE_ICONS: Record<string, string> = {
  earthquake: '🌍', pandemic: '🦠', flood: '🌊', war: '⚔️',
  cyber_attack: '💻', climate: '🌡️', volcanic: '🌋', tsunami: '🌊',
  famine: '🌾', nuclear: '☢️',
};

function severityLabel(s: number) {
  if (s >= 9) return { label: 'CATASTROPHIC', color: '#FF3B5C' };
  if (s >= 7) return { label: 'CRITICAL', color: '#FF6B35' };
  if (s >= 5) return { label: 'HIGH', color: '#FFC857' };
  if (s >= 3) return { label: 'MODERATE', color: '#FFE066' };
  return { label: 'LOW', color: '#2EF2A3' };
}

interface Props {
  crisis: Crisis | null;
  onClose: () => void;
}

export function CrisisModal({ crisis, onClose }: Props) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  useEffect(() => {
    if (!crisis) return;
    setNews([]);
    setNewsLoading(true);
    fetchNews({ location: crisis.location, country: crisis.country, type: crisis.type })
      .then(setNews)
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, [crisis?.id]);

  return (
    <AnimatePresence>
      {crisis && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="pointer-events-auto glass-strong rounded-2xl w-full max-w-md mx-4 mr-6 overflow-hidden"
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="relative p-5" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{TYPE_ICONS[crisis.type] ?? '⚠️'}</span>
                  <div>
                    <h2 className="text-white font-bold text-lg leading-tight">{crisis.title}</h2>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-cyan-400" />
                      <span className="text-cyan-400 text-xs">{crisis.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Severity bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Severity</span>
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: severityLabel(crisis.severity).color }}
                  >
                    {severityLabel(crisis.severity).label} — {crisis.severity.toFixed(1)}/10
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: severityLabel(crisis.severity).color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${crisis.severity * 10}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto scrollbar-thin p-5 space-y-4" style={{ maxHeight: 'calc(85vh - 160px)' }}>
              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.1)' }}>
                  <Users size={14} className="text-cyan-400 mb-1" />
                  <div className="text-white font-semibold text-sm">{crisis.affectedPopulation.toLocaleString()}</div>
                  <div className="text-slate-500 text-xs">Affected</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,59,92,0.05)', border: '1px solid rgba(255,59,92,0.1)' }}>
                  <Activity size={14} className="text-red-400 mb-1" />
                  <div className="text-white font-semibold text-sm capitalize">{crisis.status}</div>
                  <div className="text-slate-500 text-xs">Status</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className="text-yellow-400" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Situation</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{crisis.description}</p>
              </div>

              {/* AI Analysis */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={14} className="text-cyan-400" />
                  <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">AI Analysis</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{crisis.aiAnalysis}</p>
              </div>

              {/* Scientific Data */}
              {Object.keys(crisis.scientificData).length > 0 && (
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Scientific Metrics</span>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {Object.entries(crisis.scientificData).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-slate-400">{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Protocols */}
              {crisis.safetyProtocols.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={14} className="text-green-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Safety Protocols</span>
                  </div>
                  <ul className="space-y-1.5">
                    {crisis.safetyProtocols.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live News */}
              <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Newspaper size={13} className="text-cyan-400" />
                  <span className="text-xs text-cyan-400 uppercase tracking-wider font-semibold">Live News</span>
                  {newsLoading && <Loader2 size={11} className="animate-spin text-slate-500" />}
                </div>
                {newsLoading && <div className="text-xs text-slate-500">Fetching latest news...</div>}
                {!newsLoading && news.length === 0 && <div className="text-xs text-slate-600">No news found.</div>}
                <div className="space-y-2">
                  {news.slice(0, 4).map((item, i) => (
                    <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-start gap-2 group">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-300 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">{item.source}</div>
                      </div>
                      <ExternalLink size={10} className="text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-0.5 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-slate-600 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                Last updated: {new Date(crisis.updatedAt).toLocaleString()}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
