import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Radio, ShieldAlert, MessageCircleWarning, MapPin, UserRound } from 'lucide-react';
import { SosButton } from './components/SOS/SosButton';
import { fetchEmergencyBroadcasts } from './services/api';
import { useEmergencyStore } from './store/useEmergencyStore';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function App() {
  const { username, setUsername, broadcasts, setBroadcasts } = useEmergencyStore();
  const [nameInput, setNameInput] = useState(username);

  useEffect(() => {
    fetchEmergencyBroadcasts().then(setBroadcasts).catch(() => {});
  }, [setBroadcasts]);

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050816' }}>
      <Toaster position="top-center" toastOptions={{ style: { maxWidth: 420 } }} />

      <div className="absolute inset-0 opacity-40" style={{
        background: 'radial-gradient(circle at 20% 15%, rgba(255,59,92,0.22), transparent 34%), radial-gradient(circle at 80% 0%, rgba(0,229,255,0.14), transparent 30%)',
      }} />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-red-300"
              style={{ background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.24)' }}>
              <Radio size={14} /> LASTLIGHT Emergency Communication
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Emergency Communication</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A standalone crisis communication surface for urgent SOS broadcasts, responder visibility,
              emergency numbers, and location sharing during an apocalypse-level incident.
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-3 w-full md:w-80">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <UserRound size={14} /> Identity for outgoing SOS
            </div>
            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value)}
                placeholder="Set username"
                className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={() => setUsername(nameInput.trim())}
                disabled={!nameInput.trim()}
                className="rounded-xl px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                style={{ background: '#00E5FF' }}
              >
                Save
              </button>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            className="glass-strong rounded-3xl p-5 md:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(255,59,92,0.14)', border: '1px solid rgba(255,59,92,0.3)' }}>
                <ShieldAlert className="text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">SOS Broadcast Center</h2>
                <p className="text-xs text-slate-500">Press the SOS button in the bottom-right corner to broadcast.</p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ['1', 'GPS check', 'Attempts to attach your current location.'],
                ['2', '3-second countdown', 'Gives you a chance to cancel accidental presses.'],
                ['3', 'Emergency feed', 'Stores the broadcast for responders or other clients.'],
              ].map(([step, title, copy]) => (
                <div key={step} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-black" style={{ background: '#FFC857' }}>{step}</div>
                  <div className="text-sm font-bold text-white">{title}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.18)' }}>
              <div className="flex items-start gap-3">
                <MessageCircleWarning className="mt-0.5 text-red-300" size={18} />
                <p className="text-sm leading-6 text-slate-300">
                  This standalone app intentionally excludes the Community Channel discussion UI.
                  It keeps only the urgent communication path: SOS broadcast, location sharing, and emergency contact links.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-strong flex min-h-[420px] flex-col rounded-3xl p-5 md:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Recent Emergency Broadcasts</h2>
                <p className="text-xs text-slate-500">Backend persistence for SOS messages only.</p>
              </div>
              <MapPin className="text-cyan-400" size={18} />
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {broadcasts.length === 0 ? (
                <div className="flex h-full min-h-64 items-center justify-center rounded-2xl text-center text-sm text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  No SOS broadcasts yet.
                </div>
              ) : (
                broadcasts.map((broadcast) => (
                  <div key={broadcast.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <img src={broadcast.author.avatar} alt="" className="h-8 w-8 rounded-full bg-slate-700" />
                        <div>
                          <div className="text-sm font-bold text-white">{broadcast.author.username}</div>
                          <div className="text-xs text-slate-500">{timeAgo(broadcast.createdAt)}</div>
                        </div>
                      </div>
                      <span className="rounded-full px-2 py-1 text-xs font-bold text-red-300" style={{ background: 'rgba(255,59,92,0.12)' }}>
                        SOS
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{broadcast.content}</p>
                    {broadcast.location && <div className="mt-2 text-xs text-slate-500">📍 {broadcast.location}</div>}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </section>
      </main>

      <SosButton />
    </div>
  );
}
