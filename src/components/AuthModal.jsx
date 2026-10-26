import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { X, Cloud, Smartphone, Laptop, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onLoggedIn }) {
  const { user, signInWithGoogle, signOut, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    clearError();
    try {
      await signInWithGoogle();
      if (onLoggedIn) onLoggedIn();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#12161f] border border-[#30363d] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {user ? 'Account & Cross-Device Sync' : 'Sign In to Sync Avatars'}
            </h3>
            <p className="text-xs text-[#8b949e]">Access all your saved avatars from any device</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#161b22] border border-[#21262d] rounded-xl flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-full border border-cyan-500/30 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-lg">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{user.displayName || 'Roblox Fan'}</p>
                <p className="text-xs text-[#8b949e] truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cloud Sync Active</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-xs text-[#8b949e] space-y-1.5">
              <p className="text-white font-medium">How sync works:</p>
              <p>• All your avatars are saved locally in IndexedDB & LocalStorage for instant offline access.</p>
              <p>• They are also synced securely to your private cloud storage so you can access them from your phone, tablet, or another browser!</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 py-2">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <Smartphone className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-white font-semibold">Access from any device</p>
                  <p className="text-[#8b949e]">Upload an avatar or outfit file on your PC, view it instantly on mobile.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <Laptop className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-white font-semibold">Dual-layer storage</p>
                  <p className="text-[#8b949e]">IndexedDB + LocalStorage for lightning-fast speeds, plus Firebase cloud backups.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-white font-semibold">Private & Safe</p>
                  <p className="text-[#8b949e]">Your avatar collection is tied exclusively to your account.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>

            <p className="text-[11px] text-center text-[#8b949e]">
              Or continue without signing in — your avatars will be stored in your browser's IndexedDB & LocalStorage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
