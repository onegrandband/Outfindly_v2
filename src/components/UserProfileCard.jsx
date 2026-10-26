import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Calendar, Shirt, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveCharacter, setActiveAvatar } from '../services/catalog.js';

export function UserProfileCard({
  user,
  totalOutfits,
  customOutfitsCount,
  onInspectCurrentAvatar,
}) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(user.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEquipPlayerToMaker = () => {
    const charData = {
      id: `char_user_${user.id}_${Date.now()}`,
      name: `${user.displayName}'s Look`,
      baseUser: user,
      playerAvatarType: 'R15',
      previewUrl: user.avatarFullUrl || user.avatarHeadshotUrl,
      equippedItems: [],
    };

    saveCharacter(charData);
    setActiveAvatar(charData);
    navigate('/creator');
  };

  const createdYear = user.created
    ? new Date(user.created).getFullYear()
    : null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 sm:p-5 mb-6 shadow-lg shadow-black/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Avatar Headshot */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#090d13] border-2 border-[#30363d] overflow-hidden shrink-0 shadow-inner">
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
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-medium">
              {customOutfitsCount} outfits
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#8b949e] flex-wrap">
            <span className="text-[#c9d1d9] font-medium">@{user.name}</span>
            <span>·</span>
            <span>ID:</span>
            <button
              onClick={handleCopyId}
              className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title="Copy ID"
            >
              <span>{user.id}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 opacity-70" />
              )}
            </button>
            {createdYear && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {createdYear}
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

      {/* Action Buttons with short words */}
      <div className="flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-[#21262d] shrink-0 flex-wrap">
        <button
          onClick={handleEquipPlayerToMaker}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#00B06F] hover:bg-[#00c57c] rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap"
          title="Open in Avatar Maker"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Wear in Maker</span>
        </button>

        <button
          onClick={onInspectCurrentAvatar}
          className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-lg transition-all cursor-pointer whitespace-nowrap"
        >
          <Shirt className="w-3.5 h-3.5 text-cyan-400" />
          <span>Look</span>
        </button>

        <a
          href={`https://www.roblox.com/users/${user.id}/profile`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#00a2ff] hover:text-[#38bdf8] bg-[#00a2ff]/10 hover:bg-[#00a2ff]/20 border border-[#00a2ff]/30 rounded-lg transition-all whitespace-nowrap"
        >
          <span>Profile</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
