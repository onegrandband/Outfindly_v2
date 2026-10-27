import React, { useState, useEffect } from 'react';
import {
  CopyIcon,
  CheckIcon,
  DownloadIcon,
  ExternalLinkIcon,
  CoinsIcon,
  CalendarIcon,
  UsersIcon,
  ShirtIcon,
} from './Icons.jsx';
import {
  fetchAssetDetails,
  downloadRobloxImage,
  assetThumbnailCache,
  fetchAssetThumbnails,
} from '../services/roblox.js';

export function ItemCard({
  item, // { id, name, category, assetType, imageUrl }
  onCheckOwnership,
}) {
  const [details, setDetails] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    item.imageUrl ||
      assetThumbnailCache.get(Number(item.id)) ||
      `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=420&height=420&format=png`
  );
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    // If not in cache or provided, fetch direct CDN thumbnail
    const idNum = Number(item.id);
    if (!item.imageUrl && !assetThumbnailCache.has(idNum)) {
      fetchAssetThumbnails([idNum]).then((thumbs) => {
        if (thumbs[idNum]) {
          setImgSrc(thumbs[idNum]);
        }
      });
    } else if (item.imageUrl) {
      setImgSrc(item.imageUrl);
    }

    fetchAssetDetails(item.id).then((res) => setDetails(res));
  }, [item.id, item.imageUrl]);

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(item.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    setIsDownloading(true);
    const cleanName = (item.name || `item_${item.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    await downloadRobloxImage(imgSrc, `${cleanName}.png`);
    setIsDownloading(false);
  };

  const handleInspect = () => {
    if (onCheckOwnership) {
      onCheckOwnership({
        id: item.id,
        name: item.name,
        category: item.assetType?.name || item.category || 'Accessory',
        isOutfit: false,
        imageUrl: imgSrc,
      });
    }
  };

  const handleImageError = () => {
    // If direct URL failed, try proxied asset endpoint
    if (!imgSrc.includes('/api/roblox-proxy')) {
      const fallbackUrl = `/api/roblox-proxy?url=${encodeURIComponent(
        `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=420&height=420&format=png`
      )}`;
      setImgSrc(fallbackUrl);
    } else {
      // If even proxy failed (e.g. deleted/moderated asset), show graceful placeholder
      setImgFailed(true);
    }
  };

  return (
    <div
      onClick={handleInspect}
      className="group bg-[#12161f] border border-[#2d333b] hover:border-[#4b5563] rounded-xl p-3 flex flex-col items-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg relative min-w-0 cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="w-full aspect-square rounded-lg bg-[#0a0d14] border border-[#21262d] flex items-center justify-center relative overflow-hidden mb-2.5">
        {!imgFailed ? (
          <img
            src={imgSrc}
            alt={item.name}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 text-center text-[#8b949e]">
            <ShirtIcon className="w-8 h-8 text-sky-400/60 mb-1" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">
              {item.assetType?.name || item.category || 'Roblox Item'}
            </span>
            <span className="text-[9px] text-[#8b949e] font-mono">#{item.id}</span>
          </div>
        )}

        {/* Limited Badge */}
        {details?.isLimited && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black tracking-wider uppercase">
            {details.isLimitedUnique ? 'Limited U' : 'Limited'}
          </span>
        )}

        {/* Quick actions overlay */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="p-1 rounded-md bg-[#161b22]/90 hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
            title="Download item asset image"
          >
            <DownloadIcon className={`w-3 h-3 ${isDownloading ? 'animate-bounce' : ''}`} />
          </button>
          <button
            onClick={handleCopyId}
            className="p-1 rounded-md bg-[#161b22]/90 hover:bg-[#21262d] border border-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
            title={`Copy Item ID: ${item.id}`}
          >
            {copied ? <CheckIcon className="w-3 h-3 text-emerald-400" /> : <CopyIcon className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Item Info */}
      <div className="w-full text-center mb-1 px-0.5">
        <h3 className="text-xs font-semibold text-[#f0f6fc] truncate" title={item.name}>
          {item.name}
        </h3>
        <p className="text-[10px] text-[#8b949e] font-mono truncate">
          ID: {item.id}
        </p>
      </div>

      {/* Meta Bar: Year & Price */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-[#8b949e] mb-2.5 flex-wrap">
        {details?.year && (
          <span className="inline-flex items-center gap-0.5 text-[#c9d1d9]">
            <CalendarIcon className="w-2.5 h-2.5 text-[#8b949e]" />
            <span>{details.year}</span>
          </span>
        )}

        <span className="font-semibold text-emerald-400 inline-flex items-center gap-0.5">
          <CoinsIcon className="w-2.5 h-2.5" />
          {details?.price != null ? (
            details.price === 0 ? 'Free' : `R$ ${Number(details.price).toLocaleString()}`
          ) : details?.isLimited ? (
            'Limited'
          ) : details?.isOffSale ? (
            'Off Sale'
          ) : (
            'Item'
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleInspect();
          }}
          className="py-1 px-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-[#f0f6fc] text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all cursor-pointer truncate"
          title="Check which players wear or own this item"
        >
          <UsersIcon className="w-3 h-3 shrink-0 text-sky-400" />
          <span className="truncate">Who Has</span>
        </button>

        <a
          href={`https://www.roblox.com/catalog/${item.id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="py-1 px-1.5 bg-[#161b22] hover:bg-[#21262d] border border-[#30363d] text-sky-400 hover:text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 transition-all truncate"
          title="View on Roblox Catalog"
        >
          <ExternalLinkIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">Roblox</span>
        </a>
      </div>
    </div>
  );
}
