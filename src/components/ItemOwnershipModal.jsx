import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  XIcon,
  SearchIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  ShirtIcon,
  CoinsIcon,
  CalendarIcon,
  UsersIcon,
  EyeIcon,
} from './Icons.jsx';
import {
  fetchAssetDetails,
  checkPlayerOwnership,
  downloadRobloxImage,
} from '../services/roblox.js';

const NOTABLE_PLAYERS = [
  'builderman',
  'Shedletsky',
  'Linkmon99',
  'Stickmasterluke',
  'KreekCraft',
  'Flamingo',
];

export function ItemOwnershipModal({
  isOpen,
  onClose,
  item, // { id, name, category, imageUrl, outfitId, outfitName, isOutfit }
  currentUser,
  playerItems = [],
  outfits = [],
  onSelectPlayer,
}) {
  const [assetInfo, setAssetInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [playerQuery, setPlayerQuery] = useState('');
  const [checkedPlayers, setCheckedPlayers] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'wears' | 'owns'
  const [playerSearchFilter, setPlayerSearchFilter] = useState('');
  const [copied, setCopied] = useState(false);

  const isOutfit = Boolean(item?.isOutfit || item?.category === 'Outfit');
  const activeCheckRef = useRef(0);

  useEffect(() => {
    if (!isOpen || !item) return;

    const checkId = ++activeCheckRef.current;
    setPlayerQuery('');
    setSearchFeedback('');
    setFilterMode('all');
    setPlayerSearchFilter('');
    setAssetInfo(null);

    const context = { currentUser, playerItems, outfits };

    // 1. Immediately seed the current user (instant, 0ms, 100% reliable)
    const initialList = [];
    if (currentUser?.name) {
      if (isOutfit) {
        initialList.push({
          status: 'owns',
          label: `Saved Outfit: ${item.name || 'Custom Look'}`,
          user: currentUser,
          avatarUrl: item.imageUrl || currentUser.avatarFullUrl,
          outfitName: item.name,
        });
      } else {
        const isWearing = (currentUser.avatarFullUrl && playerItems.some(
          (p) => String(p.id) === String(item.id) && p.source === 'active'
        ));
        const ownsInWardrobe = playerItems.some((p) => String(p.id) === String(item.id));

        initialList.push({
          status: isWearing ? 'wears' : ownsInWardrobe ? 'owns' : 'wears',
          label: isWearing
            ? 'Currently Wearing on Active Avatar'
            : ownsInWardrobe
            ? 'In Player Wardrobe / Outfits'
            : 'Equipped Item',
          user: currentUser,
          avatarUrl: currentUser.avatarFullUrl,
        });
      }
    }

    setCheckedPlayers(initialList);

    // 2. If it's a catalog asset, fetch price/year/limited metadata
    if (!isOutfit && item.id) {
      setLoadingInfo(true);
      fetchAssetDetails(item.id)
        .then((info) => {
          if (activeCheckRef.current === checkId) {
            setAssetInfo(info);
            setLoadingInfo(false);
          }
        })
        .catch(() => {
          if (activeCheckRef.current === checkId) {
            setLoadingInfo(false);
          }
        });
    }

    // 3. Automatically check notable players in parallel without blocking
    const autoCheckNotable = async () => {
      setIsChecking(true);
      const notableToCheck = ['builderman', 'Shedletsky', 'Linkmon99'];

      await Promise.allSettled(
        notableToCheck.map(async (name) => {
          if (currentUser?.name?.toLowerCase() === name.toLowerCase()) return;
          try {
            const res = await checkPlayerOwnership(name, item, context);
            if (res && activeCheckRef.current === checkId) {
              setCheckedPlayers((prev) => {
                if (prev.some((p) => p.user?.name?.toLowerCase() === res.user?.name?.toLowerCase())) {
                  return prev;
                }
                return [...prev, res];
              });
            }
          } catch {
            // Ignore error
          }
        })
      );

      if (activeCheckRef.current === checkId) {
        setIsChecking(false);
      }
    };

    autoCheckNotable();
  }, [isOpen, item, currentUser, playerItems, outfits, isOutfit]);

  if (!isOpen || !item) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(item.id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckUser = async (target) => {
    const q = (target || playerQuery).trim();
    if (!q || isChecking) return;

    setSearchFeedback('');

    // Check if already in list
    const existing = checkedPlayers.find(
      (p) =>
        p.user?.name?.toLowerCase() === q.toLowerCase() ||
        String(p.user?.id) === q
    );
    if (existing) {
      setSearchFeedback(`@${existing.user?.name} is already in the list (${existing.label})`);
      setPlayerQuery('');
      return;
    }

    setIsChecking(true);
    const context = { currentUser, playerItems, outfits };

    try {
      const result = await checkPlayerOwnership(q, item, context);
      if (result) {
        setCheckedPlayers((prev) => [result, ...prev]);
        setSearchFeedback(`Found @${result.user.name}: ${result.label}`);
      } else {
        setSearchFeedback(`Could not find Roblox player matching "${q}"`);
      }
    } catch {
      setSearchFeedback(`Could not verify player "${q}". Please check spelling.`);
    } finally {
      setPlayerQuery('');
      setIsChecking(false);
    }
  };

  const filteredPlayers = checkedPlayers
    .filter((p) => {
      if (filterMode === 'wears' && p.status !== 'wears') return false;
      if (filterMode === 'owns' && p.status !== 'owns') return false;
      if (playerSearchFilter.trim()) {
        const query = playerSearchFilter.toLowerCase();
        const matchesName = p.user?.name?.toLowerCase().includes(query);
        const matchesDisplay = p.user?.displayName?.toLowerCase().includes(query);
        if (!matchesName && !matchesDisplay) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Prioritize Wears > Owns > None
      const weight = { wears: 3, owns: 2, none: 1 };
      return (weight[b.status] || 0) - (weight[a.status] || 0);
    });

  const wearsCount = checkedPlayers.filter((p) => p.status === 'wears').length;
  const ownsCount = checkedPlayers.filter((p) => p.status === 'owns').length;

  const headerImageUrl =
    item.imageUrl ||
    (isOutfit
      ? `https://www.roblox.com/outfit-thumbnail/image?userOutfitId=${item.id}&width=420&height=420&format=png`
      : `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=150&height=150&format=png`);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#12161f] border border-[#30363d] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#21262d] bg-[#0d1117]/60">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl bg-[#1c2128] border border-[#30363d] overflow-hidden flex items-center justify-center shrink-0 relative">
              <img
                src={headerImageUrl}
                alt={item.name}
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  if (!isOutfit) {
                    e.currentTarget.src = `https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=150&height=150&format=png`;
                  }
                }}
              />
              {assetInfo?.isLimited && (
                <span className="absolute bottom-0 inset-x-0 bg-amber-500 text-black text-[8px] font-black tracking-widest text-center py-0.2 uppercase">
                  Limited
                </span>
              )}
            </div>

            {/* Details */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {item.name || (isOutfit ? 'Saved Outfit Look' : 'Roblox Item')}
                </h3>
                {isOutfit && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    OUTFIT LOOK
                  </span>
                )}
                {assetInfo?.isLimited && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                    {assetInfo.isLimitedUnique ? 'LIMITED U' : 'LIMITED'}
                  </span>
                )}
              </div>

              {/* Sub-bar */}
              <div className="flex items-center gap-2 text-xs text-[#8b949e] flex-wrap mt-1">
                <span className="capitalize">
                  {isOutfit ? 'Avatar Outfit' : item.category || 'Accessory'}
                </span>
                <span>•</span>
                <span>ID:</span>
                <button
                  onClick={handleCopyId}
                  className="font-mono text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
                  title="Copy ID"
                >
                  <span>{item.id}</span>
                  {copied ? (
                    <CheckIcon className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <CopyIcon className="w-3 h-3 opacity-60" />
                  )}
                </button>

                {!isOutfit && assetInfo?.year && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-[#c9d1d9]">
                      <CalendarIcon className="w-3 h-3 text-[#8b949e]" />
                      <span>Year {assetInfo.year}</span>
                    </span>
                  </>
                )}

                {!isOutfit && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400 inline-flex items-center gap-1">
                      <CoinsIcon className="w-3 h-3" />
                      {assetInfo?.price != null ? (
                        assetInfo.price === 0 ? (
                          'Free'
                        ) : (
                          `R$ ${Number(assetInfo.price).toLocaleString()}`
                        )
                      ) : assetInfo?.isLimited ? (
                        'Limited'
                      ) : assetInfo?.isOffSale ? (
                        'Off Sale'
                      ) : (
                        'Catalog Item'
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isOutfit && (
              <a
                href={`https://www.roblox.com/catalog/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-[#8b949e] hover:text-sky-400 hover:bg-[#21262d] transition-colors"
                title="Open on Roblox Catalog"
              >
                <ExternalLinkIcon className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#21262d] transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Player Search & Checker Section */}
          <div className="p-4 bg-[#161b22] border border-[#21262d] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-sky-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Check Player Ownership & Worn Status
                </h4>
              </div>
              <span className="text-[11px] text-[#8b949e]">
                Search any player to check if they wear or own this
              </span>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckUser();
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <SearchIcon className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playerQuery}
                  onChange={(e) => setPlayerQuery(e.target.value)}
                  placeholder="Enter Roblox username or ID (e.g. builderman, 156)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] focus:border-sky-500 rounded-lg text-xs text-white placeholder-[#6e7681] outline-none"
                  disabled={isChecking}
                />
              </div>

              <button
                type="submit"
                disabled={isChecking || !playerQuery.trim()}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isChecking ? 'Checking...' : 'Check Player'}
              </button>
            </form>

            {/* Feedback message */}
            {searchFeedback && (
              <p className="text-[11px] text-sky-300 font-medium">
                {searchFeedback}
              </p>
            )}

            {/* Notable player chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-[#8b949e]">
              <span>Quick check:</span>
              {NOTABLE_PLAYERS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleCheckUser(name)}
                  disabled={isChecking}
                  className="px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white transition-colors cursor-pointer"
                >
                  @{name}
                </button>
              ))}
            </div>
          </div>

          {/* Filter & Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
            {/* Filter Tabs */}
            <div className="inline-flex p-0.5 bg-[#0d1117] border border-[#21262d] rounded-lg">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-[#21262d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                All Checked ({checkedPlayers.length})
              </button>
              <button
                onClick={() => setFilterMode('wears')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'wears'
                    ? 'bg-[#21262d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Wears ({wearsCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('owns')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterMode === 'owns'
                    ? 'bg-[#21262d] text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Owns ({ownsCount})</span>
              </button>
            </div>

            {/* Filter Player Results */}
            {checkedPlayers.length > 2 && (
              <div className="relative w-full sm:w-48">
                <SearchIcon className="w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={playerSearchFilter}
                  onChange={(e) => setPlayerSearchFilter(e.target.value)}
                  placeholder="Filter players..."
                  className="w-full pl-7 pr-3 py-1 bg-[#0d1117] border border-[#21262d] rounded-lg text-xs text-white placeholder-[#6e7681] outline-none"
                />
              </div>
            )}
          </div>

          {/* Results List */}
          {filteredPlayers.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8b949e] bg-[#161b22] border border-[#21262d] rounded-xl">
              {isChecking ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  <span>Checking player avatar and inventory...</span>
                </div>
              ) : (
                <span>No players match the current filter. Search above to check more players!</span>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto divide-y divide-[#21262d] bg-[#161b22] border border-[#21262d] rounded-xl overflow-hidden">
              {filteredPlayers.map((entry, idx) => {
                const isWears = entry.status === 'wears';
                const isOwns = entry.status === 'owns';

                return (
                  <div
                    key={entry.user?.id || idx}
                    className="p-3 hover:bg-[#1a212e] transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#0d1117] border border-[#30363d] overflow-hidden shrink-0">
                        <img
                          src={entry.avatarUrl || entry.user?.avatarHeadshotUrl}
                          alt={entry.user?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (entry.user?.id) {
                              e.currentTarget.src = `https://www.roblox.com/headshot-thumbnail/image?userId=${entry.user.id}&width=150&height=150&format=png`;
                            }
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white truncate">
                            {entry.user?.displayName}
                          </span>
                          <span className="text-[#8b949e] font-mono text-[11px]">
                            @{entry.user?.name}
                          </span>
                        </div>

                        {/* Status Label */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isWears && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>{entry.label || 'Currently Wearing on Active Avatar'}</span>
                            </span>
                          )}
                          {isOwns && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-purple-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                              <span>{entry.label}</span>
                            </span>
                          )}
                          {!isWears && !isOwns && (
                            <span className="text-[10px] text-[#8b949e]">
                              {entry.label || 'Does not have this item'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {onSelectPlayer && (
                        <button
                          onClick={() => {
                            onSelectPlayer(entry.user?.name);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-sky-400 hover:text-white rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                          title={`Explore ${entry.user?.displayName}'s outfits`}
                        >
                          <EyeIcon className="w-3 h-3" />
                          <span>Explore</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d1117] border-t border-[#21262d] flex items-center justify-between">
          <span className="text-[11px] text-[#8b949e]">
            Roblox cross-player avatar & item inspector
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
