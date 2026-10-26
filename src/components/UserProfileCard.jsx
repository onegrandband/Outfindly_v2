import React, { useState } from 'react';
import {
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  CalendarIcon,
  ShirtIcon,
} from './Icons.jsx';

export function UserProfileCard({
  user,
  totalOutfits,
  customOutfitsCount,
  onInspectCurrentAvatar,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(user.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createdYear = user.created
    ? new Date(user.created).getFullYear()
    : null;

  return (
    <div className="bg-[#12161f] border border-[#2d333b] rounded-xl p-4 sm:p-5 mb-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Avatar Headshot */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#090d13] border-2 border-[#2d333b] overflow-hidden shrink-0 shadow-inner">
          <img
            src={user.avatarHeadshotUrl || `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`}
            alt={`${user.name}'s avatar`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
            }}
          />
        </div>

        {/* User Info */}
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] truncate">
              {user.displayName}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e293b] border border-[#334155] text-sky-400 font-medium">
              {customOutfitsCount} outfits
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8b949e] flex-wrap">
            <span className="text-[#c9d1d9] font-medium">@{user.name}</span>
            <span>•</span>
            <span>ID:</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 font-mono text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
              title="Copy ID"
            >
              <span>{user.id}</span>
              {copied ? (
                <CheckIcon className="w-3 h-3 text-emerald-400" />
              ) : (
                <CopyIcon className="w-3 h-3 opacity-70" />
              )}
            </button>
            {createdYear && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-[#c9d1d9]">
                  <CalendarIcon className="w-3 h-3 text-[#8b949e]" /> {createdYear}
                </span>
              </>
            )}
          </div>

          {user.description && (
            <p className="text-xs text-[#8b949e] line-clamp-1 max-w-md pt-0.5">
              "{user.description}"
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#21262d] shrink-0 flex-wrap">
        <button
          onClick={onInspectCurrentAvatar}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-lg transition-all cursor-pointer whitespace-nowrap"
        >
          <ShirtIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>Active Look</span>
        </button>

        <a
          href={`https://www.roblox.com/users/${user.id}/profile`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-white bg-[#161b22] hover:bg-[#21262d] border border-[#2d333b] rounded-lg transition-all whitespace-nowrap"
        >
          <span>Roblox Profile</span>
          <ExternalLinkIcon className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
