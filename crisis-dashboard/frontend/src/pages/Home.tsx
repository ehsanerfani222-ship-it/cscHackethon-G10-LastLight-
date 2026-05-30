import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { usePipeline } from '../hooks/usePipeline';
import { useSpaceEvents } from '../hooks/useSpaceEvents';
import { Earth } from '../components/Earth/Earth';
import { MapView } from '../components/Map/MapView';
import { CrisisModal } from '../components/Crisis/CrisisModal';
import { TimelineSlider } from '../components/Timeline/TimelineSlider';
import { Navbar } from '../components/Layout/Navbar';
import { Sidebar } from '../components/Layout/Sidebar';
import { BottomNav } from '../components/Layout/BottomNav';
import { CommunityPanel } from '../components/Community/CommunityPanel';
import { AiDoctorPanel } from '../components/AiDoctor/AiDoctorPanel';
import { SafeZonesPanel } from '../components/SafeZones/SafeZonesPanel';
import { SolarSystem } from '../components/Galaxy/SolarSystem';
import { PlanetEventModal } from '../components/Galaxy/PlanetEventModal';
import { PredictionsPanel } from '../components/Pipeline/PredictionsPanel';
import { GlobalThreatIndex } from '../components/Dashboard/GlobalThreatIndex';
import { PopulationCounter } from '../components/Dashboard/PopulationCounter';
import { SeverityTimeline } from '../components/Dashboard/SeverityTimeline';
import { QuickStats } from '../components/Dashboard/QuickStats';
import { ThreatRadar } from '../components/Radar/ThreatRadar';
import { SosButton } from '../components/SOS/SosButton';

export function Home() {
  const { crises, selectedCrisis, selectCrisis, activeTab, pipelineState } = useStore();

  // Connect to real-time AI pipeline via WebSocket
  usePipeline();

  const { events: spaceEvents } = useSpaceEvents();
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const isGlobeOrMap = activeTab === 'globe' || activeTab === 'map';
  const isSpace = activeTab === 'space';
  const isGlobe = activeTab === 'globe';

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#050816' }}>
      <Toaster position="top-center" toastOptions={{ style: { maxWidth: 420 } }} />
      <Navbar />

      {/* Globe */}
      <AnimatePresence>
        {isGlobe && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Earth crises={crises} onSelectCrisis={selectCrisis} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <AnimatePresence>
        {activeTab === 'map' && (
          <motion.div className="absolute inset-0 pt-11 pb-14" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <MapView onSelectCrisis={selectCrisis} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Space / Solar System */}
      <AnimatePresence>
        {isSpace && (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SolarSystem events={spaceEvents} onSelectPlanet={setSelectedPlanet} />
            <PlanetEventModal planetId={selectedPlanet} onClose={() => setSelectedPlanet(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full panels */}
      <AnimatePresence>
        {!isGlobeOrMap && !isSpace && (
          <motion.div className="absolute inset-0 pt-11 pb-14 overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
            {activeTab === 'community' && <CommunityPanel />}
            {activeTab === 'doctor' && <AiDoctorPanel />}
            {activeTab === 'safezones' && <SafeZonesPanel />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Globe/Map overlays */}
      {isGlobeOrMap && (
        <>
          <Sidebar />
          <PredictionsPanel />
          {isGlobe && <TimelineSlider />}
        </>
      )}

      {/* Globe-specific overlays */}
      {isGlobe && (
        <>
          {/* Top-right: GTI + Population Counter */}
          <motion.div
            className="fixed top-14 right-4 z-30 flex flex-col gap-2"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <GlobalThreatIndex />
            <PopulationCounter />
          </motion.div>

          {/* Bottom area above timeline: QuickStats */}
          <motion.div
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <QuickStats />
          </motion.div>

          {/* Right of sidebar (below crisis list): Severity Timeline */}
          <motion.div
            className="fixed left-4 bottom-20 z-30 w-64"
            style={{ bottom: 88 }}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <SeverityTimeline />
          </motion.div>

          {/* Threat Radar — bottom right area (above SOS) */}
          <motion.div
            className="fixed right-4 z-30"
            style={{ bottom: 80 }}
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <ThreatRadar />
          </motion.div>
        </>
      )}

      {/* Pipeline scanning overlay */}
      <AnimatePresence>
        {(pipelineState.status === 'fetching' || pipelineState.status === 'analyzing') && (
          <motion.div
            className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 glass rounded-full px-5 py-2 flex items-center gap-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <motion.div
              className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            />
            <span className="text-cyan-400 text-xs font-medium">
              {pipelineState.status === 'fetching'
                ? '🛰️ Collecting data from USGS · NASA · GDACS · ReliefWeb · News...'
                : '🤖 Claude AI analyzing global threat patterns...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
      <CrisisModal crisis={selectedCrisis} onClose={() => selectCrisis(null)} />

      {/* SOS Button — always visible */}
      <SosButton />
    </div>
  );
}
