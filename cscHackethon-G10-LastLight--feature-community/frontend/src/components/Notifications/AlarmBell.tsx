import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../store/useStore';

function severityColor(s: number) {
  if (s >= 8) return '#FF3B5C';
  if (s >= 6) return '#FF8C00';
  return '#FFC857';
}

export function AlarmBell() {
  const { notifications, dismissNotification, selectCrisis, crises, setActiveTab } = useStore();
  const [open, setOpen] = useState(false);
  const criticalCount = notifications.filter((n) => n.severity >= 7).length;

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl transition-all"
        style={{ background: notifications.length > 0 ? 'rgba(255,59,92,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${notifications.length > 0 ? 'rgba(255,59,92,0.3)' : 'rgba(255,255,255,0.1)'}` }}
        animate={criticalCount > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Bell size={16} className={notifications.length > 0 ? 'text-red-400' : 'text-slate-400'} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold"
            style={{ background: '#FF3B5C', fontSize: '10px' }}>
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-10 z-50 w-80 glass-strong rounded-2xl overflow-hidden"
          >
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-white font-semibold text-sm">Alerts</span>
              <button onClick={() => setOpen(false)}><X size={14} className="text-slate-400" /></button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">No active alerts</div>
            ) : (
              <div className="max-h-80 overflow-y-auto scrollbar-thin">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <AlertTriangle size={14} style={{ color: severityColor(n.severity), marginTop: 2 }} className="flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-xs font-medium truncate">{n.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: severityColor(n.severity) }}>
                        Severity {n.severity.toFixed(1)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => {
                        const c = crises.find((c) => c.id === n.crisisId);
                        if (c) { selectCrisis(c); setActiveTab('globe'); setOpen(false); }
                      }} className="text-cyan-400 text-xs hover:text-cyan-300">View</button>
                      <button onClick={() => dismissNotification(n.id)} className="text-slate-600 hover:text-slate-400 ml-1">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
