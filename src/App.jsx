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
import { OutfitModal } from './components/OutfitModal.jsx';
import { CurrentAvatarModal } from './components/CurrentAvatarModal.jsx';
import { AvatarMaker } from './components/AvatarMaker.jsx';
import { AvatarSaver } from './components/AvatarSaver.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import {
  searchRobloxUser,
  fetchUserOutfits,
} from './services/roblox.js';
import { saveCharacter, setActiveAvatar } from './services/catalog.js';
import {
  AlertCircle,
  FolderOpen,
  Sparkles,
  RefreshCw,
  Search,
  Eye,
  Shirt,
} from 'lucide-react';

const NOTABLE_USERS = [
  '156', // builderman
  '1', // Roblox
  '261', // Shedletsky
  '80544', // Stickmasterluke
  '3467406', // Linkmon99
  '141444005', // KreekCraft
  '89082729', // Flamingo
];

function OutfitsExplorerView({
  query,
  setQuery,
  currentUser,
  outfits,
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
}) {
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const navigate = useNavigate();

  // Filtered & Sorted Outfits
  const filteredOutfits = useMemo(() => {
    return outfits
      .filter((outfit) => {
        // Player Outfits Only vs All
        if (filterMode === 'custom' && !outfit.isEditable) {
          return false;
        }
        // Name search
        if (searchTerm.trim()) {
          const match = outfit.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase().trim());
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortOption === 'name-desc') {
          return b.name.localeCompare(a.name);
        }
        return 0;
      });
  }, [outfits, filterMode, searchTerm, sortOption]);

  const customOutfitsCount = useMemo(() => {
    return outfits.filter((o) => o.isEditable).length;
  }, [outfits]);

  const handleWearCurrentLook = (previewUrl) => {
    if (!currentUser) return;
    const charData = {
      id: `char_curr_${currentUser.id}_${Date.now()}`,
      name: `${currentUser.displayName}'s Current Look`,
      baseUser: currentUser,
      playerAvatarType: 'R15',
      previewUrl: previewUrl || currentUser.avatarFullUrl,
      equippedItems: [],
    };
    saveCharacter(charData);
    setActiveAvatar(charData);
    navigate('/creator');
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent pb-1">
          Roblox Outfits Explorer
        </h2>
        <p className="text-xs sm:text-sm text-[#8b949e] max-w-xl mx-auto mt-1">
          Search any Roblox player to explore their outfits or wear them in the Avatar Maker!
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
          onInspectCurrentAvatar={onInspectCurrentAvatar}
        />
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 mb-6 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-300 flex items-start gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-rose-200">Could not find player</p>
            <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => onSearch()}
            className="px-3 py-1 bg-rose-900/40 hover:bg-rose-900/60 border border-rose-700/50 rounded-lg text-xs font-semibold text-rose-200 shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin mb-3" />
          <p className="text-sm font-semibold text-[#f0f6fc]">{loadingStep}</p>
          <p className="text-xs text-[#8b949e] mt-1">
            Loading clothes from Roblox...
          </p>
        </div>
      )}

      {/* Outfits Content */}
      {!isLoading && currentUser && (
        <div>
          {/* If the player has saved outfits, show filter controls + outfits grid */}
          {outfits.length > 0 && (
            <>
              <ControlsBar
                filterMode={filterMode}
                setFilterMode={setFilterMode}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortOption={sortOption}
                setSortOption={setSortOption}
                filteredCount={filteredOutfits.length}
                totalCount={outfits.length}
              />

              {filteredOutfits.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-8">
                  {filteredOutfits.map((outfit) => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      currentUser={currentUser}
                      onInspect={(o) => setSelectedOutfit(o)}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 bg-[#161b22] border border-[#30363d] rounded-2xl text-center max-w-md mx-auto mb-8">
                  <Search className="w-8 h-8 text-[#8b949e] opacity-40 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-white mb-1">
                    No Matching Outfits
                  </h3>
                  <p className="text-xs text-[#8b949e] mb-3">
                    No outfits matched "{searchTerm}".
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterMode('all');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg border border-[#30363d] cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </>
          )}

          {/* IF NO SAVED OUTFITS: Show current outfit with both poses (with pose & straight) */}
          {outfits.length === 0 && (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 mb-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#21262d]">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Current Worn Outfit</span>
                  </h3>
                  <p className="text-xs text-[#8b949e] mt-0.5">
                    No saved outfits found. Here is @{currentUser.name}'s active outfit worn right now:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {/* 1. With Action Pose */}
                <div className="bg-[#121315] border border-[#2B2D2F] rounded-xl p-3 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#2B2D2F] mb-2.5 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={currentUser.avatarFullUrl}
                      alt={`${currentUser.name} posed`}
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      With Pose
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-2">
                    Active Look (Posed)
                  </h4>

                  <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                    <button
                      onClick={onInspectCurrentAvatar}
                      className="py-1 px-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => handleWearCurrentLook(currentUser.avatarFullUrl)}
                      className="py-1 px-2 bg-[#00B06F] hover:bg-[#00c57c] text-white text-xs font-bold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Wear</span>
                    </button>
                  </div>
                </div>

                {/* 2. Straight (No Pose) */}
                <div className="bg-[#121315] border border-[#2B2D2F] rounded-xl p-3 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#2B2D2F] mb-2.5 overflow-hidden flex items-center justify-center relative">
                    <img
                      src={currentUser.avatarStraightUrl || currentUser.avatarFullUrl}
                      alt={`${currentUser.name} straight`}
                      className="w-full h-full object-contain p-2"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Straight (No Pose)
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white mb-2">
                    Active Look (Straight)
                  </h4>

                  <div className="w-full grid grid-cols-2 gap-1.5 mt-auto">
                    <button
                      onClick={onInspectCurrentAvatar}
                      className="py-1 px-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => handleWearCurrentLook(currentUser.avatarStraightUrl || currentUser.avatarFullUrl)}
                      className="py-1 px-2 bg-[#00B06F] hover:bg-[#00c57c] text-white text-xs font-bold rounded-md flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Wear</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State before any search */}
      {!isLoading && !currentUser && !error && (
        <div className="py-16 text-center text-[#8b949e]">
          <FolderOpen className="w-10 h-10 opacity-30 mx-auto mb-2" />
          <p className="text-sm font-medium text-[#c9d1d9]">
            Type any Roblox username or User ID above to explore their outfits.
          </p>
        </div>
      )}

      {/* Outfit Details Inspection Modal */}
      <OutfitModal
        outfit={selectedOutfit}
        currentUser={currentUser}
        onClose={() => setSelectedOutfit(null)}
      />
    </main>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [outfits, setOutfits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState(null);

  // Request tracker to prevent race conditions when searching quickly
  const activeRequestIdRef = useRef(0);

  // Filters & Sorting
  const [filterMode, setFilterMode] = useState('custom');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('default');

  // Modals
  const [isInspectingCurrentAvatar, setIsInspectingCurrentAvatar] = useState(false);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('rbx_recent_searches');
      return saved ? JSON.parse(saved) : ['builderman', 'Shedletsky'];
    } catch {
      return ['builderman', 'Shedletsky'];
    }
  });

  const saveRecentSearch = (userQuery) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== userQuery.toLowerCase());
      const updated = [userQuery, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('rbx_recent_searches', JSON.stringify(updated));
      } catch {
        // ignore
      }
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
  };

  const handleSearch = async (targetQuery) => {
    const q = (targetQuery !== undefined ? targetQuery : query).trim();
    if (!q) return;

    const requestId = ++activeRequestIdRef.current;

    setIsLoading(true);
    setError(null);
    setLoadingStep('Looking up player...');
    setSearchTerm('');

    // Immediately clear previous user & outfits so stale items never display
    setCurrentUser(null);
    setOutfits([]);

    try {
      const user = await searchRobloxUser(q);
      if (activeRequestIdRef.current !== requestId) return;

      setCurrentUser(user);
      saveRecentSearch(user.name);

      setLoadingStep(`Loading outfits for ${user.displayName}...`);
      const userOutfits = await fetchUserOutfits(user.id);
      if (activeRequestIdRef.current !== requestId) return;

      setOutfits(userOutfits);

      // If the player doesn't have custom creations, auto-switch to "all" to show outfits
      const hasCustom = userOutfits.some((o) => o.isEditable);
      if (!hasCustom && userOutfits.length > 0) {
        setFilterMode('all');
      }
    } catch (err) {
      if (activeRequestIdRef.current !== requestId) return;
      console.error(err);
      setError(err.message || 'Could not load player outfits.');
      setCurrentUser(null);
      setOutfits([]);
    } finally {
      if (activeRequestIdRef.current === requestId) {
        setIsLoading(false);
        setLoadingStep('');
      }
    }
  };

  const handleSelectRandom = () => {
    const randomId = NOTABLE_USERS[Math.floor(Math.random() * NOTABLE_USERS.length)];
    setQuery(randomId);
    handleSearch(randomId);
  };

  // Initial load
  useEffect(() => {
    handleSearch('156');
  }, []);

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-[#0b0f17] text-[#f0f6fc]">
        {/* Top Bar Header with Avatar Maker and Avatar Saver links */}
        <Header onSelectRandom={handleSelectRandom} isLoading={isLoading} />

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
              />
            }
          />

          {/* Avatar Saver at /save */}
          <Route path="/save" element={<AvatarSaver />} />

          {/* Redirects to /save */}
          <Route path="/saver" element={<Navigate to="/save" replace />} />
          <Route path="/avatarsaver" element={<Navigate to="/save" replace />} />
          <Route path="/avatar-saver" element={<Navigate to="/save" replace />} />

          {/* Avatar Maker in /creator */}
          <Route path="/creator" element={<AvatarMaker />} />

          {/* Redirects to /creator */}
          <Route path="/maker" element={<Navigate to="/creator" replace />} />
          <Route path="/avatarmaker" element={<Navigate to="/creator" replace />} />
          <Route path="/avatar-maker" element={<Navigate to="/creator" replace />} />

          {/* Catch-all redirect to / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Currently Worn Avatar Modal */}
        <CurrentAvatarModal
          user={isInspectingCurrentAvatar ? currentUser : null}
          onClose={() => setIsInspectingCurrentAvatar(false)}
        />

        {/* Footer */}
        <footer className="w-full border-t border-[#21262d] py-5 px-4 text-center text-xs text-[#8b949e] mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>
              Roblox Outfits, Avatar Maker & Saver · Inspect, build, and save avatar creations across all your devices
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a
                href="https://www.roblox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors"
              >
                Roblox.com ↗
              </a>
              <span>·</span>
              <a
                href="https://create.roblox.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors"
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
