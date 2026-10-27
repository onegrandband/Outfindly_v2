import React, { useEffect } from 'react';
import {
  XIcon,
  CalendarIcon,
  SparklesIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
} from './Icons.jsx';

export function ExactDateModal({ isOpen, onClose, currentUser }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const joinDate = currentUser?.created ? new Date(currentUser.created) : null;

  // Exact formatting
  const formattedUtc = joinDate
    ? joinDate.toUTCString()
    : 'Unknown timestamp';

  const fullDateFormatted = joinDate
    ? new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(joinDate)
    : null;

  const fullTimeFormatted = joinDate
    ? new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
      }).format(joinDate)
    : null;

  // Account Age calculation
  const totalDays = joinDate
    ? Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const years = Math.floor(totalDays / 365.25);
  const remainingDays = Math.floor(totalDays % 365.25);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md my-auto bg-[#12161f] border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative background glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#1f2937] transition-colors cursor-pointer"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* Easter Egg Banner */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-3.5">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Secret Easter Egg Unlocked</span>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            {/* User Profile Overview */}
            <div className="flex items-center gap-3 p-3 bg-[#090d13] border border-[#2d333b] rounded-xl">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500/40 bg-[#12161f] shrink-0">
                <img
                  src={
                    currentUser.avatarHeadshotUrl ||
                    `https://www.roblox.com/headshot-thumbnail/image?userId=${currentUser.id}&width=150&height=150&format=png`
                  }
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-white truncate">
                  {currentUser.displayName}
                </h3>
                <p className="text-xs text-[#8b949e] truncate">
                  @{currentUser.name} • ID: <span className="font-mono text-sky-400">{currentUser.id}</span>
                </p>
              </div>
            </div>

            {/* Exact Date Box */}
            <div className="p-4 bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-amber-500/30 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Exact Join Date
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  {fullDateFormatted || 'Unknown Date'}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider block mb-1">
                  Exact Join Time & Timezone
                </span>
                <p className="text-xs sm:text-sm font-mono text-emerald-400 bg-[#090d13] p-2 rounded-lg border border-[#21262d]">
                  {fullTimeFormatted}
                </p>
                <p className="text-[10px] text-[#8b949e] font-mono mt-1">
                  UTC: {formattedUtc}
                </p>
              </div>

              {/* Total Account Age */}
              <div className="pt-2 border-t border-[#21262d] flex items-center justify-between text-xs">
                <span className="text-[#8b949e]">Account Age:</span>
                <span className="font-bold text-amber-300">
                  {years} years, {remainingDays} days ({totalDays.toLocaleString()} days total)
                </span>
              </div>
            </div>

            <p className="text-[11px] text-center text-[#8b949e]">
              Triggered via <kbd className="px-1.5 py-0.5 rounded bg-[#1e293b] text-sky-300 font-mono text-[10px]">Shift+D</kbd> or searching <span className="text-amber-300 font-semibold">"Exact Date"</span>!
            </p>

            <button
              onClick={onClose}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Awesome!
            </button>
          </div>
        ) : (
          <div className="py-6 text-center space-y-3">
            <CalendarIcon className="w-10 h-10 text-amber-400 mx-auto opacity-70" />
            <h3 className="text-sm font-bold text-white">No Player Currently Loaded</h3>
            <p className="text-xs text-[#8b949e] max-w-xs mx-auto">
              Search any Roblox player above (like <span className="text-sky-400">builderman</span> or <span className="text-sky-400">Shedletsky</span>), then press <kbd className="px-1 py-0.5 rounded bg-[#1e293b] text-sky-300 font-mono text-[10px]">Shift+D</kbd> to inspect their exact join timestamp!
            </p>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
