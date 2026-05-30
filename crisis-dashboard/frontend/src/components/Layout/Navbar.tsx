import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, Database, Settings, Satellite } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { AlarmBell } from '../Notifications/AlarmBell';
import { ApiKeyModal } from '../Settings/ApiKeyModal';
import { VoiceNarrator } from '../Voice/VoiceNarrator';
import { SurvivalBriefingModal } from '../Briefing/SurvivalBriefingModal';
import { seedData } from '../../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

export function Navbar() {
  const { crises, isLoading, pipelineState, setLoading } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const activeCrises = crises.filter((c) => c.status === 'active').length;

  const isScanning = pipelineState.status === 'fetching' || pipelineState.status === 'analyzing' || pipelineState.status === 'storing';

  const handleScan = async () => {
    try {
      await axios.post('http://localhost:4000/api/pipeline/scan');
    } catch {
      toast.error('Scan failed — is backend running?');
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await seedData();
      toast.success(`Loaded ${res.count} demo events`, {
        style: { background: '#0a1a2e', color: '#2EF2A3', border: '1px solid rgba(46,242,163,0.3)' },
      });
    } catch { toast.error('Seed failed'); }
    finally { setLoading(false); }
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 px-4 py-2.5 flex items-center justify-between"
        style={{ background: 'linear-gradient(to bottom, rgba(5,8,22,0.98), transparent)', backdropFilter: 'blur(8px)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>
            <Radio size={14} className="text-cyan-400" />
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-widest leading-none">LASTLIGHT</div>
            <div className="text-xs text-slate-600 tracking-wider">GLOBAL CRISIS AI</div>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Pipeline status */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {isScanning ? (
              <>
                <motion.div className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }} />
                <span className="text-cyan-400 text-xs font-medium uppercase tracking-wider">
                  {pipelineState.status === 'fetching' ? 'Fetching' : pipelineState.status === 'analyzing' ? 'AI Analyzing' : 'Storing'}
                </span>
              </>
            ) : (
              <>
                <motion.div className="w-1.5 h-1.5 rounded-full bg-red-400"
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                <span className="text-red-400 text-xs font-medium">LIVE</span>
                <span className="text-slate-500 text-xs">{activeCrises} active</span>
              </>
            )}
          </div>

          {/* Voice narration toggle */}
          <VoiceNarrator />

          {/* Today's Briefing button */}
          <button
            onClick={() => setShowBriefing(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: 'rgba(123,97,255,0.1)', border: '1px solid rgba(123,97,255,0.25)', color: '#7B61FF' }}
          >
            📋 Briefing
          </button>

          <AlarmBell />

          <button onClick={() => setShowSettings(true)}
            className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
            style={{ color: '#64748b' }}>
            <Settings size={14} />
          </button>

          <button onClick={handleSeed} disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
            style={{ background: 'rgba(46,242,163,0.1)', border: '1px solid rgba(46,242,163,0.2)', color: '#2EF2A3' }}>
            <Database size={11} /> Demo
          </button>

          <button onClick={handleScan} disabled={isScanning}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
            style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)', color: '#00E5FF' }}>
            <Satellite size={11} />
            {isScanning ? 'Scanning...' : 'AI Scan'}
          </button>
        </div>
      </motion.nav>

      <ApiKeyModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <SurvivalBriefingModal isOpen={showBriefing} onClose={() => setShowBriefing(false)} />
    </>
  );
}
