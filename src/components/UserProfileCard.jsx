import React, { useState, useEffect } from 'react';
import {
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  CalendarIcon,
  ShirtIcon,
  CoinsIcon,
  EyeIcon,
} from './Icons.jsx';
import { pushExpandedBiosToCloud } from '../services/accountSync.js';

export function UserProfileCard({
  user,
  totalOutfits,
  customOutfitsCount,
  onInspectCurrentAvatar,
  totalAvatarPrice = null,
}) {
  const [copied, setCopied] = useState(false);

  // Check if this user's bio was previously expanded and saved
  const [isBioExpanded, setIsBioExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('expanded_roblox_bios');
      if (saved) {
        const ids = JSON.parse(saved);
        return Array.isArray(ids) && ids.includes(String(user?.id));
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('expanded_roblox_bios');
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids) && ids.includes(String(user?.id))) {
          setIsBioExpanded(true);
        }
      }
    } catch {}
  }, [user?.id]);

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(user.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBio = (e) => {
    e.stopPropagation();
    const nextState = !isBioExpanded;
    setIsBioExpanded(nextState);

    try {
      const saved = localStorage.getItem('expanded_roblox_bios');
      let ids = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(ids)) ids = [];

      const uidStr = String(user.id);
      if (nextState) {
        if (!ids.includes(uidStr)) ids.push(uidStr);
      } else {
        ids = ids.filter((id) => id !== uidStr);
      }

      localStorage.setItem('expanded_roblox_bios', JSON.stringify(ids));
      pushExpandedBiosToCloud(ids).catch(() => {});
    } catch (err) {
      console.warn('Could not save expanded bio state:', err);
    }
  };

  const createdYear = user.created
    ? new Date(user.created).getFullYear()
    : null;

  const description = (user.description || '').trim();
  const isLongBio = description.length > 70;

  return (
    <div className="bg-[#12161f] border border-[#2d333b] rounded-xl p-4 sm:p-5 mb-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Clickable Avatar Headshot with inspect tooltip */}
        <div
          onClick={onInspectCurrentAvatar}
          className="group/avatar relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#090d13] border-2 border-[#2d333b] hover:border-sky-400 overflow-hidden shrink-0 shadow-inner cursor-pointer transition-all hover:scale-105"
          title="Click to inspect this character's active outfit & clothes"
        >
          <img
            src={
              user.avatarHeadshotUrl ||
              `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`
            }
            alt={`${user.name}'s avatar`}
            className="w-full h-full object-cover group-hover/avatar:opacity-85 transition-opacity"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=150&height=150&format=png`;
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
            <EyeIcon className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-[#f0f6fc] truncate">
              {user.displayName}
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1e293b] border border-[#334155] text-sky-400 font-medium">
              {customOutfitsCount} outfits
            </span>

            {/* Total Robux Value Badge */}
            {totalAvatarPrice !== null && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 inline-flex items-center gap-1 shadow-sm">
                <CoinsIcon className="w-3 h-3" />
                <span>
                  {totalAvatarPrice === 0
                    ? 'Free Outfit'
                    : `Outfit: R$ ${Number(totalAvatarPrice).toLocaleString()}`}
                </span>
              </span>
            )}
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

          {/* Description Bio with clickable ... expand & persistence */}
          {description && (
            <div className="text-xs text-[#8b949e] pt-0.5 max-w-xl">
              {isLongBio && !isBioExpanded ? (
                <p>
                  <span>"{description.slice(0, 68)}"</span>
                  <button
                    onClick={handleToggleBio}
                    className="ml-1 px-1.5 py-0.2 rounded bg-[#1e293b] hover:bg-[#2d3a4f] text-sky-400 hover:text-sky-300 font-bold transition-colors cursor-pointer"
                    title="Click ... to show full bio"
                  >
                    ... (more)
                  </button>
                </p>
              ) : (
                <p>
                  <span>"{description}"</span>
                  {isLongBio && (
                    <button
                      onClick={handleToggleBio}
                      className="ml-1 text-[11px] text-sky-400 hover:text-sky-300 underline cursor-pointer"
                    >
                      (less)
                    </button>
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#21262d] shrink-0 flex-wrap">
        <button
          onClick={onInspectCurrentAvatar}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] bg-[#1f2937] hover:bg-[#374151] border border-[#374151] rounded-lg transition-all cursor-pointer whitespace-nowrap"
          title="Inspect worn clothes and item prices"
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
