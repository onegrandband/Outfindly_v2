/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from './components/Header.jsx';
import { SearchSection } from './components/SearchSection.jsx';
import { UserProfileCard } from './components/UserProfileCard.jsx';
import { ControlsBar } from './components/ControlsBar.jsx';
import { OutfitCard } from './components/OutfitCard.jsx';
import { ItemCard } from './components/ItemCard.jsx';
import { OutfitModal } from './components/OutfitModal.jsx';
import { CurrentAvatarModal } from './components/CurrentAvatarModal.jsx';
import { ItemOwnershipModal } from './components/ItemOwnershipModal.jsx';
import { ExactDateModal } from './components/ExactDateModal.jsx';
import { AvatarMaker } from './components/AvatarMaker.jsx';
import { AvatarSaver } from './components/AvatarSaver.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import {
  searchRobloxUser,
  fetchUserOutfits,
  fetchCurrentWearingAvatar,
  fetchOutfitDetails,
  fetchAssetDetails,
  fetchAssetThumbnails,
  downloadRobloxImage,
} from './services/roblox.js';
import {
  pushSearchHistoryToCloud,
  getActiveCodeAccount,
} from './services/accountSync.js';
import {
  AlertIcon,
  FolderIcon,
  RefreshIcon,
  SearchIcon,
  EyeIcon,
  ShirtIcon,
  DownloadIcon,
  UsersIcon,
  SparklesIcon,
} from './components/Icons.jsx';

function OutfitsExplorerView({
  query,
  setQuery,
  currentUser,
  outfits,
  playerItems,
  totalAvatarPrice,
  isLoading,
  loadingStep,
  error,
  filterMode,
  setFilterMode,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  recentSearches,
  onSearch,
  onClearRecent,
  onInspectCurrentAvatar,
  onCheckOwnership,
  onTriggerExactDate,
}) {
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [isDownloadingLook, setIsDownloadingLook] = useState(false);

  // Check if search term is "Exact Date" easter egg
  useEffect(() => {
    if (searchTerm.trim().toLowerCase() === 'exact date') {
      onTriggerExactDate();
    }
  }, [searchTerm, onTriggerExactDate]);

  // Filtered Outfits
  const filteredOutfits = useMemo(() => {
    return outfits
      .filter((outfit) => {
        if (filterMode === 'clothes') return false; // In clothes-only mode, don't show outfits!
        if (filterMode === 'custom' && !outfit.isEditable) {
          return false;
        }
        if (searchTerm.trim() && searchTerm.trim().toLowerCase() !== 'exact date') {
          const match = outfit.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase().trim());
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
      });
  }, [outfits, filterMode, searchTerm, sortOption]);

  // Filtered Clothes & Items (items the player owns/wears)
  const filteredItems = useMemo(() => {
    if (filterMode === 'custom') return []; // In player outfits mode, only show outfits!
    return playerItems
      .filter((item) => {
        if (searchTerm.trim() && searchTerm.trim().toLowerCase() !== 'exact date') {
          const q = searchTerm.toLowerCase().trim();
          const matchName = item.name?.toLowerCase().includes(q);
          const matchType = item.assetType?.name?.toLowerCase().includes(q);
          const matchId = String(item.id).includes(q);
          if (!matchName && !matchType && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
        if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
        return 0;
      });
  }, [playerItems, filterMode, searchTerm, sortOption]);

  const customOutfitsCount = useMemo(() => {
    return outfits.filter((o) => o.isEditable).length;
  }, [outfits]);

  const handleDownloadActiveLook = async (url) => {
    if (!url || !currentUser) return;
    setIsDownloadingLook(true);
    const cleanName = `${currentUser.name}_current_look`.replace(/[^a-zA-Z0-9_-]/g, '_');
    await downloadRobloxImage(url, `${cleanName}.png`);
    setIsDownloadingLook(false);
  };

  const totalDisplayCount =
    filterMode === 'clothes'
      ? filteredItems.length
      : filterMode === 'custom'
      ? filteredOutfits.length
      : filteredOutfits.length + filteredItems.length;

  const totalRawCount =
    filterMode === 'clothes'
      ? playerItems.length
      : filterMode === 'custom'
      ? outfits.length
      : outfits.length + playerItems.length;

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white pb-1">
          Roblox Outfits & Items Explorer
        </h2>
        <p className="text-xs sm:text-sm text-[#8b949e] max-w-xl mx-auto mt-1">
          Inspect any player's saved avatar creations, clothes, limited accessories, and check cross-player ownership.
        </p>
      </div>

      {/* Search Card */}
      <SearchSection
        query={query}
        setQuery={setQuery}
        onSearch={onSearch}
        isLoading={isLoading}
        recentSearches={recentSearches}
        onSelectRecent={onSearch}
        onClearRecent={onClearRecent}
      />

      {/* User Profile Card */}
      {currentUser && (
        <UserProfileCard
          key={currentUser.id}
          user={currentUser}
          totalOutfits={outfits.length}
          customOutfitsCount={customOutfitsCount}
          totalAvatarPrice={totalAvatarPrice}
          onInspectCurrentAvatar={onInspectCurrentAvatar}
        />
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 flex items-start gap-3 text-sm">
          <AlertIcon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-rose-200">Could not find player</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => onSearch()}
            className="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-lg text-xs font-semibold text-rose-200 shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshIcon className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-9 h-9 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-semibold text-[#f0f6fc]">{loadingStep}</p>
          <p className="text-xs text-[#8b949e] mt-1">
            Loading player clothes & full avatar collection...
          </p>
        </div>
      )}

      {/* Outfits & Clothes Content */}
      {!isLoading && currentUser && (
        <div>
          {/* Controls Bar */}
          <ControlsBar
            filterMode={filterMode}
            setFilterMode={setFilterMode}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            filteredCount={totalDisplayCount}
            totalCount={totalRawCount}
          />

          {/* Section: Outfits Grid (shown in 'custom' or 'all') */}
          {filterMode !== 'clothes' && filteredOutfits.length > 0 && (
            <div className="mb-8">
              {filterMode === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <ShirtIcon className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                    Saved Outfits ({filteredOutfits.length})
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredOutfits.map((outfit) => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    currentUser={currentUser}
                    onInspect={(o) => setSelectedOutfit(o)}
                    onCheckOwnership={onCheckOwnership}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Section: Clothes & Items Grid (shown in 'clothes' or 'all') */}
          {filterMode !== 'custom' && filteredItems.length > 0 && (
            <div className="mb-8">
              {filterMode === 'all' && (
                <div className="flex items-center gap-2 mb-3">
                  <ShirtIcon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">
                    Clothes & Accessories ({filteredItems.length})
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                {filteredItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onCheckOwnership={onCheckOwnership}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty search results inside active filter */}
          {totalDisplayCount === 0 && (
            <div className="py-12 px-4 bg-[#12161f] border border-[#2d333b] rounded-xl text-center max-w-md mx-auto mb-8">
              <SearchIcon className="w-7 h-7 text-[#8b949e] opacity-40 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white mb-1">
                No Items Matched
              </h3>
              <p className="text-xs text-[#8b949e] mb-3">
                No items or outfits matched "{searchTerm}".
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterMode('custom');
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-[#1f2937] hover:bg-[#374151] text-white rounded-lg border border-[#374151] cursor-pointer"
              >
                Reset Search
              </button>
            </div>
          )}

          {/* IF NO SAVED OUTFITS: Show current worn look with both poses */}
          {outfits.length === 0 && filterMode === 'custom' && (
            <div className="bg-[#12161f] border border-[#2d333b] rounded-xl p-5 mb-6 shadow-md">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#21262d]">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <ShirtIcon className="w-4 h-4 text-sky-400" />
                    <span>Current Worn Outfit</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    No saved outfits found. Here is @{currentUser.name}'s active outfit worn right now:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {/* 1. With Pose */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg bg-[#0a0d14] border border-[#21262d] mb-2.5 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={currentUser.avatarFullUrl}
                      alt={`${currentUser.name} posed`}
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e293b] text-sky-300 border border-[#334155]">
                      Posed
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white mb-2">
                    Active Look (Posed)
                  </h4>

                  <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                    <button
                      onClick={onInspectCurrentAvatar}
                      className="py-1 px-2 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <EyeIcon className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => handleDownloadActiveLook(currentUser.avatarFullUrl)}
                      disabled={isDownloadingLook}
                      className="py-1 px-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>

                {/* 2. Straight (No Pose) */}
                <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-3 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg bg-[#0a0d14] border border-[#21262d] mb-2.5 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={currentUser.avatarStraightUrl || currentUser.avatarFullUrl}
                      alt={`${currentUser.name} straight`}
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-[#1e293b] text-purple-300 border border-[#334155]">
                      Straight
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white mb-2">
                    Active Look (Straight)
                  </h4>

                  <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                    <button
                      onClick={onInspectCurrentAvatar}
                      className="py-1 px-2 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <EyeIcon className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadActiveLook(
                          currentUser.avatarStraightUrl || currentUser.avatarFullUrl
                        )
                      }
                      disabled={isDownloadingLook}
                      className="py-1 px-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <DownloadIcon className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State */}
      {!isLoading && !currentUser && !error && (
        <div className="py-16 text-center text-[#8b949e]">
          <FolderIcon className="w-9 h-9 opacity-30 mx-auto mb-2 text-[#8b949e]" />
          <p className="text-sm font-medium text-[#c9d1d9]">
            Type any Roblox username or User ID above to explore their complete avatar collection.
          </p>
        </div>
      )}

      {/* Outfit Details Inspection Modal */}
      <OutfitModal
        outfit={selectedOutfit}
        currentUser={currentUser}
        onClose={() => setSelectedOutfit(null)}
        onCheckOwnership={onCheckOwnership}
      />
    </main>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [playerItems, setPlayerItems] = useState([]);
  const [totalAvatarPrice, setTotalAvatarPrice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);

  const activeRequestIdRef = useRef(0);

  // Filters & Sorting (default is 'custom' / "Player Outfits" per user request)
  const [filterMode, setFilterMode] = useState('custom');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');

  // Modals
  const [isInspectingCurrentAvatar, setIsInspectingCurrentAvatar] = useState(false);
  const [ownershipModalItem, setOwnershipModalItem] = useState(null);
  const [isExactDateModalOpen, setIsExactDateModalOpen] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('rbx_recent_searches');
      return saved ? JSON.parse(saved) : ['builderman', 'Shedletsky'];
    } catch {
      return ['builderman', 'Shedletsky'];
    }
  });

  // Global Shift+D listener for Secret Exact Join Date easter egg
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        // Prevent typing capital D if not focused on text input or show modal
        setIsExactDateModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveRecentSearch = (userQuery) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== userQuery.toLowerCase());
      const updated = [userQuery, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('rbx_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
      // Push to cloud account if logged in
      pushSearchHistoryToCloud(updated).catch(() => {});
      return updated;
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('rbx_recent_searches');
    } catch {
      // ignore
    }
    pushSearchHistoryToCloud([]).catch(() => {});
  };

  const handleSearch = async (targetQuery) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    const requestId = ++activeRequestIdRef.current;

    setIsLoading(true);
    setError(null);
    setLoadingStep('Looking up player...');
    setSearchTerm('');
    setCurrentUser(null);
    setOutfits([]);
    setPlayerItems([]);
    setTotalAvatarPrice(null);

    try {
      const user = await searchRobloxUser(q);
      if (activeRequestIdRef.current !== requestId) return;

      setCurrentUser(user);
      saveRecentSearch(user.name);

      setLoadingStep(`Loading full avatar collection for ${user.displayName}...`);
      const [userOutfits, activeAvatar] = await Promise.all([
        fetchUserOutfits(user.id),
        fetchCurrentWearingAvatar(user.id).catch(() => null),
      ]);

      if (activeRequestIdRef.current !== requestId) return;
      setOutfits(userOutfits);

      // Collect all unique clothes and accessory items the player has
      const itemsMap = new Map();

      // 1. Items from active look
      if (activeAvatar?.assets) {
        for (const a of activeAvatar.assets) {
          itemsMap.set(String(a.id), {
            id: a.id,
            name: a.name,
            assetType: a.assetType,
            category: a.assetType?.name || 'Accessories',
            source: 'active',
          });
        }

        // Calculate total Robux price of active character
        Promise.all(
          activeAvatar.assets.map((a) => fetchAssetDetails(a.id).catch(() => null))
        ).then((detailsList) => {
          if (activeRequestIdRef.current !== requestId) return;
          const total = detailsList.reduce((sum, d) => {
            return d && typeof d.price === 'number' ? sum + d.price : sum;
          }, 0);
          setTotalAvatarPrice(total);
        });
      }

      // Initial list of items
      const initialItems = Array.from(itemsMap.values());
      setPlayerItems(initialItems);

      // Batch pre-fetch direct CDN thumbnails for these items so they never break
      fetchAssetThumbnails(Array.from(itemsMap.keys())).then((thumbs) => {
        if (activeRequestIdRef.current !== requestId) return;
        setPlayerItems((prev) =>
          prev.map((item) => ({
            ...item,
            imageUrl: thumbs[item.id] || item.imageUrl,
          }))
        );
      });

      // 2. Fetch items from the first few outfits to populate their wardrobe items
      const outfitSamples = userOutfits.slice(0, 6);
      Promise.all(
        outfitSamples.map((o) =>
          fetchOutfitDetails(o.id)
            .then((d) => d?.assets || [])
            .catch(() => [])
        )
      ).then((outfitAssetsList) => {
        if (activeRequestIdRef.current !== requestId) return;
        const allAssetIds = [];
        outfitAssetsList.flat().forEach((a) => {
          if (!itemsMap.has(String(a.id))) {
            itemsMap.set(String(a.id), {
              id: a.id,
              name: a.name,
              assetType: a.assetType,
              category: a.assetType?.name || 'Accessories',
              source: 'outfit',
            });
            allAssetIds.push(a.id);
          }
        });

        const updatedItems = Array.from(itemsMap.values());
        setPlayerItems(updatedItems);

        // Batch pre-fetch thumbnails for new outfit assets
        if (allAssetIds.length > 0) {
          fetchAssetThumbnails(allAssetIds).then((thumbs) => {
            if (activeRequestIdRef.current !== requestId) return;
            setPlayerItems((prev) =>
              prev.map((item) => ({
                ...item,
                imageUrl: thumbs[item.id] || item.imageUrl,
              }))
            );
          });
        }
      });

      // If player has 0 custom outfits, switch to 'all' so outfits/items still show
      const hasCustom = userOutfits.some((o) => o.isEditable);
      if (!hasCustom && userOutfits.length > 0) {
        setFilterMode('all');
      } else {
        setFilterMode('custom');
      }
    } catch (err) {
      if (activeRequestIdRef.current !== requestId) return;
      console.error(err);
      setError(err.message || 'Could not load player outfits.');
      setCurrentUser(null);
      setOutfits([]);
      setPlayerItems([]);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        setLoadingStep('');
      }
    }
  };

  useEffect(() => {
    handleSearch('156');
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#0b0f17] text-[#f0f6fc]">
        {/* Header */}
        <Header />

        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <OutfitsExplorerView
                query={query}
                setQuery={setQuery}
                currentUser={currentUser}
                outfits={outfits}
                playerItems={playerItems}
                totalAvatarPrice={totalAvatarPrice}
                isLoading={isLoading}
                loadingStep={loadingStep}
                error={error}
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortOption={sortOption}
                setSortOption={setSortOption}
                recentSearches={recentSearches}
                onSearch={handleSearch}
                onClearRecent={handleClearRecent}
                onInspectCurrentAvatar={() => setIsInspectingCurrentAvatar(true)}
                onCheckOwnership={(item) => setOwnershipModalItem(item)}
                onTriggerExactDate={() => setIsExactDateModalOpen(true)}
              />
            }
          />

          {/* Avatar Saver at /save */}
          <Route path="/save" element={<AvatarSaver />} />
          <Route path="/saver" element={<Navigate to="/save" replace />} />
          <Route path="/avatarsaver" element={<Navigate to="/save" replace />} />
          <Route path="/avatar-saver" element={<Navigate to="/save" replace />} />

          {/* Avatar Maker in /creator (still accessible via link /creator per user prompt) */}
          <Route path="/creator" element={<AvatarMaker />} />
          <Route path="/maker" element={<Navigate to="/creator" replace />} />
          <Route path="/avatarmaker" element={<Navigate to="/creator" replace />} />
          <Route path="/avatar-maker" element={<Navigate to="/creator" replace />} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Currently Worn Avatar Modal */}
        <CurrentAvatarModal
          user={isInspectingCurrentAvatar ? currentUser : null}
          onClose={() => setIsInspectingCurrentAvatar(false)}
          onCheckOwnership={(item) => setOwnershipModalItem(item)}
        />

        {/* Item & Avatar Ownership Inspector Modal */}
        <ItemOwnershipModal
          isOpen={Boolean(ownershipModalItem)}
          item={ownershipModalItem}
          currentUser={currentUser}
          playerItems={playerItems}
          outfits={outfits}
          onClose={() => setOwnershipModalItem(null)}
          onSelectPlayer={(playerName) => {
            setQuery(playerName);
            handleSearch(playerName);
          }}
        />

        {/* Exact Join Date & Time Easter Egg Modal (Shift+D or "Exact Date") */}
        <ExactDateModal
          isOpen={isExactDateModalOpen}
          onClose={() => setIsExactDateModalOpen(false)}
          currentUser={currentUser}
        />

        {/* Footer */}
        <footer className="w-full border-t border-[#21262d] py-5 px-4 text-center text-xs text-[#8b949e] mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              Roblox Outfits & Avatar Saver • Human-crafted avatar & item explorer
            </p>
            <div className="flex items-center gap-4 text-xs">
              <button
                onClick={() => setIsExactDateModalOpen(true)}
                className="hover:text-amber-400 text-sky-400 font-mono text-[11px] transition-colors cursor-pointer"
                title="Secret Easter Egg: Shift+D or search 'Exact Date'"
              >
                Easter Egg [Shift+D]
              </button>
              <span>•</span>
              <a
                href="https://www.roblox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Roblox.com ↗
              </a>
              <span>•</span>
              <a
                href="https://create.roblox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Creator Hub ↗
              </a>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
