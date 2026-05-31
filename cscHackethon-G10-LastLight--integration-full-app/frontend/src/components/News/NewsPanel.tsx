import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, X, ExternalLink, Clock, Loader2, Radio, Globe } from 'lucide-react';
import type { NewsItem } from '../../types/news';
import type { Crisis } from '../../types/crisis';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CRISIS_TYPE_LABELS: Record<string, string> = {
  earthquake: 'EARTHQUAKE', pandemic: 'PANDEMIC', flood: 'FLOOD', war: 'WAR / CONFLICT',
  cyber_attack: 'CYBER ATTACK', climate: 'CLIMATE', volcanic: 'VOLCANIC', tsunami: 'TSUNAMI',
  famine: 'FAMINE', nuclear: 'NUCLEAR',
};

const CRISIS_TYPE_COLORS: Record<string, string> = {
  earthquake: '#FF8C00', pandemic: '#FF3B5C', flood: '#00E5FF', war: '#FF3B5C',
  cyber_attack: '#7B61FF', climate: '#FFC857', volcanic: '#FF6B35', tsunami: '#00BCD4',
  famine: '#FFC857', nuclear: '#FF0040',
};

export interface NewsContext {
  flag: string;
  countryName: string;
  city: string;
  countryCode: string;
  nearbyCrisis: Crisis | null;
}

interface Props {
  news: NewsItem[];
  isLoading: boolean;
  locationLabel: string;
  newsContext?: NewsContext | null;
  onClose: () => void;
}

export function NewsPanel({ news, isLoading, locationLabel, newsContext, onClose }: Props) {
  const crisis = newsContext?.nearbyCrisis ?? null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-16 left-1/2 z-50 w-full max-w-lg px-3"
        style={{ transform: 'translateX(-50%)' }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      >
        <div className="glass-strong rounded-2xl overflow-hidden" style={{ maxHeight: '65vh' }}>
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.2)' }}>
                <Newspaper size={14} className="text-cyan-400" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm flex items-center gap-1.5">
                  {newsContext?.flag && <span>{newsContext.flag}</span>}
                  {newsContext?.countryName
                    ? <>{newsContext.countryName} — Latest News</>
                    : 'Latest News'}
                </div>
                <div className="text-slate-500 text-xs truncate max-w-[260px]">📍 {locationLabel}</div>
              </div>
              {!isLoading && (
                <div className="flex items-center gap-1 ml-2">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-red-400"
                    animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                  <span className="text-red-400 text-xs">LIVE</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Country context card */}
          {newsContext && !isLoading && (newsContext.countryName || crisis) && (
            <div className="px-4 py-2.5 flex items-center gap-3"
              style={{ background: 'rgba(0,229,255,0.04)', borderBottom: '1px solid rgba(0,229,255,0.07)' }}>
              <Globe size={13} className="text-cyan-400/60 flex-shrink-0" />
              <div className="flex-1 flex items-center gap-2 flex-wrap">
                {newsContext.countryName && (
                  <span className="text-slate-400 text-xs">
                    {newsContext.flag} {newsContext.countryName}
                    {newsContext.city && ` · ${newsContext.city}`}
                  </span>
                )}
                {crisis && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: `${CRISIS_TYPE_COLORS[crisis.type] ?? '#FF3B5C'}18`,
                      color: CRISIS_TYPE_COLORS[crisis.type] ?? '#FF3B5C',
                      border: `1px solid ${CRISIS_TYPE_COLORS[crisis.type] ?? '#FF3B5C'}33`,
                    }}>
                    ⚠ {CRISIS_TYPE_LABELS[crisis.type] ?? crisis.type.toUpperCase()}
                  </span>
                )}
                {crisis && (
                  <span className="text-xs text-slate-500 truncate">{crisis.title}</span>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto scrollbar-thin" style={{ maxHeight: 'calc(65vh - 100px)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <Loader2 size={20} className="animate-spin text-cyan-400" />
                <span className="text-slate-400 text-sm">Fetching live news...</span>
              </div>
            ) : news.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Radio size={28} className="mb-3 opacity-30" />
                <p className="text-sm">No recent news found</p>
                {newsContext?.countryName && (
                  <p className="text-xs mt-1 text-slate-600">for {newsContext.flag} {newsContext.countryName}</p>
                )}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {news.map((item, i) => (
                  <motion.a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/4 transition-colors group block"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                        {item.title}
                      </div>
                      {item.snippet && (
                        <p className="text-slate-500 text-xs mt-1 line-clamp-2">{item.snippet}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                          style={{ background: 'rgba(0,229,255,0.08)', color: '#00E5FF', border: '1px solid rgba(0,229,255,0.15)' }}>
                          {item.source}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock size={10} />
                          {timeAgo(item.publishedAt)}
                        </div>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-600 group-hover:text-cyan-400 flex-shrink-0 mt-1 transition-colors" />
                  </motion.a>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
