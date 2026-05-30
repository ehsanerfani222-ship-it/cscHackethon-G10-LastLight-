import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LogIn, UserPlus, KeyRound, X, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import toast from 'react-hot-toast';

type AuthView = 'login' | 'register' | 'reset';

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
};

const INPUT_CLASS = 'w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 transition-colors';

interface Props {
  onClose?: () => void;
}

export function AuthModal({ onClose }: Props) {
  const { setUsername } = useStore();
  const [view, setView] = useState<AuthView>('login');

  // Login state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPw, setShowLoginPw] = useState(false);

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBio, setRegBio] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);

  // Reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!loginUsername.trim()) { toast.error('Please enter your username'); return; }
    setIsLoading(true);
    try {
      // In this app auth is username-based; password is stored for UX but not yet
      // verified server-side — a full backend auth layer can be added later.
      setUsername(loginUsername.trim());
      toast.success(`Welcome back, ${loginUsername.trim()}!`);
      onClose?.();
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regUsername.trim()) { toast.error('Please choose a username'); return; }
    if (regUsername.trim().length < 3) { toast.error('Username must be at least 3 characters'); return; }
    setIsLoading(true);
    try {
      setUsername(regUsername.trim());
      toast.success(`Account created! Welcome, ${regUsername.trim()}!`);
      onClose?.();
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetEmail.trim() || !resetEmail.includes('@')) { toast.error('Enter a valid email address'); return; }
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setResetSent(true);
    setIsLoading(false);
  };

  const TAB_STYLE = (active: boolean): React.CSSProperties => active
    ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.35)', color: '#00E5FF' }
    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#475569' };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'rgba(5,8,22,0.98)', border: '1px solid rgba(0,229,255,0.18)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,229,255,0.12)', border: '1px solid rgba(0,229,255,0.25)' }}>
              <Users size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">Crisis Community</div>
              <div className="text-slate-500 text-xs">Join to participate</div>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-4 flex gap-2">
          <button onClick={() => setView('login')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5" style={TAB_STYLE(view === 'login')}>
            <LogIn size={13} /> Login
          </button>
          <button onClick={() => setView('register')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5" style={TAB_STYLE(view === 'register')}>
            <UserPlus size={13} /> Register
          </button>
          <button onClick={() => setView('reset')} className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5" style={TAB_STYLE(view === 'reset')}>
            <KeyRound size={13} /> Reset
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ── Login ── */}
            {view === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                <p className="text-slate-400 text-xs mb-4">Sign in to post, comment, and react to crisis reports.</p>
                <input
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Username"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showLoginPw ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="Password"
                    className={INPUT_CLASS + ' pr-10'}
                    style={INPUT_STYLE}
                  />
                  <button onClick={() => setShowLoginPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  onClick={() => setView('reset')}
                  className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  Forgot password?
                </button>
                <button
                  onClick={handleLogin}
                  disabled={isLoading || !loginUsername.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}
                >
                  <LogIn size={15} />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="text-center text-xs text-slate-500 pt-1">
                  No account?{' '}
                  <button onClick={() => setView('register')} className="text-cyan-400 hover:text-cyan-300 font-medium">
                    Create one
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Register ── */}
            {view === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                <p className="text-slate-400 text-xs mb-4">Create an account to join the crisis coordination community.</p>
                <input
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Choose a username *"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                  autoFocus
                />
                <div className="relative">
                  <input
                    type={showRegPw ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose a password *"
                    className={INPUT_CLASS + ' pr-10'}
                    style={INPUT_STYLE}
                  />
                  <button onClick={() => setShowRegPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showRegPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <input
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Short bio (optional)"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
                <button
                  onClick={handleRegister}
                  disabled={isLoading || !regUsername.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}
                >
                  <UserPlus size={15} />
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </button>
                <p className="text-center text-xs text-slate-500 pt-1">
                  Already have one?{' '}
                  <button onClick={() => setView('login')} className="text-cyan-400 hover:text-cyan-300 font-medium">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Reset password ── */}
            {view === 'reset' && (
              <motion.div key="reset" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                {resetSent ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-3">
                    <CheckCircle size={40} className="mx-auto text-green-400" />
                    <p className="text-white font-semibold text-sm">Reset link sent!</p>
                    <p className="text-slate-400 text-xs">Check your inbox at <span className="text-cyan-400">{resetEmail}</span> for a link to reset your password.</p>
                    <button onClick={() => { setResetSent(false); setView('login'); }}
                      className="flex items-center justify-center gap-2 mx-auto text-xs text-cyan-400 hover:text-cyan-300 transition-colors pt-2">
                      <ArrowLeft size={13} /> Back to login
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <p className="text-slate-400 text-xs mb-4">Enter your email address and we'll send you a link to reset your password.</p>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                      placeholder="Email address"
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                      autoFocus
                    />
                    <button
                      onClick={handleReset}
                      disabled={isLoading || !resetEmail.trim()}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-black disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
                      style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}
                    >
                      <KeyRound size={15} />
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                    <button onClick={() => setView('login')}
                      className="flex items-center justify-center gap-2 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1">
                      <ArrowLeft size={13} /> Back to login
                    </button>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
