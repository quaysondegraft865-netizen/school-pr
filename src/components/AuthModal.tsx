import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GoogleAuthButton } from './GoogleAuthButton';
import { emailSignIn, emailSignUp, guestClientSignIn } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoogleLogin: () => void;
  isGoogleLoading: boolean;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onGoogleLogin,
  isGoogleLoading,
  onAuthSuccess,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'signin' | 'signup' | 'demo'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const res = await emailSignIn(email, password);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name.');
          setIsLoading(false);
          return;
        }
        const res = await emailSignUp(email, password, displayName);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setErrorMsg('Invalid email or password. You can also use 1-Click Client Demo Access below.');
      } else if (code.includes('email-already-in-use')) {
        setErrorMsg('An account with this email already exists. Please sign in instead.');
      } else if (code.includes('weak-password')) {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantDemoLogin = async (name: string, clientEmail: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await guestClientSignIn(name, clientEmail);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMsg('Demo sign-in failed: ' + err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {mode === 'signin'
                  ? 'Client Login'
                  : mode === 'signup'
                  ? 'Create Client Account'
                  : 'Instant Demo Access'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Log in to authorize NapMeet AI and join meetings.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'signin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'signup' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode('demo'); setErrorMsg(''); }}
            className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
              mode === 'demo' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Quick Demo
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode 1 & 2: Email Password Form & Google OAuth */}
        {mode !== 'demo' ? (
          <div className="space-y-4">
            {/* Google One-Click Auth */}
            <div>
              <GoogleAuthButton
                onClick={onGoogleLogin}
                isLoading={isGoogleLoading}
                text="Continue with Google Account"
                className="w-full !py-2.5 !text-xs !justify-center"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Or with email
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'signup' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Your Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Degraft Quayson"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In as Client' : 'Create Client Account'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Mode 3: Instant Client Demo Profiles */
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Select a pre-configured client profile to test Google Meet AI attendance immediately without entering credentials:
            </p>

            <button
              onClick={() => handleInstantDemoLogin('Degraft Quayson', 'quaysondegraft865@gmail.com')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/20 text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-purple-300">
                  Degraft Quayson (Lead Engineer)
                </div>
                <div className="text-[11px] text-slate-400">quaysondegraft865@gmail.com</div>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded">
                Admin
              </span>
            </button>

            <button
              onClick={() => handleInstantDemoLogin('Elena Rostova', 'elena.rostova@techcloud.io')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-slate-200">
                  Elena Rostova (Lead Designer)
                </div>
                <div className="text-[11px] text-slate-400">elena.rostova@techcloud.io</div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Member
              </span>
            </button>

            <button
              onClick={() => handleInstantDemoLogin('Marcus Vance', 'm.vance@techcloud.io')}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-left transition-all cursor-pointer flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-slate-200">
                  Marcus Vance (DevOps Lead)
                </div>
                <div className="text-[11px] text-slate-400">m.vance@techcloud.io</div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Member
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
