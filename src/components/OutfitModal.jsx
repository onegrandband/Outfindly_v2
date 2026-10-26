import React, { useEffect, useState } from 'react';
import {
  XIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  ShirtIcon,
  LayersIcon,
  DownloadIcon,
  UsersIcon,
  CalendarIcon,
  CoinsIcon,
} from './Icons.jsx';
import { fetchOutfitDetails, fetchAssetDetails, downloadRobloxImage } from '../services/roblox.js';

export function OutfitModal({
  outfit,
  onClose,
  currentUser,
  onCheckOwnership,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [assetInfoMap, setAssetInfoMap] = useState({});

  useEffect(() => {
    if (!outfit) return;

    setLoading(true);
    setError(null);
    setDetails(null);
    setAssetSearch('');
    setAssetInfoMap({});

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    fetchOutfitDetails(outfit.id)
      .then((data) => {
        setDetails(data);
        setLoading(false);

        // Fetch economy details for all assets
        const assets = data?.assets || [];
        assets.forEach((a) => {
          fetchAssetDetails(a.id).then((info) => {
            setAssetInfoMap((prev) => ({ ...prev, [a.id]: info }));
          });
        });
      })
      .catch((err) => {
        console.error(err);
        setError(err.message || 'Could not load outfit items.');
        setLoading(false);
      });

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [outfit, onClose]);

  if (!outfit) return null;

  const handleCopy = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const cleanName = (outfit.name || `outfit_${outfit.id}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    await downloadRobloxImage(outfit.imageUrl, `${cleanName}.png`);
    setIsDownloading(false);
  };

  const assets = details?.assets || [];
  const filteredAssets = assetSearch.trim()
    ? assets.filter(
        (a) =>
          a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
          a.assetType?.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
          String(a.id).includes(assetSearch.trim())
      )
    : assets;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#12161f] border border-[#2d333b] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#21262d] bg-[#0d1117]/60">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-[#f0f6fc]">
                {outfit.name || 'Character Look'}
              </h2>
              {outfit.isEditable ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                  Player Outfit
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
                  Store Outfit
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e] mt-1 flex-wrap">
              <span>Outfit ID:</span>
              <button
                onClick={() => handleCopy(outfit.id)}
                className="font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
                title="Copy Outfit ID"
              >
                <span>{outfit.id}</span>
                {copiedId === outfit.id ? (
                  <CheckIcon className="w-3 h-3 text-emerald-400" />
                ) : (
                  <CopyIcon className="w-3 h-3 opacity-60" />
                )}
              </button>
              {details?.playerAvatarType && (
                <>
                  <span>•</span>
                  <span>Rig: <strong className="text-[#f0f6fc]">{details.playerAvatarType}</strong></span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onCheckOwnership && (
              <button
                onClick={() => {
                  onCheckOwnership({
                    id: outfit.id,
                    name: outfit.name,
                    category: 'Outfit',
                    imageUrl: outfit.imageUrl,
                    outfitId: outfit.id,
                    outfitName: outfit.name,
                  });
                }}
                className="px-2.5 py-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-sky-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Check which players have or wear this avatar"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                <span>Who Has This?</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
            {/* Left: Render Image & Specs */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square rounded-xl bg-[#0a0d14] border border-[#2d333b] overflow-hidden flex items-center justify-center relative shadow-inner">
                <img
                  src={
                    outfit.imageUrl ||
                    `https://www.roblox.com/outfit-thumbnail/image?userOutfitId=${outfit.id}&width=420&height=420&format=png`
                  }
                  alt={outfit.name}
                  className="w-full h-full object-contain p-2"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src = `https://www.roblox.com/outfit-thumbnail/image?userOutfitId=${outfit.id}&width=420&height=420&format=png`;
                  }}
                />

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="absolute bottom-2 right-2 p-1.5 bg-[#12161f]/90 hover:bg-[#1f2937] border border-[#30363d] rounded-md text-[#8b949e] hover:text-white text-xs transition-colors cursor-pointer"
                  title="Download picture directly"
                >
                  <DownloadIcon className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {/* Character Scale Specs */}
              {details?.scale && (
                <div className="w-full mt-3 p-2.5 rounded-lg bg-[#0d1117] border border-[#21262d] text-[11px] text-[#8b949e] space-y-1">
                  <div className="font-semibold text-[#c9d1d9] mb-1">Character Scale</div>
                  {details.scale.height != null && (
                    <div className="flex justify-between">
                      <span>Height:</span>
                      <span className="font-mono text-[#f0f6fc]">{(details.scale.height * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {details.scale.width != null && (
                    <div className="flex justify-between">
                      <span>Width:</span>
                      <span className="font-mono text-[#f0f6fc]">{(details.scale.width * 100).toFixed(0)}%</span>
                    </div>
                  )}
                  {details.scale.head != null && (
                    <div className="flex justify-between">
                      <span>Head:</span>
                      <span className="font-mono text-[#f0f6fc]">{(details.scale.head * 100).toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: Items / Catalog Assets List */}
            <div className="flex flex-col h-full min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
                  <LayersIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Clothes & Accessories ({assets.length})</span>
                </h4>
              </div>

              {/* Item filter input */}
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search outfit items..."
                className="w-full px-2.5 py-1.5 mb-2.5 bg-[#0d1117] border border-[#2d333b] focus:border-sky-500 rounded-lg text-xs text-[#f0f6fc] placeholder-[#6e7681] outline-none"
              />

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-[#8b949e] bg-[#0d1117] rounded-xl border border-[#21262d] flex-1">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-xs">Finding clothes & hats on this outfit...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs">
                  <span>{error}</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8b949e] bg-[#0d1117] rounded-xl border border-[#21262d] flex-1 flex flex-col items-center justify-center">
                  <ShirtIcon className="w-8 h-8 opacity-30 mb-2" />
                  <span>
                    {assets.length === 0
                      ? 'No items listed for this outfit.'
                      : 'No items match your search.'}
                  </span>
                </div>
              ) : (
                <div className="bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden max-h-[340px] overflow-y-auto divide-y divide-[#1a212e]">
                  {filteredAssets.map((asset) => {
                    const info = assetInfoMap[asset.id];
                    return (
                      <div
                        key={asset.id}
                        className="p-2.5 hover:bg-[#161b22] transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        {/* Item Icon */}
                        <div className="w-9 h-9 rounded-lg bg-[#161b22] border border-[#2d333b] overflow-hidden shrink-0 flex items-center justify-center relative">
                          <img
                            src={`https://www.roblox.com/asset-thumbnail/image?assetId=${asset.id}&width=150&height=150&format=png`}
                            alt={asset.name}
                            className="w-full h-full object-contain p-0.5"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {info?.isLimited && (
                            <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-black text-[7px] font-black text-center">
                              LTD
                            </span>
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-[#f0f6fc] truncate max-w-[200px]" title={asset.name}>
                              {asset.name}
                            </span>
                            {asset.assetType?.name && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                                {asset.assetType.name}
                              </span>
                            )}
                            {info?.isLimited && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                {info.isLimitedUnique ? 'Limited U' : 'Limited'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8b949e] flex-wrap">
                            <span>ID:</span>
                            <button
                              onClick={() => handleCopy(asset.id)}
                              className="font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 cursor-pointer"
                              title="Copy Item ID"
                            >
                              <span>{asset.id}</span>
                              {copiedId === asset.id ? (
                                <CheckIcon className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <CopyIcon className="w-3 h-3 opacity-60" />
                              )}
                            </button>

                            {info?.year && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-0.5 text-[#c9d1d9]">
                                  <CalendarIcon className="w-2.5 h-2.5 text-[#8b949e]" />
                                  <span>{info.year}</span>
                                </span>
                              </>
                            )}

                            <span>•</span>
                            <span className="font-semibold text-emerald-400 inline-flex items-center gap-0.5">
                              <CoinsIcon className="w-2.5 h-2.5" />
                              {info?.price != null ? (
                                info.price === 0 ? 'Free' : `R$ ${Number(info.price).toLocaleString()}`
                              ) : info?.isLimited ? (
                                'Limited'
                              ) : info?.isOffSale ? (
                                'Off Sale'
                              ) : (
                                'Item'
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {onCheckOwnership && (
                            <button
                              onClick={() =>
                                onCheckOwnership({
                                  id: asset.id,
                                  name: asset.name,
                                  category: asset.assetType?.name || 'Accessory',
                                  isOutfit: false,
                                  imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${asset.id}&width=420&height=420&format=png`,
                                  outfitId: outfit.id,
                                  outfitName: outfit.name,
                                })
                              }
                              className="px-2 py-1 text-[11px] font-medium text-sky-400 hover:text-white bg-[#161b22] hover:bg-[#21262d] border border-[#2d333b] rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                              title="Check which players have or wear this"
                            >
                              <UsersIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">Who Has</span>
                            </button>
                          )}

                          <a
                            href={`https://www.roblox.com/catalog/${asset.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-[#8b949e] hover:text-white hover:bg-[#21262d] rounded-md transition-colors"
                            title="View on Roblox"
                          >
                            <ExternalLinkIcon className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between gap-3">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            <span>Download Look</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-lg border border-[#30363d] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
