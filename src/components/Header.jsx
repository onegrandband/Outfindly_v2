import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shuffle, Sparkles, Shirt, UploadCloud, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AuthModal } from './AuthModal.jsx';

export function Header({ onSelectRandom, isLoading }) {
  const location = useLocation();
  const { user } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isMaker =
    location.pathname.startsWith('/creator') ||
    location.pathname.startsWith('/maker') ||
    location.pathname.startsWith('/avatarmaker') ||
    location.pathname.startsWith('/avatar-maker');

  const isSaver =
    location.pathname.startsWith('/save') ||
    location.pathname.startsWith('/saver');

  const isExplorer = !isMaker && !isSaver;

  return (
    <header className="w-full border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <Link to="/" className="flex items-center gap-3 shrink-0 hover:opacity-95 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-lg">
            <span className="tracking-tighter">RB</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#f0f6fc] leading-tight">
              Roblox Outfits & Avatar Maker
            </h1>
            <p className="text-[11px] text-[#8b949e] hidden sm:block">
              Explore player creations & customize your look
            </p>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {/* Outfits Explorer */}
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isExplorer
                ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Outfits Explorer</span>
            <span className="md:hidden">Outfits</span>
          </Link>

          {/* Avatar Maker */}
          <Link
            to="/creator"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isMaker
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25'
                : 'bg-[#161b22] text-[#00a2ff] hover:bg-[#21262d] border border-[#00a2ff]/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Avatar Maker</span>
            <span className="md:hidden">Maker</span>
          </Link>

          {/* Avatar Saver */}
          <Link
            to="/save"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              isSaver
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'bg-[#161b22] text-purple-300 hover:bg-[#21262d] border border-purple-500/30'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Avatar Saver</span>
            <span className="text-[9px] bg-purple-400/20 text-purple-200 px-1 py-0.2 rounded font-bold ml-0.5">
              /save
            </span>
          </Link>
        </nav>

        {/* Right Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* User Account / Sync status button */}
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 bg-[#161b22] hover:bg-[#21262d] border border-emerald-500/40 rounded-xl text-xs font-semibold text-white transition-colors cursor-pointer"
              title="Cloud Sync Active"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[10px]">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="hidden lg:inline max-w-[100px] truncate">{user.displayName || 'Synced'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] rounded-lg transition-colors cursor-pointer"
              title="Sign in to access saved avatars on any device"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {isExplorer && onSelectRandom && (
            <button
              onClick={onSelectRandom}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] active:scale-95 disabled:opacity-50 border border-[#30363d] rounded-lg transition-all whitespace-nowrap cursor-pointer"
              title="View a random popular player"
            >
              <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Random Player</span>
            </button>
          )}
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
}
