import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Phone, Share2, CheckCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { createPost } from '../../services/api';
import toast from 'react-hot-toast';
import type { Facility } from '../../types/crisis';

const EMERGENCY_NUMBERS = [
  { label: '🌍 International', number: '112' },
  { label: '🇺🇸 US', number: '911' },
  { label: '🇬🇧 UK', number: '999' },
];

export function SosButton() {
  const { facilities, username } = useStore();
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [broadcasting, setBroadcasting] = useState(false);
  const [sent, setSent] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyHelp, setNearbyHelp] = useState<Facility[]>([]);

  const handleClick = () => {
    if (sent) return;
    setShowConfirm(true);
    // Try to get GPS
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  };

  const startBroadcast = useCallback(() => {
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      // Actually broadcast
      const doBroadcast = async () => {
        setBroadcasting(true);
        const lat = userPos?.lat;
        const lng = userPos?.lng;
        const locStr = lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown location';
        try {
          await createPost({
            content: `🆘 SOS EMERGENCY — User at [${locStr}] needs immediate assistance. Sent via LASTLIGHT Emergency System.`,
            type: 'help_request',
            username: username || 'Anonymous',
            location: locStr,
          });
          // Find nearest hospitals & police
          const help = facilities
            .filter((f) => f.type === 'hospital' || f.type === 'police')
            .sort((a, b) => (a.distanceKm ?? 99) - (b.distanceKm ?? 99))
            .slice(0, 3);
          setNearbyHelp(help);
          setSent(true);
          setShowConfirm(false);
          toast.success('SOS broadcast to community!', {
            style: { background: '#FF3B5C', color: 'white' },
          });
        } catch {
          toast.error('Broadcast failed — check connection');
        } finally {
          setBroadcasting(false);
          setCountdown(0);
        }
      };
      doBroadcast();
    } else {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown, userPos, username, facilities]);

  const handleShare = () => {
    const lat = userPos?.lat;
    const lng = userPos?.lng;
    const msg = `🆘 SOS! I need help at: ${lat && lng ? `https://maps.google.com/?q=${lat},${lng}` : 'unknown location'}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(wa, '_blank');
  };

  const cancelCountdown = () => {
    setCountdown(0);
    setBroadcasting(false);
  };

  return (
    <>
      {/* Floating SOS button */}
      <motion.button
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xs"
        style={{
          background: sent ? '#2EF2A3' : 'linear-gradient(135deg, #FF3B5C, #FF0040)',
          boxShadow: sent ? '0 0 20px rgba(46,242,163,0.6)' : '0 0 20px rgba(255,59,92,0.6)',
          border: '2px solid rgba(255,255,255,0.2)',
        }}
        animate={{ scale: [1, 1.05, 1], boxShadow: sent ? undefined : ['0 0 20px rgba(255,59,92,0.6)', '0 0 30px rgba(255,59,92,0.9)', '0 0 20px rgba(255,59,92,0.6)'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        onClick={handleClick}
        title="Emergency SOS"
      >
        {sent ? <CheckCircle size={22} /> : 'SOS'}
      </motion.button>

      {/* Success panel */}
      <AnimatePresence>
        {sent && (
          <motion.div
            className="fixed bottom-36 right-4 z-50 glass-strong rounded-2xl p-4 w-72"
            style={{ border: '1px solid rgba(255,59,92,0.4)' }}
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 20 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-green-400">✅ SOS Broadcast Sent</div>
              <button onClick={() => setSent(false)} className="text-slate-500 hover:text-white">
                <X size={14} />
              </button>
            </div>

            {nearbyHelp.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-slate-500 mb-1.5">Nearest Emergency Services:</div>
                {nearbyHelp.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-xs py-1">
                    <span>{f.type === 'hospital' ? '🏥' : '👮'}</span>
                    <div>
                      <div className="text-white font-medium">{f.name}</div>
                      {f.phone && <div className="text-slate-400">{f.phone}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-3">
              <div className="text-xs text-slate-500 mb-1.5">Emergency Numbers:</div>
              {EMERGENCY_NUMBERS.map(({ label, number }) => (
                <div key={number} className="flex items-center justify-between text-xs py-0.5">
                  <span className="text-slate-400">{label}</span>
                  <a href={`tel:${number}`} className="text-cyan-400 font-bold flex items-center gap-1">
                    <Phone size={10} /> {number}
                  </a>
                </div>
              ))}
            </div>

            <button
              onClick={handleShare}
              className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
            >
              <Share2 size={12} /> Share Location via WhatsApp
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center pb-28 px-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (countdown === 0) setShowConfirm(false); }}
          >
            <motion.div
              className="glass-strong rounded-2xl p-6 w-full max-w-sm"
              style={{ border: '1px solid rgba(255,59,92,0.4)' }}
              initial={{ y: 40, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(255,59,92,0.15)', border: '2px solid rgba(255,59,92,0.5)' }}>
                  <AlertTriangle size={18} style={{ color: '#FF3B5C' }} />
                </div>
                <div>
                  <div className="text-white font-bold">Emergency SOS</div>
                  <div className="text-slate-400 text-xs">Broadcast to LASTLIGHT Community</div>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-4">
                This will post an emergency SOS with your GPS location to the LASTLIGHT community feed.
                Only use in a real emergency.
              </p>

              {userPos && (
                <div className="text-xs text-slate-500 mb-4">
                  📍 Location: {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
                </div>
              )}

              {countdown > 0 ? (
                <div className="flex items-center justify-between">
                  <div className="text-white font-bold text-lg">
                    Broadcasting in <span style={{ color: '#FF3B5C' }}>{countdown}</span>...
                  </div>
                  <button onClick={cancelCountdown}
                    className="px-4 py-2 rounded-xl text-sm border border-slate-600 text-slate-300 hover:bg-white/5">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium border border-slate-700 text-slate-400 hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={startBroadcast}
                    disabled={broadcasting}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #FF3B5C, #FF0040)' }}
                  >
                    {broadcasting ? 'Broadcasting...' : '🆘 BROADCAST SOS'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
