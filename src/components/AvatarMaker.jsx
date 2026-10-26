import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shirt,
  Search,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Save,
  User,
  Sliders,
  Palette,
  Layers,
  Download,
  RotateCw,
} from './Icons.jsx';
import {
  CURATED_CATALOG,
  ROBLOX_PALETTE,
  getSavedCharacters,
  saveCharacter,
  deleteCharacter,
  getActiveAvatar,
  setActiveAvatar,
  lookupCatalogItem,
} from '../services/catalog.js';
import { searchRobloxUser, fetchRobloxJson } from '../services/roblox.js';
import { RobuxBadge } from './RobuxIcon.jsx';
import { CustomSlider } from './CustomControls.jsx';

export function AvatarMaker() {
  const [avatar, setAvatar] = useState(getActiveAvatar);
  const [characterName, setCharacterName] = useState(avatar.name || 'Custom Look');
  const [savedList, setSavedList] = useState(getSavedCharacters);

  // Studio tabs: 'items' | 'colors' | 'scales' | 'base'
  const [studioTab, setStudioTab] = useState('items');
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');

  // Pose toggle: 'pose' (with pose) | 'straight' (no pose)
  const [poseMode, setPoseMode] = useState('pose');
  const [straightImageUrl, setStraightImageUrl] = useState('');

  // Marketplace filter: 'all' | 'hats' | 'hair' | 'faces' | 'shirts' | 'pants' | 'accessories' | 'saved'
  const [marketCategory, setMarketCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Item by ID
  const [customItemId, setCustomItemId] = useState('');
  const [isLookingUpItem, setIsLookingUpItem] = useState(false);
  const [itemLookupError, setItemLookupError] = useState(null);

  // Change base player
  const [basePlayerInput, setBasePlayerInput] = useState('');
  const [isChangingPlayer, setIsChangingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState(null);

  // Toast
  const [saveToast, setSaveToast] = useState('');

  // Fetch straight (bust) pose if baseUser exists
  useEffect(() => {
    if (!avatar.baseUser?.id) {
      setStraightImageUrl('');
      return;
    }
    fetchRobloxJson(
      `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${avatar.baseUser.id}&size=420x420&format=Png`
    )
      .then((res) => {
        if (res?.data?.[0]?.imageUrl) {
          setStraightImageUrl(res.data[0].imageUrl);
        }
      })
      .catch(() => {});
  }, [avatar.baseUser?.id]);

  // Persist active avatar whenever it changes
  useEffect(() => {
    setActiveAvatar({ ...avatar, name: characterName });
  }, [avatar, characterName]);

  const showToast = (msg) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(''), 2500);
  };

  // Toggle equipping an item
  const handleToggleItem = (item) => {
    const isWorn = avatar.equippedItems.some((i) => i.id === item.id);
    let newItems;
    if (isWorn) {
      newItems = avatar.equippedItems.filter((i) => i.id !== item.id);
      showToast(`Removed "${item.name}"`);
    } else {
      newItems = [item, ...avatar.equippedItems];
      showToast(`Equipped "${item.name}"!`);
    }
    setAvatar((prev) => ({
      ...prev,
      equippedItems: newItems,
    }));
  };

  // Unequip item by ID
  const handleUnequipItem = (itemId) => {
    setAvatar((prev) => ({
      ...prev,
      equippedItems: prev.equippedItems.filter((i) => i.id !== itemId),
    }));
  };

  // Clear all items
  const handleClearAllItems = () => {
    if (avatar.equippedItems.length === 0) return;
    setAvatar((prev) => ({
      ...prev,
      equippedItems: [],
    }));
    showToast('Removed all items');
  };

  // Color picker
  const handleApplyColor = (hex) => {
    setAvatar((prev) => {
      const colors = { ...prev.bodyColors };
      if (selectedBodyPart === 'all') {
        colors.head = hex;
        colors.torso = hex;
        colors.leftArm = hex;
        colors.rightArm = hex;
        colors.leftLeg = hex;
        colors.rightLeg = hex;
      } else {
        colors[selectedBodyPart] = hex;
      }
      return { ...prev, bodyColors: colors };
    });
  };

  // Switch base player model
  const handleChangeBasePlayer = async (targetQuery) => {
    const q = (targetQuery || basePlayerInput).trim();
    if (!q || isChangingPlayer) return;

    setIsChangingPlayer(true);
    setPlayerError(null);

    try {
      const user = await searchRobloxUser(q);
      setAvatar((prev) => ({
        ...prev,
        baseUser: user,
      }));
      setBasePlayerInput('');
      showToast(`Loaded @${user.name}!`);
    } catch (err) {
      setPlayerError(err.message || 'Player not found');
    } finally {
      setIsChangingPlayer(false);
    }
  };

  // Reset to clean template (no forced builderman)
  const handleResetToCleanTemplate = () => {
    setAvatar((prev) => ({
      ...prev,
      baseUser: null,
      equippedItems: [],
    }));
    showToast('Reset to clean character template');
  };

  // Look up custom item by ID
  const handleLookupCustomItem = async (e) => {
    e.preventDefault();
    if (!customItemId.trim() || isLookingUpItem) return;

    setIsLookingUpItem(true);
    setItemLookupError(null);

    try {
      const item = await lookupCatalogItem(customItemId.trim());
      handleToggleItem(item);
      setCustomItemId('');
    } catch (err) {
      setItemLookupError(err.message || 'Item not found');
    } finally {
      setIsLookingUpItem(false);
    }
  };

  // Save current character look to library
  const handleSaveCurrentCharacter = () => {
    const charToSave = {
      id: `char_${Date.now()}`,
      name: characterName.trim() || 'Custom Character',
      baseUser: avatar.baseUser,
      equippedItems: avatar.equippedItems,
      bodyColors: avatar.bodyColors,
      scales: avatar.scales,
      playerAvatarType: avatar.playerAvatarType || 'R15',
      previewUrl:
        poseMode === 'straight' && straightImageUrl
          ? straightImageUrl
          : avatar.baseUser?.avatarFullUrl || avatar.baseUser?.avatarHeadshotUrl,
    };

    const updated = saveCharacter(charToSave);
    setSavedList(updated);
    showToast(`Saved "${charToSave.name}"!`);
  };

  // Load a saved character
  const handleLoadSavedCharacter = (savedChar) => {
    setAvatar({
      name: savedChar.name,
      baseUser: savedChar.baseUser,
      equippedItems: savedChar.equippedItems || [],
      bodyColors: savedChar.bodyColors || avatar.bodyColors,
      scales: savedChar.scales || avatar.scales,
      playerAvatarType: savedChar.playerAvatarType || 'R15',
    });
    setCharacterName(savedChar.name);
    showToast(`Loaded "${savedChar.name}"!`);
  };

  // Delete saved character
  const handleDeleteSavedCharacter = (id, name) => {
    const updated = deleteCharacter(id);
    setSavedList(updated);
    showToast(`Deleted "${name}"`);
  };

  // Filter marketplace catalog items
  const filteredCatalog = CURATED_CATALOG.filter((item) => {
    if (marketCategory !== 'all' && item.category !== marketCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        String(item.id).includes(q)
      );
    }
    return true;
  });

  // Calculate total price of worn items
  const totalRobuxWorn = avatar.equippedItems.reduce((acc, i) => acc + (i.price || 0), 0);

  // Current display image: action pose or straight standing pose
  const displayImage =
    poseMode === 'straight' && straightImageUrl
      ? straightImageUrl
      : avatar.baseUser?.avatarFullUrl ||
        avatar.baseUser?.avatarHeadshotUrl ||
        'https://tr.rbxcdn.com/30DAY-Avatar-635A2AA0A87D473B6136800B5B86F761-Png/420/420/Avatar/Png/noFilter';

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-6 flex flex-col gap-5">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00B06F] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Compact Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#191B1D] border border-[#2B2D2F] p-3 sm:p-4 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#00B06F] flex items-center justify-center text-white shadow-md font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Character Name..."
                className="bg-transparent text-base font-bold text-white border-b border-transparent hover:border-[#393B3D] focus:border-[#00a2ff] focus:outline-none px-1 py-0.5 rounded transition-all max-w-[200px] sm:max-w-xs truncate"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-[#8b949e] flex-wrap mt-0.5">
              <span>{avatar.equippedItems.length} items</span>
              <span>·</span>
              <RobuxBadge amount={totalRobuxWorn} className="text-white text-xs" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
          <button
            onClick={handleSaveCurrentCharacter}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#00B06F] hover:bg-[#00c57c] active:scale-95 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace with Smaller Left Base */}
      <div className="grid grid-cols-1 md:grid-cols-[270px_1fr] gap-5 items-start">
        {/* Left Column: Smaller Character Base & Stage */}
        <div className="flex flex-col gap-3 bg-[#191B1D] border border-[#2B2D2F] rounded-xl p-3 shadow-lg">
          {/* Compact Character Stage */}
          <div className="w-full h-56 sm:h-60 rounded-lg bg-gradient-to-b from-[#232527] to-[#121315] border border-[#2B2D2F] relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
            <img
              src={displayImage}
              alt={characterName}
              className="w-full h-full object-contain p-2 filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
              referrerPolicy="no-referrer"
            />

            {/* Base Model Info Pill */}
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#191B1D]/90 border border-[#2B2D2F] text-[10px] text-[#c9d1d9] flex items-center gap-1">
              <User className="w-2.5 h-2.5 text-[#00a2ff]" />
              <span className="truncate max-w-[110px]">
                {avatar.baseUser ? `@${avatar.baseUser.name}` : 'Template'}
              </span>
            </div>

            {/* Pose Switcher Buttons (Pose vs Straight) */}
            <div className="absolute bottom-2 left-2 flex gap-1 bg-[#191B1D]/90 p-0.5 rounded border border-[#2B2D2F]">
              <button
                type="button"
                onClick={() => setPoseMode('pose')}
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                  poseMode === 'pose'
                    ? 'bg-[#00a2ff] text-white'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Pose
              </button>
              <button
                type="button"
                onClick={() => setPoseMode('straight')}
                className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                  poseMode === 'straight'
                    ? 'bg-[#00a2ff] text-white'
                    : 'text-[#8b949e] hover:text-white'
                }`}
              >
                Straight
              </button>
            </div>

            {/* Download */}
            <a
              href={displayImage}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 p-1 rounded bg-[#191B1D]/90 hover:bg-[#232527] border border-[#2B2D2F] text-[#8b949e] hover:text-white text-xs transition-colors"
              title="Full Image"
            >
              <Download className="w-3 h-3" />
            </a>
          </div>

          {/* Sub-Tabs: Clothes, Colors, Sizes, Base */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#121315] border border-[#2B2D2F] rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setStudioTab('items')}
              className={`py-1 rounded text-center transition-colors ${
                studioTab === 'items'
                  ? 'bg-[#232527] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Items ({avatar.equippedItems.length})
            </button>
            <button
              onClick={() => setStudioTab('colors')}
              className={`py-1 rounded text-center transition-colors ${
                studioTab === 'colors'
                  ? 'bg-[#232527] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Skin
            </button>
            <button
              onClick={() => setStudioTab('scales')}
              className={`py-1 rounded text-center transition-colors ${
                studioTab === 'scales'
                  ? 'bg-[#232527] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Size
            </button>
            <button
              onClick={() => setStudioTab('base')}
              className={`py-1 rounded text-center transition-colors ${
                studioTab === 'base'
                  ? 'bg-[#232527] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-white'
              }`}
            >
              Base
            </button>
          </div>

          {/* Tab 1: Equipped Items */}
          {studioTab === 'items' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#8b949e]">
                <span>Worn Items:</span>
                {avatar.equippedItems.length > 0 && (
                  <button
                    onClick={handleClearAllItems}
                    className="text-rose-400 hover:text-rose-300 text-[10px] underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {avatar.equippedItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#8b949e] bg-[#121315] border border-[#2B2D2F] rounded-lg">
                  No clothes or hats worn yet. Click "Try On" in the catalog!
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                  {avatar.equippedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-1.5 bg-[#121315] border border-[#2B2D2F] rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-7 h-7 object-contain rounded bg-[#191B1D] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[130px] text-[11px]">
                            {item.name}
                          </p>
                          <RobuxBadge amount={item.price || 0} className="text-[10px] text-[#8b949e]" />
                        </div>
                      </div>

                      <button
                        onClick={() => handleUnequipItem(item.id)}
                        className="p-1 text-[#8b949e] hover:text-rose-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Skin Colors */}
          {studioTab === 'colors' && (
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-1 text-[10px]">
                {['all', 'head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'].map((part) => (
                  <button
                    key={part}
                    onClick={() => setSelectedBodyPart(part)}
                    className={`px-1.5 py-0.5 rounded capitalize font-medium transition-colors ${
                      selectedBodyPart === part
                        ? 'bg-[#00a2ff] text-white'
                        : 'bg-[#121315] text-[#8b949e] hover:text-white'
                    }`}
                  >
                    {part === 'all' ? 'All' : part.replace(/([A-Z])/g, ' $1')}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 p-2 bg-[#121315] border border-[#2B2D2F] rounded-lg">
                {ROBLOX_PALETTE.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleApplyColor(c.hex)}
                    className="flex flex-col items-center gap-1 p-1 rounded hover:bg-[#191B1D] transition-all cursor-pointer"
                    title={c.name}
                  >
                    <span
                      className="w-6 h-6 rounded-md border border-white/20 shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[9px] text-[#8b949e] truncate w-full text-center">
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Custom Sliders for Sizing */}
          {studioTab === 'scales' && (
            <div className="flex flex-col gap-3 bg-[#121315] p-2.5 rounded-lg border border-[#2B2D2F] text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-[#2B2D2F]">
                <span className="text-[#8b949e] text-[11px]">Rig Type:</span>
                <div className="flex gap-1">
                  {['R15', 'R6'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setAvatar((prev) => ({ ...prev, playerAvatarType: type }))}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        avatar.playerAvatarType === type
                          ? 'bg-[#00a2ff] text-white'
                          : 'bg-[#191B1D] text-[#8b949e]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Sliders (No raw HTML slider) */}
              <CustomSlider
                min={0.9}
                max={1.1}
                step={0.01}
                value={avatar.scales?.height || 1.0}
                onChange={(val) =>
                  setAvatar((prev) => ({
                    ...prev,
                    scales: { ...prev.scales, height: val },
                  }))
                }
                label="Height"
                unit="%"
              />

              <CustomSlider
                min={0.8}
                max={1.05}
                step={0.01}
                value={avatar.scales?.width || 1.0}
                onChange={(val) =>
                  setAvatar((prev) => ({
                    ...prev,
                    scales: { ...prev.scales, width: val },
                  }))
                }
                label="Width"
                unit="%"
              />

              <CustomSlider
                min={0.9}
                max={1.05}
                step={0.01}
                value={avatar.scales?.head || 1.0}
                onChange={(val) =>
                  setAvatar((prev) => ({
                    ...prev,
                    scales: { ...prev.scales, head: val },
                  }))
                }
                label="Head Scale"
                unit="%"
              />
            </div>
          )}

          {/* Tab 4: Base Player Picker */}
          {studioTab === 'base' && (
            <div className="flex flex-col gap-2.5 bg-[#121315] p-2.5 rounded-lg border border-[#2B2D2F] text-xs">
              <p className="text-[11px] text-[#8b949e]">
                Choose whose body to use as your base:
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleChangeBasePlayer();
                }}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  value={basePlayerInput}
                  onChange={(e) => setBasePlayerInput(e.target.value)}
                  placeholder="Username or ID..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-[#191B1D] border border-[#2B2D2F] rounded-md text-white focus:outline-none focus:border-[#00a2ff]"
                  disabled={isChangingPlayer}
                />
                <button
                  type="submit"
                  disabled={isChangingPlayer || !basePlayerInput.trim()}
                  className="px-2.5 py-1.5 bg-[#00a2ff] hover:bg-[#38bdf8] text-white text-xs font-semibold rounded-md disabled:opacity-50"
                >
                  {isChangingPlayer ? '...' : 'Load'}
                </button>
              </form>
              {playerError && (
                <p className="text-[10px] text-rose-400">{playerError}</p>
              )}

              {/* Quick Presets Menu */}
              <div className="flex flex-col gap-1 pt-1">
                <span className="text-[10px] text-[#8b949e] font-semibold uppercase">
                  Presets:
                </span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <button
                    onClick={handleResetToCleanTemplate}
                    className="p-1.5 rounded bg-[#191B1D] hover:bg-[#232527] text-[#c9d1d9] text-left truncate"
                  >
                    Clean Template
                  </button>
                  <button
                    onClick={() => handleChangeBasePlayer('156')}
                    className="p-1.5 rounded bg-[#191B1D] hover:bg-[#232527] text-[#c9d1d9] text-left truncate"
                  >
                    Builderman
                  </button>
                  <button
                    onClick={() => handleChangeBasePlayer('1')}
                    className="p-1.5 rounded bg-[#191B1D] hover:bg-[#232527] text-[#c9d1d9] text-left truncate"
                  >
                    Roblox
                  </button>
                  <button
                    onClick={() => handleChangeBasePlayer('261')}
                    className="p-1.5 rounded bg-[#191B1D] hover:bg-[#232527] text-[#c9d1d9] text-left truncate"
                  >
                    Shedletsky
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Marketplace Catalog & Saved Characters */}
        <div className="flex flex-col gap-3 bg-[#191B1D] border border-[#2B2D2F] rounded-xl p-3 sm:p-4 shadow-lg min-h-[500px] min-w-0">
          {/* Top Search & Item ID Input with Short Words */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#121315] border border-[#2B2D2F] rounded-lg text-xs text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#00a2ff]"
              />
            </div>

            <form onSubmit={handleLookupCustomItem} className="flex gap-1.5 shrink-0">
              <input
                type="text"
                value={customItemId}
                onChange={(e) => setCustomItemId(e.target.value)}
                placeholder="Item ID..."
                className="w-24 px-2 py-1.5 text-xs bg-[#121315] border border-[#2B2D2F] rounded-lg text-white placeholder:text-[#8b949e] focus:outline-none focus:border-[#00a2ff]"
                disabled={isLookingUpItem}
              />
              <button
                type="submit"
                disabled={isLookingUpItem || !customItemId.trim()}
                className="px-2.5 py-1.5 bg-[#00a2ff] hover:bg-[#38bdf8] text-white text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isLookingUpItem ? '...' : 'Add'}</span>
              </button>
            </form>
          </div>
          {itemLookupError && (
            <p className="text-[11px] text-rose-400">{itemLookupError}</p>
          )}

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'hats', label: 'Hats' },
              { id: 'hair', label: 'Hair' },
              { id: 'faces', label: 'Faces' },
              { id: 'shirts', label: 'Shirts' },
              { id: 'pants', label: 'Pants' },
              { id: 'accessories', label: 'Gears' },
              { id: 'saved', label: `⭐ Saved (${savedList.length})` },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setMarketCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-all cursor-pointer text-xs ${
                  marketCategory === cat.id
                    ? 'bg-[#2B2D2F] text-white border border-[#393B3D]'
                    : 'bg-[#121315] text-[#8b949e] hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Catalog Items Grid OR Saved Characters View */}
          {marketCategory === 'saved' ? (
            <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-bold text-white mb-2">
                Saved Characters ({savedList.length})
              </h3>

              {savedList.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8b949e] bg-[#121315] rounded-xl border border-[#2B2D2F] flex flex-col items-center justify-center flex-1">
                  <User className="w-8 h-8 opacity-30 mb-2" />
                  <p className="font-semibold text-white mb-1">No Saved Looks</p>
                  <p className="text-[#8b949e] max-w-xs text-[11px]">
                    Customize your character and click "Save", or click "Wear" on any outfit in the Explorer!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {savedList.map((char) => (
                    <div
                      key={char.id}
                      className="bg-[#121315] border border-[#2B2D2F] hover:border-[#393B3D] p-2.5 rounded-xl flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center gap-2.5 mb-2 min-w-0">
                        <div className="w-12 h-12 rounded-lg bg-[#191B1D] border border-[#2B2D2F] overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={char.previewUrl || char.baseUser?.avatarHeadshotUrl}
                            alt={char.name}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-white text-xs truncate">
                            {char.name}
                          </h4>
                          <p className="text-[10px] text-cyan-400">
                            {char.equippedItems?.length || 0} items
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleLoadSavedCharacter(char)}
                          className="flex-1 py-1 bg-[#00B06F] hover:bg-[#00c57c] text-white text-xs font-bold rounded-md transition-colors cursor-pointer"
                        >
                          Wear
                        </button>
                        <button
                          onClick={() => handleDeleteSavedCharacter(char.id, char.name)}
                          className="p-1 text-[#8b949e] hover:text-rose-400 bg-[#191B1D] rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              {filteredCatalog.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8b949e] bg-[#121315] rounded-xl border border-[#2B2D2F]">
                  No items found. Try another word or paste an Item ID above!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {filteredCatalog.map((item) => {
                    const isWorn = avatar.equippedItems.some((i) => i.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`group bg-[#121315] border rounded-lg p-2 flex flex-col justify-between transition-all duration-150 hover:-translate-y-0.5 min-w-0 ${
                          isWorn
                            ? 'border-[#00B06F] shadow-md shadow-emerald-950/20'
                            : 'border-[#2B2D2F] hover:border-[#393B3D]'
                        }`}
                      >
                        {/* Image Preview */}
                        <div className="w-full aspect-square rounded-md bg-gradient-to-b from-[#191B1D] to-[#0E0F10] border border-[#2B2D2F] overflow-hidden flex items-center justify-center mb-1.5 relative">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              // If image fails, fallback to clean thumbnail endpoint
                              e.currentTarget.src = `https://tr.rbxcdn.com/180DAY-2b16c733ccb551b1e5b300a86e6d0a27/420/420/Hat/Png/noFilter`;
                            }}
                          />
                          {isWorn && (
                            <div className="absolute top-1 right-1 px-1 py-0.2 rounded bg-[#00B06F] text-white text-[9px] font-bold shadow">
                              WORN
                            </div>
                          )}
                        </div>

                        {/* Title & Official Robux Price Badge */}
                        <div className="mb-2 min-w-0">
                          <h4
                            className="text-[11px] font-semibold text-white truncate"
                            title={item.name}
                          >
                            {item.name}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-[#8b949e] mt-0.5">
                            <span className="truncate max-w-[65px]">{item.creator}</span>
                            <RobuxBadge amount={item.price} className="text-white text-[10px]" />
                          </div>
                        </div>

                        {/* Short Action Buttons */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleItem(item)}
                            className={`flex-1 py-1 text-xs font-bold rounded-md transition-all cursor-pointer truncate ${
                              isWorn
                                ? 'bg-rose-900/40 hover:bg-rose-900/70 border border-rose-700/50 text-rose-200'
                                : 'bg-[#00B06F] hover:bg-[#00c57c] active:scale-95 text-white'
                            }`}
                          >
                            {isWorn ? 'Remove' : 'Try On'}
                          </button>

                          <a
                            href={`https://www.roblox.com/catalog/${item.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-[#191B1D] hover:bg-[#232527] border border-[#2B2D2F] rounded-md text-[#8b949e] hover:text-white transition-colors shrink-0"
                            title="Roblox Catalog"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
