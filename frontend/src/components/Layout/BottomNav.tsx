import { motion } from 'framer-motion';
import { Globe, Users, Stethoscope, Shield, Siren, Orbit } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AppTab } from '../../types/crisis';

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'globe',     label: 'Globe',      icon: <Globe size={18} /> },
  { id: 'community', label: 'Community',  icon: <Users size={18} /> },
  { id: 'doctor',    label: 'AI Doctor',  icon: <Stethoscope size={18} /> },
  { id: 'safezones', label: 'Safe Zones', icon: <Shield size={18} /> },
  { id: 'emergency', label: 'Emergency',  icon: <Siren size={18} /> },
  { id: 'space',     label: 'Space',      icon: <Orbit size={18} /> },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-40 glass-strong flex items-center justify-around px-2 py-2"
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 30 }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className="flex flex-col items-center gap-1 px-1.5 sm:px-4 py-1.5 rounded-xl transition-all flex-1 relative min-w-0"
          style={activeTab === tab.id ? { color: '#00E5FF' } : { color: '#475569' }}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="tab-bg"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}
            />
          )}
          <span className="relative z-10">{tab.icon}</span>
          <span className="relative z-10 text-[10px] sm:text-xs font-medium leading-none truncate max-w-full">{tab.label}</span>
        </button>
      ))}
    </motion.div>
  );
}
