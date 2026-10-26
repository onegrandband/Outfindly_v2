import React, { useState } from 'react';
import {
  EyeIcon,
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  ShirtIcon,
  UsersIcon,
} from './Icons.jsx';
import { downloadRobloxImage } from '../services/roblox.js';

export function OutfitCard({
  outfit,
  onInspect,
  currentUser,
  onCheckOwnership,
}) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgSrc, setImgSrc] = useState(outfit.imageUrl);
  const [imgFallbackIndex, setImgFallbackIndex] = useState(0);

  const fallbackUrls = [
    `https://www.roblox.com/outfit-thumbnail/image?userOutfitId=${outfit.id}&width=420&height=420&format=png`,
    `https://thumbnails.roblox.com/v1/users/outfits?userOutfitIds=${outfit.id}&size=150x150&format=Png`,
    currentUser?.avatarStraightUrl,
    currentUser?.avatarFullUrl,
  ].filter(Boolean);

  const handleImageError = () => {
    if (imgFallbackIndex < fallbackUrls.length) {
      setImgSrc(fallbackUrls[imgFallbackIndex]);
      setImgFallbackIndex((prev) => prev + 1);
    }
  };

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(outfit.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    const cleanName = (outfit.name || `outfit_${outfit.id}`)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    await downloadRobloxImage(imgSrc || outfit.imageUrl, `${cleanName}.png`);
    setIsDownloading(false);
  };

  return (
    <div className="group bg-[#12161f] border border-[#2d333b] hover:border-[#4b5563] rounded-xl p-3 flex flex-col items-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg relative min-w-0">
      {/* Thumbnail Container */}
      <div className="w-full aspect-square rounded-lg bg-[#0a0d14] border border-[#21262d] flex items-center justify-center relative overflow-hidden mb-2.5">
        <img
          src={imgSrc || outfit.imageUrl || fallbackUrls[0]}
          alt={outfit.name || 'Roblox Outfit'}
          className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={handleImageError}
        />

        {/* Quick Actions overlay on hover */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Direct Download file from rbxcdn button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-1 rounded-md bg-[#161b22]/90 hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
            title="Download avatar image file"
          >
            <DownloadIcon className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} />
          </button>

          {/* Copy Outfit ID */}
          <button
            onClick={handleCopyId}
            className="p-1 rounded-md bg-[#161b22]/90 hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
            title={`Copy ID: ${outfit.id}`}
          >
            {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Outfit Title & Info */}
      <div className="w-full text-center mb-1.5 px-0.5">
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

      {/* Status Badge */}
      <div className="mb-2.5">
        {outfit.isEditable ? (
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            Player Outfit
          </span>
        ) : (
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/40">
            Store Look
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
        <button
          onClick={() => onInspect(outfit)}
          className="py-1 px-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-[#f0f6fc] text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
        >
          <EyeIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">Inspect</span>
        </button>

        {onCheckOwnership && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckOwnership({
                id: outfit.id,
                name: outfit.name,
                category: 'Outfit',
                imageUrl: imgSrc || outfit.imageUrl,
                outfitId: outfit.id,
                outfitName: outfit.name,
              });
            }}
            className="py-1 px-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-sky-400 hover:text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
            title="Check which players have or wear this avatar"
          >
            <UsersIcon className="w-3 h-3 shrink-0" />
            <span className="truncate">Who Has</span>
          </button>
        )}
      </div>
    </div>
  );
}
