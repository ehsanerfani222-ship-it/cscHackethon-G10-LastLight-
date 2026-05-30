import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, CheckCircle, XCircle, Key, ExternalLink, Loader } from 'lucide-react';
import { getApiKeyStatus, saveApiKey } from '../../services/api';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Status = 'idle' | 'loading' | 'valid' | 'invalid' | 'no_key';

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('loading');
      getApiKeyStatus()
        .then((res) => {
          if (res.hasApiKey && res.isValid) setStatus('valid');
          else if (res.hasApiKey) setStatus('invalid');
          else setStatus('no_key');
        })
        .catch(() => setStatus('no_key'));
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      await saveApiKey(apiKey.trim());
      const check = await getApiKeyStatus();
      if (check.isValid) {
        setStatus('valid');
        setMessage('API key saved and verified successfully!');
      } else {
        setStatus('invalid');
        setMessage('Key saved but validation failed. Check the key and try again.');
      }
    } catch {
      setStatus('invalid');
      setMessage('Failed to save API key. Check your connection.');
    }
  };

  const statusIcon = () => {
    if (status === 'loading') return <Loader size={16} className="animate-spin text-cyan-400" />;
    if (status === 'valid') return <CheckCircle size={16} className="text-green-400" />;
    if (status === 'invalid') return <XCircle size={16} className="text-red-400" />;
    if (status === 'no_key') return <Key size={16} className="text-slate-400" />;
    return null;
  };

  const statusText = () => {
    if (status === 'loading') return 'Checking...';
    if (status === 'valid') return 'API key active and valid';
    if (status === 'invalid') return 'API key invalid or expired';
    if (status === 'no_key') return 'No API key configured';
    return '';
  };

  const statusColor = () => {
    if (status === 'valid') return '#2EF2A3';
    if (status === 'invalid') return '#FF3B5C';
    return '#94a3b8';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }} />

          <motion.div
            className="relative w-full max-w-md overflow-hidden"
            style={{
              background: 'rgba(5,8,22,0.98)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderRadius: '20px',
            }}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.2)' }}>
                  <Key size={14} className="text-cyan-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">AI Settings</div>
                  <div className="text-xs text-slate-500">Anthropic API Key</div>
                </div>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/10 transition-all text-slate-400">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status indicator */}
              <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {statusIcon()}
                <span className="text-sm" style={{ color: statusColor() }}>{statusText()}</span>
              </div>

              {/* What works without API key */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(46,242,163,0.04)', border: '1px solid rgba(46,242,163,0.12)' }}>
                <div className="text-xs font-semibold text-green-400 mb-2">Works without API key</div>
                {['Crisis seed data (12 demo events)', 'Space events (NASA real data)', 'Interactive 3D solar system', 'News feed (RSS sources)', 'Safe zones & facilities map'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle size={10} className="text-green-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* What needs AI */}
              <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.12)' }}>
                <div className="text-xs font-semibold text-cyan-400 mb-2">Requires API key (AI features)</div>
                {['AI Scan — generates real-time crisis events', 'AI Doctor — medical consultations', 'AI-enhanced space event analysis', 'Fallback AI news summaries'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Enter API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-ant-api03-..."
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm font-mono outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(0,229,255,0.2)',
                      color: '#e2e8f0',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Success/Error message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center py-2 px-3 rounded-lg"
                  style={{
                    background: status === 'valid' ? 'rgba(46,242,163,0.08)' : 'rgba(255,59,92,0.08)',
                    color: status === 'valid' ? '#2EF2A3' : '#FF3B5C',
                    border: `1px solid ${status === 'valid' ? 'rgba(46,242,163,0.2)' : 'rgba(255,59,92,0.2)'}`,
                  }}
                >
                  {message}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all flex-1 justify-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
                >
                  <ExternalLink size={11} />
                  Get Free Key
                </a>
                <button
                  onClick={handleSave}
                  disabled={!apiKey.trim() || status === 'loading'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center disabled:opacity-40"
                  style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)', color: '#00E5FF' }}
                >
                  {status === 'loading' ? <Loader size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                  Test & Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
