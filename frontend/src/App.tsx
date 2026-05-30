import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  ExternalLink,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  Send,
  Share2,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import { SosButton } from './components/SOS/SosButton';
import { createEmergencyResponse, fetchEmergencyBroadcasts } from './services/api';
import { useEmergencyStore } from './store/useEmergencyStore';
import type { EmergencyBroadcast } from './types/emergency';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getMapsUrl(broadcast: EmergencyBroadcast): string | null {
  if (typeof broadcast.latitude === 'number' && typeof broadcast.longitude === 'number') {
    return `https://maps.google.com/?q=${broadcast.latitude},${broadcast.longitude}`;
  }

  if (broadcast.location) {
    return `https://maps.google.com/?q=${encodeURIComponent(broadcast.location)}`;
  }

  return null;
}

function getLocationLabel(broadcast: EmergencyBroadcast): string {
  if (broadcast.location) return broadcast.location;
  if (typeof broadcast.latitude === 'number' && typeof broadcast.longitude === 'number') {
    return `${broadcast.latitude.toFixed(5)}, ${broadcast.longitude.toFixed(5)}`;
  }
  return 'Unknown location';
}

function hasResponderActivity(broadcast: EmergencyBroadcast): boolean {
  return (broadcast.responses ?? []).length > 0;
}

export default function App() {
  const {
    username,
    setUsername,
    broadcasts,
    setBroadcasts,
    addResponseToBroadcast,
  } = useEmergencyStore();
  const [nameInput, setNameInput] = useState(username);
  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEmergencyBroadcasts().then(setBroadcasts).catch(() => {});
  }, [setBroadcasts]);

  useEffect(() => {
    if (!selectedBroadcastId) return;

    const selectedStillExists = broadcasts.some((broadcast) => broadcast.id === selectedBroadcastId);
    if (!selectedStillExists) {
      setSelectedBroadcastId(null);
      setReplyInput('');
    }
  }, [broadcasts, selectedBroadcastId]);

  const selectedBroadcast = broadcasts.find((broadcast) => broadcast.id === selectedBroadcastId) ?? null;

  const markAcknowledged = (broadcastId: string) => {
    setAcknowledgedIds((current) => {
      if (current.has(broadcastId)) return current;
      const next = new Set(current);
      next.add(broadcastId);
      return next;
    });
  };

  const isBroadcastAcknowledged = (broadcast: EmergencyBroadcast): boolean => {
    return acknowledgedIds.has(broadcast.id) || hasResponderActivity(broadcast);
  };

  const handleSelectBroadcast = (broadcastId: string) => {
    setSelectedBroadcastId(broadcastId);
    setReplyInput('');
  };

  const handleAcknowledge = () => {
    if (!selectedBroadcast) return;
    markAcknowledged(selectedBroadcast.id);
    toast.success('SOS marked as acknowledged.');
  };

  const handleReplyInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setReplyInput(value);

    if (selectedBroadcast && value.trim()) {
      markAcknowledged(selectedBroadcast.id);
    }
  };

  const handleCopyCoordinates = async () => {
    if (!selectedBroadcast) return;
    try {
      await navigator.clipboard.writeText(getLocationLabel(selectedBroadcast));
      toast.success('Coordinates copied.');
    } catch {
      toast.error('Could not copy coordinates.');
    }
  };

  const handleShareLocation = () => {
    if (!selectedBroadcast) return;
    const mapsUrl = getMapsUrl(selectedBroadcast);
    const message = `LASTLIGHT SOS: ${selectedBroadcast.content}\nLocation: ${mapsUrl ?? getLocationLabel(selectedBroadcast)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSendResponse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = replyInput.trim();
    if (!selectedBroadcast || !content) return;

    markAcknowledged(selectedBroadcast.id);
    setSendingReply(true);
    try {
      const response = await createEmergencyResponse(selectedBroadcast.id, {
        content,
        username: username || nameInput.trim() || 'Responder',
      });
      addResponseToBroadcast(selectedBroadcast.id, response);
      setReplyInput('');
      toast.success('Response sent and SOS acknowledged.');
    } catch {
      toast.error('Could not send response. Check that the backend is running.');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: '#050816' }}>
      <Toaster position="top-center" toastOptions={{ style: { maxWidth: 420 } }} />

      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(255,59,92,0.22), transparent 34%), radial-gradient(circle at 80% 0%, rgba(0,229,255,0.14), transparent 30%)',
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 py-6 md:px-8">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div
              className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-red-300"
              style={{ background: 'rgba(255,59,92,0.12)', border: '1px solid rgba(255,59,92,0.24)' }}
            >
              <Radio size={14} /> LASTLIGHT Emergency Communication
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Emergency Communication</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              A standalone crisis communication surface for urgent SOS broadcasts, responder visibility,
              emergency numbers, and location sharing during an apocalypse-level incident.
            </p>
          </div>

          <div className="glass-strong w-full shrink-0 rounded-2xl p-3 md:w-80">
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

        <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <motion.div
            className="glass-strong flex flex-col rounded-3xl p-5 md:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {selectedBroadcast ? (
              <div className="flex flex-col">
                <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="h-9 w-1 rounded-full" style={{ background: '#FF3B5C' }} />
                    <div>
                      <h2 className="text-xl font-bold text-white">Focused SOS Emergency</h2>
                      <p className="text-xs text-slate-500">Chat and responder coordination for the selected broadcast.</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-black text-red-200"
                    style={{ background: 'rgba(255,59,92,0.16)', border: '1px solid rgba(255,59,92,0.25)' }}
                  >
                    ACTIVE SOS
                  </span>
                </div>

                <div
                  className="mb-4 shrink-0 rounded-2xl p-4"
                  style={{ background: 'rgba(255,59,92,0.06)', border: '1px solid rgba(255,59,92,0.22)' }}
                >
                  <div className="mb-3 flex items-start gap-3">
                    <img src={selectedBroadcast.author.avatar} alt="" className="h-10 w-10 rounded-full bg-slate-700" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold text-white">{selectedBroadcast.author.username}</div>
                        <div className="text-xs text-slate-500">{timeAgo(selectedBroadcast.createdAt)}</div>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{selectedBroadcast.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>📍 {getLocationLabel(selectedBroadcast)}</span>
                        {getMapsUrl(selectedBroadcast) && (
                          <a
                            href={getMapsUrl(selectedBroadcast) ?? '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-cyan-300"
                            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.18)' }}
                          >
                            Open in Maps <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-1 overflow-hidden rounded-xl text-xs font-semibold text-slate-300 sm:grid-cols-3"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <button
                      onClick={handleAcknowledge}
                      className="flex items-center justify-center gap-2 px-3 py-2 transition hover:bg-white/5"
                      style={
                        isBroadcastAcknowledged(selectedBroadcast)
                          ? {
                              background: 'rgba(46,242,163,0.14)',
                              color: '#a7f3d0',
                              boxShadow: 'inset 0 0 0 1px rgba(46,242,163,0.22)',
                            }
                          : undefined
                      }
                    >
                      <Check size={14} /> {isBroadcastAcknowledged(selectedBroadcast) ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                    <button
                      onClick={handleShareLocation}
                      className="flex items-center justify-center gap-2 border-y border-white/10 px-3 py-2 transition hover:bg-white/5 sm:border-x sm:border-y-0"
                    >
                      <Share2 size={14} /> Share Location
                    </button>
                    <button
                      onClick={handleCopyCoordinates}
                      className="flex items-center justify-center gap-2 px-3 py-2 transition hover:bg-white/5"
                    >
                      <Copy size={14} /> Copy Coordinates
                    </button>
                  </div>
                </div>

                <div className="flex min-h-[620px] flex-col rounded-2xl border border-white/10 bg-white/[0.025]">
                  <div className="shrink-0 border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <MessageSquare size={14} /> Response thread
                    </div>
                  </div>

                  <div className="min-h-[420px] max-h-[560px] overflow-y-auto px-4 py-3 scrollbar-thin">
                    {(selectedBroadcast.responses ?? []).length === 0 ? (
                      <div className="rounded-xl px-3 py-3 text-xs leading-5 text-slate-500" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        No responder comments yet. Typing a response will automatically mark this SOS as acknowledged.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedBroadcast.responses.map((response) => (
                          <div key={response.id} className="flex gap-2">
                            <img src={response.author.avatar} alt="" className="h-7 w-7 rounded-full bg-slate-700" />
                            <div className="min-w-0 flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-white">{response.author.username}</span>
                                <span className="text-[11px] text-slate-500">{timeAgo(response.createdAt)}</span>
                              </div>
                              <p className="text-xs leading-5 text-slate-300">{response.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendResponse} className="shrink-0 border-t border-white/10 p-3">
                    <div className="flex gap-2">
                      <input
                        value={replyInput}
                        onChange={handleReplyInputChange}
                        placeholder="Write a response..."
                        className="min-w-0 flex-1 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <button
                        type="submit"
                        disabled={!replyInput.trim() || sendingReply}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
                        style={{ background: '#00E5FF' }}
                      >
                        <Send size={14} /> Send
                      </button>
                    </div>
                    {isBroadcastAcknowledged(selectedBroadcast) && (
                      <p className="mt-2 text-xs font-semibold text-emerald-300">Acknowledged — this card will turn green when it is not currently focused.</p>
                    )}
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="mb-5 flex shrink-0 items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(255,59,92,0.14)', border: '1px solid rgba(255,59,92,0.3)' }}
                  >
                    <ShieldAlert className="text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">SOS Broadcast Center</h2>
                    <p className="text-xs text-slate-500">Press the SOS button in the bottom-right corner to broadcast.</p>
                  </div>
                </div>

                <div className="grid shrink-0 gap-3 md:grid-cols-3">
                  {[
                    ['1', 'GPS check', 'Attempts to attach your current location.'],
                    ['2', '3-second countdown', 'Gives you a chance to cancel accidental presses.'],
                    ['3', 'Emergency feed', 'Stores the broadcast for responders or other clients.'],
                  ].map(([step, title, copy]) => (
                    <div
                      key={step}
                      className="rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div
                        className="mb-3 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black text-black"
                        style={{ background: '#FFC857' }}
                      >
                        {step}
                      </div>
                      <div className="text-sm font-bold text-white">{title}</div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{copy}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="mt-5 flex flex-1 items-start gap-3 rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <Navigation className="mt-0.5 text-cyan-300" size={18} />
                  <p className="text-sm leading-6 text-slate-300">
                    Select an emergency broadcast from the right panel to hide this broadcast center and focus the left side into a response chat.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            className="glass-strong flex flex-col rounded-3xl p-5 md:p-7"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="mb-4 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Recent Emergency Broadcasts</h2>
                <p className="text-xs text-slate-500">Click a broadcast to open its focused response thread.</p>
              </div>
              <MapPin className="text-cyan-400" size={18} />
            </div>

            <div className="max-h-[980px] min-h-[560px] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {broadcasts.length === 0 ? (
                <div
                  className="flex h-full min-h-64 items-center justify-center rounded-2xl text-center text-sm text-slate-500"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  No SOS broadcasts yet.
                </div>
              ) : (
                broadcasts.map((broadcast) => {
                  const isSelected = broadcast.id === selectedBroadcastId;
                  const isAcknowledged = isBroadcastAcknowledged(broadcast);
                  const cardState = isSelected ? 'selected' : isAcknowledged ? 'acknowledged' : 'default';
                  const styles = {
                    selected: {
                      background: 'linear-gradient(135deg, rgba(255,59,92,0.16), rgba(255,255,255,0.055))',
                      border: '1px solid rgba(255,59,92,0.88)',
                      boxShadow: '0 0 0 1px rgba(255,59,92,0.2), 0 0 24px rgba(255,59,92,0.24)',
                    },
                    acknowledged: {
                      background: 'linear-gradient(135deg, rgba(46,242,163,0.12), rgba(255,255,255,0.045))',
                      border: '1px solid rgba(46,242,163,0.74)',
                      boxShadow: '0 0 0 1px rgba(46,242,163,0.16), 0 0 22px rgba(46,242,163,0.14)',
                    },
                    default: {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      boxShadow: 'none',
                    },
                  }[cardState];

                  return (
                    <motion.button
                      key={broadcast.id}
                      type="button"
                      onClick={() => handleSelectBroadcast(broadcast.id)}
                      className="w-full rounded-2xl p-4 text-left transition-all"
                      whileHover={{ y: -2 }}
                      style={styles}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <img src={broadcast.author.avatar} alt="" className="h-8 w-8 rounded-full bg-slate-700" />
                          <div>
                            <div className="text-sm font-bold text-white">{broadcast.author.username}</div>
                            <div className="text-xs text-slate-500">{timeAgo(broadcast.createdAt)}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className="rounded-full px-2 py-1 text-xs font-bold"
                            style={{
                              background: isSelected
                                ? 'rgba(255,59,92,0.16)'
                                : isAcknowledged
                                  ? 'rgba(46,242,163,0.14)'
                                  : 'rgba(255,59,92,0.12)',
                              color: isSelected ? '#fecdd3' : isAcknowledged ? '#a7f3d0' : '#fca5a5',
                            }}
                          >
                            SOS
                          </span>
                          {isAcknowledged && !isSelected && (
                            <span className="text-[10px] font-black uppercase tracking-wide text-emerald-300">Acknowledged</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-slate-300">{broadcast.content}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>📍 {getLocationLabel(broadcast)}</span>
                        {(broadcast.responses ?? []).length > 0 && (
                          <span className="inline-flex items-center gap-1 text-cyan-300">
                            <MessageSquare size={12} /> {broadcast.responses.length} response{broadcast.responses.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        </section>
      </main>

      <SosButton />
    </div>
  );
}
