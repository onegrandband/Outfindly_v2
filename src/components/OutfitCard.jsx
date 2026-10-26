import React, { useState } from 'react';
import { Eye, Copy, Check, Sparkles, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { saveCharacter, setActiveAvatar } from '../services/catalog.js';

export function OutfitCard({ outfit, onInspect, currentUser }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(outfit.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEquipToMaker = (e) => {
    e.stopPropagation();

    const charData = {
      id: `char_${outfit.id}_${Date.now()}`,
      name: outfit.name || `${currentUser?.displayName || 'Player'}'s Look`,
      baseUser: currentUser || {
        id: 156,
        name: 'builderman',
        displayName: 'builderman',
      },
      playerAvatarType: 'R15',
      previewUrl: outfit.imageUrl,
      equippedItems: [
        {
          id: outfit.id,
          name: outfit.name || 'Saved Outfit',
          category: 'shirts',
          price: 0,
          imageUrl: outfit.imageUrl,
        },
      ],
    };

    saveCharacter(charData);
    setActiveAvatar(charData);
    navigate('/creator');
  };

  return (
    <div className="group bg-[#161b22] border border-[#30363d] hover:border-[#484f58] rounded-xl p-3 flex flex-col items-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg relative min-w-0">
      {/* Thumbnail Container */}
      <div className="w-full aspect-square rounded-lg bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#30363d]/60 flex items-center justify-center relative overflow-hidden mb-2">
        {outfit.imageUrl && !imgError ? (
          <img
            src={outfit.imageUrl}
            alt={outfit.name || 'Roblox Outfit'}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-[#8b949e] p-3 text-center">
            <ImageOff className="w-6 h-6 opacity-40 mb-1" />
            <span className="text-[10px]">No Picture</span>
          </div>
        )}

        {/* Quick ID Copy Button on hover */}
        <button
          onClick={handleCopyId}
          className="absolute top-1.5 right-1.5 p-1 rounded bg-[#090d13]/80 hover:bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] opacity-0 group-hover:opacity-100 transition-all text-xs"
          title={`Copy ID: ${outfit.id}`}
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>

      {/* Outfit Title */}
      <div className="w-full text-center mb-1 px-1">
        <h3
          className="text-xs font-semibold text-[#f0f6fc] truncate"
          title={outfit.name || 'Untitled Outfit'}
        >
          {outfit.name || 'Untitled Look'}
        </h3>
        <p className="text-[10px] text-[#8b949e] font-mono truncate">
          ID: {outfit.id}
        </p>
      </div>

      {/* Simple Status Badge */}
      <div className="mb-2">
        {outfit.isEditable ? (
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            Created
          </span>
        ) : (
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50">
            Store
          </span>
        )}
      </div>

      {/* Short Action Buttons */}
      <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
        <button
          onClick={() => onInspect(outfit)}
          className="py-1 px-1.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#f0f6fc] hover:text-[#00a2ff] text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
        >
          <Eye className="w-3 h-3 shrink-0" />
          <span className="truncate">Inspect</span>
        </button>

        <button
          onClick={handleEquipToMaker}
          className="py-1 px-1.5 bg-[#00B06F]/20 hover:bg-[#00B06F] border border-[#00B06F]/40 hover:border-[#00B06F] text-[#00c57c] hover:text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
          title="Wear in Avatar Maker"
        >
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">Wear</span>
        </button>
      </div>
    </div>
  );
}
