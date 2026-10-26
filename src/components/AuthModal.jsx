import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  XIcon,
  CloudIcon,
  DeviceIcon,
  CheckIcon,
  ShieldIcon,
  AlertIcon,
} from './Icons.jsx';

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
        className="bg-[#12161f] border border-[#2d333b] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-sky-400">
            <CloudIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {user ? 'Account & Device Sync' : 'Sign In to Access on Any Device'}
            </h3>
            <p className="text-xs text-[#8b949e]">Firebase Cloud + Local IndexedDB</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertIcon className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-[#161b22] border border-[#21262d] rounded-xl flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-11 h-11 rounded-full border border-sky-500/30 object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-sky-950 text-sky-400 font-bold flex items-center justify-center text-base">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user.displayName || 'Roblox Fan'}</p>
                <p className="text-[11px] text-[#8b949e] truncate">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-400">
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>Cloud Sync Active</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-xs text-[#8b949e] space-y-1.5">
              <p className="text-[#c9d1d9] font-medium">Cross-Device Storage Active:</p>
              <p>• Avatars are cached locally in IndexedDB & LocalStorage for instant offline loading.</p>
              <p>• Saved items automatically sync with your private Firebase database so you can access them on your phone, tablet, or PC!</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Done
              </button>
              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2 py-1">
              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <DeviceIcon className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-white font-medium">Access from any device</p>
                  <p className="text-[#8b949e]">Save on your computer, view and download on mobile.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <ShieldIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="text-white font-medium">Fast & Offline Ready</p>
                  <p className="text-[#8b949e]">IndexedDB + LocalStorage keeps all files responsive even when offline.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
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
              <span>{isSubmitting ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <p className="text-[11px] text-center text-[#8b949e]">
              No account required for local use — your files will remain saved in IndexedDB & LocalStorage on this device.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
