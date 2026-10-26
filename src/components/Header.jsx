import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShirtIcon, FolderIcon, DeviceIcon } from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthModal } from './AuthModal.jsx';

export function Header() {
  const location = useLocation();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isSaver =
    location.pathname.startsWith('/save') ||
    location.pathname.startsWith('/saver');

  const isExplorer = !isSaver;

  return (
    <header className="w-full border-b border-[#21262d] bg-[#0d1117]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <Link to="/" className="flex items-center gap-3 shrink-0 hover:opacity-95 transition-opacity">
          <div className="w-9 h-9 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            <span>RB</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[#f0f6fc] leading-tight">
              Roblox Outfits & Avatar Saver
            </h1>
            <p className="text-[11px] text-[#8b949e] hidden sm:block">
              Inspect player outfits, items & save avatars across devices
            </p>
          </div>
        </Link>

        {/* Navigation Tabs (Avatar Maker intentionally removed from nav per user request) */}
        <nav className="flex items-center gap-2">
          {/* Outfits Explorer */}
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isExplorer
                ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
            }`}
          >
            <ShirtIcon className="w-3.5 h-3.5 text-sky-400" />
            <span>Outfits Explorer</span>
          </Link>

          {/* Avatar Saver (/save) */}
          <Link
            to="/save"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isSaver
                ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
            }`}
          >
            <FolderIcon className="w-3.5 h-3.5 text-purple-400" />
            <span>Avatar Saver</span>
            <span className="text-[10px] text-purple-300 px-1 py-0.2 rounded bg-purple-950/60 border border-purple-800/40 font-mono">
              /save
            </span>
          </Link>
        </nav>

        {/* Right Action: Cross-Device Auth Account button */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-emerald-500/30 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              title="Cloud Sync Active"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName || 'Synced'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition-colors cursor-pointer"
              title="Sign in to sync your saved avatars across devices"
            >
              <DeviceIcon className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Sign In / Sync</span>
            </button>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
