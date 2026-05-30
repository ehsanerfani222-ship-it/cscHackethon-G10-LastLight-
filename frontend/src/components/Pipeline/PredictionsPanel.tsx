import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, Shield, ChevronRight } from 'lucide-react';
import { useStore } from '../../store/useStore';

const TYPE_ICONS: Record<string, string> = {
  earthquake: '🌍', pandemic: '🦠', flood: '🌊', war: '⚔️',
  cyber_attack: '💻', climate: '🌡️', volcanic: '🌋', tsunami: '🌊',
  famine: '🌾', nuclear: '☢️', solar_storm: '☀️',
};

function probColor(p: number): string {
  if (p >= 0.7) return '#FF3B5C';
  if (p >= 0.5) return '#FF8C00';
  if (p >= 0.3) return '#FFC857';
  return '#2EF2A3';
}

export function PredictionsPanel() {
  const { predictions, pipelineState } = useStore();

  const isScanning = pipelineState.status === 'fetching' || pipelineState.status === 'analyzing';

  return (
    <motion.div
      className="fixed right-4 top-14 z-30 w-72"
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.6 }}
    >
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(0,229,255,0.08)' }}>
          <TrendingUp size={14} className="text-purple-400" />
          <span className="text-white font-semibold text-sm">AI Predictions</span>
          {isScanning && (
            <motion.div className="ml-auto flex items-center gap-1">
              <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} />
              <span className="text-cyan-400 text-xs">Scanning</span>
            </motion.div>
          )}
        </div>

        {/* Pipeline sources */}
        {pipelineState.sourcesUsed.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {pipelineState.sourcesUsed.map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded text-slate-400"
                style={{ background: 'rgba(255,255,255,0.05)' }}>{s}</span>
            ))}
          </div>
        )}

        {/* Predictions */}
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
          {predictions.length === 0 && !isScanning && (
            <div className="text-center py-4 text-slate-600 text-xs">
              {pipelineState.status === 'error' ? (
                <span className="text-red-400">{pipelineState.error}</span>
              ) : 'Add an Anthropic API key to enable AI predictions'}
            </div>
          )}

          <AnimatePresence>
            {predictions.map((pred, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl p-3 space-y-2"
                style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${probColor(pred.probability)}20` }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{TYPE_ICONS[pred.type] ?? '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-semibold leading-snug">{pred.title}</div>
                    <div className="text-slate-500 text-xs mt-0.5">📍 {pred.region}</div>
                  </div>
                </div>

                {/* Probability bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-slate-500">Probability</span>
                    <span className="text-xs font-bold" style={{ color: probColor(pred.probability) }}>
                      {Math.round(pred.probability * 100)}%
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div className="h-full rounded-full"
                      style={{ background: probColor(pred.probability) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pred.probability * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }} />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={10} />
                  <span>Within {pred.timeframe}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{pred.reason}</p>

                <div className="flex items-start gap-1.5 rounded-lg p-2"
                  style={{ background: 'rgba(46,242,163,0.06)', border: '1px solid rgba(46,242,163,0.15)' }}>
                  <Shield size={10} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-green-300">{pred.preparationAdvice}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Last scan */}
        {pipelineState.lastRun && (
          <div className="px-4 py-2 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span className="text-xs text-slate-600">
              Last scan: {new Date(pipelineState.lastRun).toLocaleTimeString()}
              {pipelineState.lastRunDuration && ` (${(pipelineState.lastRunDuration / 1000).toFixed(0)}s)`}
            </span>
            <ChevronRight size={12} className="text-slate-700" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
