import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Shirt,
  Layers,
  Download,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentWearingAvatar } from '../services/roblox.js';
import { saveCharacter, setActiveAvatar } from '../services/catalog.js';

export function CurrentAvatarModal({ user, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    setData(null);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    fetchCurrentWearingAvatar(user.id)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Could not load active clothes.');
        setLoading(false);
      });

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, onClose]);

  if (!user) return null;

  const handleCopy = (id) => {
    navigator.clipboard.writeText(String(id));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEquipInMaker = () => {
    const assets = data?.assets || [];
    const equippedItems = assets.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.assetType?.name?.toLowerCase() || 'accessories',
      price: 0,
      imageUrl: `https://www.roblox.com/asset-thumbnail/image?assetId=${a.id}&width=420&height=420&format=png`,
    }));

    const charData = {
      id: `char_active_${user.id}_${Date.now()}`,
      name: `${user.displayName}'s Active Look`,
      baseUser: user,
      playerAvatarType: data?.playerAvatarType || 'R15',
      previewUrl: data?.imageUrl || user.avatarFullUrl,
      equippedItems,
      scales: data?.scales,
    };

    saveCharacter(charData);
    setActiveAvatar(charData);
    onClose();
    navigate('/creator');
  };

  const assets = data?.assets || [];
  const filtered = search.trim()
    ? assets.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.assetType?.name?.toLowerCase().includes(search.toLowerCase()) ||
          String(a.id).includes(search.trim())
      )
    : assets;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#21262d] bg-[#0d1117]/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#f0f6fc]">
                Active Equipped Clothes
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                Worn Right Now
              </span>
            </div>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Items currently equipped by <span className="text-[#f0f6fc] font-medium">{user.displayName}</span> (@{user.name})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5">
            {/* Left render */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-[#1e2738] to-[#0d1117] border border-[#30363d] overflow-hidden flex items-center justify-center relative shadow-inner">
                {data?.imageUrl || user.avatarFullUrl ? (
                  <img
                    src={data?.imageUrl || user.avatarFullUrl}
                    alt={`${user.name} active avatar`}
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Shirt className="w-16 h-16 text-[#30363d]" />
                )}

                {(data?.imageUrl || user.avatarFullUrl) && (
                  <a
                    href={data?.imageUrl || user.avatarFullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 p-1.5 bg-[#090d13]/80 hover:bg-[#161b22] border border-[#30363d] rounded-md text-[#8b949e] hover:text-[#f0f6fc] text-xs transition-colors"
                    title="Open full picture"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {data?.scales && (
                <div className="w-full mt-3 p-2.5 rounded-lg bg-[#090d13] border border-[#21262d] text-[11px] text-[#8b949e] space-y-1">
                  <div className="font-semibold text-[#c9d1d9] mb-1">Character Size ({data.playerAvatarType})</div>
                  {Object.entries(data.scales).slice(0, 4).map(([key, val]) => (
                    <div key={key} className="flex justify-between">
                      <span className="capitalize">{key}:</span>
                      <span className="font-mono text-[#f0f6fc]">{(Number(val) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right list */}
            <div className="flex flex-col h-full">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5 mb-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Worn Clothes & Hats ({assets.length})</span>
              </h4>

              {assets.length > 5 && (
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter clothes..."
                  className="w-full px-2.5 py-1.5 mb-2 bg-[#090d13] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc] focus:outline-none focus:border-[#00a2ff]"
                />
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center p-12 text-[#8b949e] bg-[#090d13] rounded-xl border border-[#21262d] flex-1">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                  <span className="text-xs">Finding active clothes...</span>
                </div>
              ) : error ? (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8b949e] bg-[#090d13] rounded-xl border border-[#21262d] flex-1 flex flex-col items-center justify-center">
                  <Shirt className="w-8 h-8 opacity-30 mb-2" />
                  <span>No clothes visible or player's inventory is private.</span>
                </div>
              ) : (
                <div className="bg-[#090d13] border border-[#21262d] rounded-xl overflow-hidden max-h-[320px] overflow-y-auto divide-y divide-[#1c2333]">
                  {filtered.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2.5 hover:bg-[#161b22] transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-[#f0f6fc] truncate max-w-[240px]">
                            {asset.name}
                          </span>
                          {asset.assetType?.name && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">
                              {asset.assetType.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8b949e]">
                          <span>Item ID:</span>
                          <button
                            onClick={() => handleCopy(asset.id)}
                            className="font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-0.5"
                            title="Copy Item ID"
                          >
                            <span>{asset.id}</span>
                            {copiedId === asset.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        </div>
                      </div>

                      <a
                        href={`https://www.roblox.com/catalog/${asset.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] font-medium text-cyan-400 hover:text-white bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 rounded-md shrink-0 flex items-center gap-1 transition-all"
                        title="View item on Roblox"
                      >
                        <span>Roblox</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between gap-3">
          <button
            onClick={handleEquipInMaker}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00B06F] hover:bg-[#00c57c] text-white text-xs font-bold rounded-lg shadow transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Wear in Maker</span>
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
