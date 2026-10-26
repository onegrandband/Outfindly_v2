import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  saveAvatarFile,
  getAllFromIndexedDB,
  deleteAvatar,
  syncFromFirestore,
  syncItemToFirestore,
  formatBytes,
  triggerFileDownload,
  categorizeFile,
} from '../services/avatarStorage.js';
import { AuthModal } from './AuthModal.jsx';
import { CustomDropdown } from './CustomDropdown.jsx';
import {
  UploadIcon,
  SearchIcon,
  TrashIcon,
  DownloadIcon,
  EyeIcon,
  RefreshIcon,
  CheckIcon,
  CloudIcon,
  DeviceIcon,
  FolderIcon,
  CopyIcon,
  XIcon,
  ShirtIcon,
  GridIcon,
  ListIcon,
  TagIcon,
} from './Icons.jsx';

export function AvatarSaver() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Avatar items state
  const [avatars, setAvatars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Modals & UI
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    category: 'image',
    tags: '',
  });
  const [copiedId, setCopiedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'size-desc', label: 'Largest Size' },
    { value: 'size-asc', label: 'Smallest Size' },
  ];

  const categoryOptions = [
    { value: 'image', label: 'Avatar Render / Image (PNG, JPG, WebP)' },
    { value: '3d', label: '3D Asset / Model (.obj, .glb, .rbxm)' },
    { value: 'config', label: 'Outfit Config / Preset (JSON, YAML)' },
    { value: 'other', label: 'Other Asset / Accessory' },
  ];

  // Load avatars from IndexedDB on initial render
  const loadAvatars = async () => {
    setIsLoading(true);
    try {
      const items = await getAllFromIndexedDB();
      setAvatars(items);

      if (user?.uid) {
        setIsSyncing(true);
        try {
          const syncedItems = await syncFromFirestore(user.uid);
          setAvatars(syncedItems);
          setSyncMessage('Synced with cloud storage');
          setTimeout(() => setSyncMessage(null), 3000);
        } catch (err) {
          console.warn('Sync from firestore notice:', err);
        } finally {
          setIsSyncing(false);
        }
      }
    } catch (err) {
      console.error('Failed to load avatars from IndexedDB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvatars();
  }, [user]);

  // Handle manual sync
  const handleManualSync = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      for (const item of avatars) {
        if (!item.syncedToCloud) {
          try {
            await syncItemToFirestore(item, user.uid);
            item.syncedToCloud = true;
          } catch (e) {
            console.warn(e);
          }
        }
      }
      const refreshed = await syncFromFirestore(user.uid);
      setAvatars(refreshed);
      setSyncMessage('All avatars synced across devices!');
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setSyncMessage('Sync completed with local storage.');
      setTimeout(() => setSyncMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Stage file for upload
  const stageFileForUpload = (file) => {
    if (!file) return;
    const cat = categorizeFile(file.name, file.type);
    const defaultName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    setPendingFile(file);
    setUploadForm({
      name: defaultName,
      description: '',
      category: cat,
      tags: `${cat.toUpperCase()}, Custom`,
    });
    setIsUploadModalOpen(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      stageFileForUpload(e.dataTransfer.files[0]);
    }
  };

  // Confirm save
  const handleConfirmSave = async () => {
    if (!pendingFile) return;

    try {
      const tagsArray = uploadForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const saved = await saveAvatarFile({
        file: pendingFile,
        name: uploadForm.name,
        description: uploadForm.description,
        tags: tagsArray,
        category: uploadForm.category,
        userId: user?.uid || null,
      });

      setAvatars((prev) => [saved, ...prev.filter((i) => i.id !== saved.id)]);
      setIsUploadModalOpen(false);
      setPendingFile(null);
      setSyncMessage(`Saved "${saved.name}" to IndexedDB & LocalStorage`);
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save avatar file:', err);
      alert('Could not save file: ' + err.message);
    }
  };

  // Delete
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this avatar file?')) return;

    try {
      const remaining = await deleteAvatar(id, user?.uid);
      setAvatars(remaining);
      if (selectedAvatar?.id === id) {
        setSelectedAvatar(null);
      }
    } catch (err) {
      console.error('Failed to delete avatar:', err);
    }
  };

  // Copy Data URL
  const handleCopyData = (item, e) => {
    if (e) e.stopPropagation();
    if (!item.dataUrl) return;
    navigator.clipboard.writeText(item.dataUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add demo avatar for quick testing
  const handleAddSampleAvatar = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 400, 400);

      // Simple character silhouette
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(140, 50, 120, 100, 10);
      ctx.roundRect(110, 160, 180, 140, 8);
      ctx.roundRect(50, 160, 50, 130, 6);
      ctx.roundRect(300, 160, 50, 130, 6);
      ctx.roundRect(120, 310, 70, 80, 4);
      ctx.roundRect(210, 310, 70, 80, 4);
      ctx.fill();

      // Face
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(175, 95, 7, 0, Math.PI * 2);
      ctx.arc(225, 95, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(200, 115, 18, 0, Math.PI);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const sampleFile = new File([blob], 'Classic_Blocky_Avatar.png', { type: 'image/png' });

      await saveAvatarFile({
        file: sampleFile,
        name: 'Classic Blocky Avatar',
        description: 'Sample avatar file stored in local IndexedDB',
        tags: ['CLASSIC', 'AVATAR'],
        category: 'image',
        userId: user?.uid || null,
      });

      await loadAvatars();
    } catch (err) {
      console.error('Failed to add sample avatar:', err);
    }
  };

  // Filtered & Sorted list
  const filteredAvatars = useMemo(() => {
    return avatars
      .filter((item) => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase().trim();
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesFile = item.fileName.toLowerCase().includes(q);
          const matchesTag = (item.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchesName && !matchesFile && !matchesTag) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
        if (sortBy === 'size-desc') return (b.fileSize || 0) - (a.fileSize || 0);
        if (sortBy === 'size-asc') return (a.fileSize || 0) - (b.fileSize || 0);
        return 0;
      });
  }, [avatars, selectedCategory, searchTerm, sortBy]);

  const totalBytes = useMemo(() => {
    return avatars.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }, [avatars]);

  const syncedCount = useMemo(() => {
    return avatars.filter((item) => item.syncedToCloud).length;
  }, [avatars]);

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Avatar Saver & Library
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1e293b] text-sky-400 border border-[#334155]">
              /save
            </span>
          </div>
          <p className="text-xs text-[#8b949e] mt-1">
            Store any avatar file in IndexedDB & LocalStorage with cross-device cloud sync.
          </p>
        </div>

        {/* Action / Auth bar */}
        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 bg-[#12161f] hover:bg-[#1a212e] border border-[#2d333b] text-white rounded-xl text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[120px]">{user.displayName || user.email}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <DeviceIcon className="w-3.5 h-3.5" />
              <span>Sign In to Sync Across Devices</span>
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] text-[#f0f6fc] border border-[#2d333b] rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync with cloud"
          >
            <RefreshIcon className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-4 p-3 bg-[#1e293b]/60 border border-[#334155] rounded-xl text-sky-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon className="w-4 h-4 text-sky-400" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-[#8b949e] hover:text-white">
            <XIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Storage Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-[#12161f] border border-[#2d333b] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a212e] border border-[#2d333b] flex items-center justify-center text-sky-400">
            <FolderIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e]">Files Stored</p>
            <p className="text-sm font-bold text-white">{avatars.length} Files</p>
          </div>
        </div>

        <div className="p-3 bg-[#12161f] border border-[#2d333b] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a212e] border border-[#2d333b] flex items-center justify-center text-purple-400">
            <DeviceIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e]">IndexedDB Space</p>
            <p className="text-sm font-bold text-white">{formatBytes(totalBytes)}</p>
          </div>
        </div>

        <div className="p-3 bg-[#12161f] border border-[#2d333b] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a212e] border border-[#2d333b] flex items-center justify-center text-emerald-400">
            <CloudIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e]">Cloud Synced</p>
            <p className="text-sm font-bold text-white">
              {user ? `${syncedCount} / ${avatars.length}` : 'Local Only'}
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#12161f] border border-[#2d333b] rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1a212e] border border-[#2d333b] flex items-center justify-center text-[#94a3b8]">
            <CheckIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-[#8b949e]">Status</p>
            <p className="text-sm font-bold text-white">Offline Ready</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Hero Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all mb-7 ${
          isDragging
            ? 'border-sky-500 bg-[#162032]'
            : 'border-[#2d333b] bg-[#12161f] hover:border-[#4b5563]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              stageFileForUpload(e.target.files[0]);
            }
          }}
        />

        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-[#1e293b] border border-[#334155] flex items-center justify-center text-sky-400 mb-3">
            <UploadIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Drag & Drop Any Avatar File Here
          </h3>
          <p className="text-xs text-[#8b949e] mb-4">
            Upload any file: PNG/JPG renders, 3D meshes (.obj, .glb, .rbxm), or JSON outfit presets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <UploadIcon className="w-3.5 h-3.5" />
              <span>Browse Files</span>
            </button>

            {avatars.length === 0 && (
              <button
                onClick={handleAddSampleAvatar}
                className="px-3.5 py-2 bg-[#1f2937] hover:bg-[#374151] text-[#c9d1d9] text-xs font-medium rounded-lg border border-[#374151] transition-colors cursor-pointer"
              >
                <span>Add Sample Avatar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#12161f] border border-[#2d333b] rounded-xl p-3.5 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <SearchIcon className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved files by name, tag, or format..."
              className="w-full bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg pl-8 pr-8 py-1.5 text-xs text-white placeholder-[#6e7681] outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Files' },
              { id: 'image', label: 'Renders/Images' },
              { id: '3d', label: '3D Models' },
              { id: 'config', label: 'Configs' },
              { id: 'other', label: 'Other' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#1f2937] text-white border border-[#374151]'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#161b22]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Custom Animated Sort Dropdown & View Mode */}
          <div className="flex items-center gap-2 shrink-0">
            <CustomDropdown
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              buttonClassName="bg-[#090d13] border-[#2d333b]"
            />

            <div className="flex items-center bg-[#090d13] border border-[#2d333b] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid' ? 'bg-[#1f2937] text-sky-400' : 'text-[#8b949e] hover:text-white'
                }`}
                title="Grid View"
              >
                <GridIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'list' ? 'bg-[#1f2937] text-sky-400' : 'text-[#8b949e] hover:text-white'
                }`}
                title="List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-[#8b949e]">Reading stored avatars from IndexedDB...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAvatars.length === 0 && (
        <div className="py-16 px-4 bg-[#12161f] border border-[#2d333b] rounded-xl text-center max-w-md mx-auto mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#1e293b] flex items-center justify-center text-[#8b949e] mx-auto mb-2.5">
            <FolderIcon className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No Saved Avatars</h3>
          <p className="text-xs text-[#8b949e] mb-3">
            {searchTerm || selectedCategory !== 'all'
              ? 'No files matched your filter query.'
              : 'You have not uploaded any avatar files yet. Drag & drop any file above!'}
          </p>
          {searchTerm || selectedCategory !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1f2937] hover:bg-[#374151] text-white rounded-lg border border-[#374151] cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={handleAddSampleAvatar}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              Load Sample Avatar
            </button>
          )}
        </div>
      )}

      {/* Grid View */}
      {!isLoading && viewMode === 'grid' && filteredAvatars.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 mb-8">
          {filteredAvatars.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAvatar(item)}
              className="group bg-[#12161f] hover:bg-[#181e2b] border border-[#2d333b] hover:border-[#4b5563] rounded-xl p-3 flex flex-col transition-all cursor-pointer relative shadow-sm hover:-translate-y-0.5"
            >
              {/* Thumbnail Container */}
              <div className="w-full aspect-square rounded-lg bg-[#0a0d14] border border-[#21262d] mb-2 overflow-hidden flex items-center justify-center relative">
                {item.category === 'image' && item.dataUrl ? (
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    <FolderIcon className="w-6 h-6 text-sky-400 mb-1" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {item.fileName.split('.').pop() || item.category}
                    </span>
                    <span className="text-[9px] text-[#8b949e]">{formatBytes(item.fileSize)}</span>
                  </div>
                )}

                {/* Cloud sync indicator */}
                <div className="absolute top-1.5 right-1.5">
                  {item.syncedToCloud ? (
                    <span
                      className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400"
                      title="Synced to Cloud"
                    >
                      <CloudIcon className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span
                      className="w-4 h-4 rounded-full bg-[#1e293b] border border-[#334155] flex items-center justify-center text-[#8b949e]"
                      title="IndexedDB local"
                    >
                      <DeviceIcon className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <span className="absolute bottom-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.2 rounded bg-black/70 text-[#c9d1d9] border border-white/10 uppercase">
                  {item.category}
                </span>
              </div>

              {/* Title & Metadata */}
              <h4 className="text-xs font-semibold text-white truncate mb-0.5 group-hover:text-sky-300 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-[#8b949e] truncate mb-2">{item.fileName}</p>

              {/* Action Buttons */}
              <div className="mt-auto pt-2 border-t border-[#21262d] grid grid-cols-3 gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAvatar(item);
                  }}
                  className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-[#c9d1d9] hover:text-white flex items-center justify-center text-[10px] transition-colors"
                  title="Inspect"
                >
                  <EyeIcon className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileDownload(item);
                  }}
                  className="p-1 rounded bg-[#1f2937] hover:bg-[#374151] text-sky-400 hover:text-sky-300 flex items-center justify-center text-[10px] transition-colors"
                  title="Download File"
                >
                  <DownloadIcon className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1 rounded bg-[#1f2937] hover:bg-rose-950/40 text-[#8b949e] hover:text-rose-400 flex items-center justify-center text-[10px] transition-colors"
                  title="Delete"
                >
                  <TrashIcon className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && filteredAvatars.length > 0 && (
        <div className="bg-[#12161f] border border-[#2d333b] rounded-xl overflow-hidden mb-8 divide-y divide-[#21262d]">
          {filteredAvatars.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAvatar(item)}
              className="p-3 hover:bg-[#1a212e] flex items-center gap-3 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-[#0a0d14] border border-[#21262d] shrink-0 overflow-hidden flex items-center justify-center">
                {item.category === 'image' && item.dataUrl ? (
                  <img src={item.dataUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <FolderIcon className="w-5 h-5 text-sky-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white truncate">{item.name}</h4>
                  <span className="text-[10px] font-mono text-[#8b949e] px-1.5 py-0.2 rounded bg-[#0d1117] border border-[#21262d]">
                    {item.fileName}
                  </span>
                  {item.syncedToCloud ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Cloud
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e293b] text-[#8b949e]">
                      Local
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#8b949e] mt-0.5">
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileDownload(item);
                  }}
                  className="p-1.5 rounded-lg bg-[#1f2937] hover:bg-[#374151] text-sky-400 cursor-pointer"
                  title="Download File"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 rounded-lg bg-[#1f2937] hover:bg-rose-950/40 text-[#8b949e] hover:text-rose-400 cursor-pointer"
                  title="Delete File"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Details Modal */}
      {isUploadModalOpen && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12161f] border border-[#2d333b] rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setPendingFile(null);
              }}
              className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#1f2937] cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UploadIcon className="w-4 h-4 text-sky-400" />
              <span>Save Avatar File</span>
            </h3>
            <p className="text-xs text-[#8b949e] mb-4">
              File: <span className="text-white font-mono">{pendingFile.name}</span> ({formatBytes(pendingFile.size)})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] uppercase mb-1">
                  Avatar / Asset Name
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  placeholder="e.g. Cyberpunk Outfit Look"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] uppercase mb-1">
                  Category
                </label>
                <CustomDropdown
                  value={uploadForm.category}
                  onChange={(val) => setUploadForm({ ...uploadForm, category: val })}
                  options={categoryOptions}
                  className="w-full"
                  buttonClassName="w-full py-2 bg-[#090d13] border-[#2d333b]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] uppercase mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                  placeholder="e.g. R15, Anime, Cool"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#8b949e] uppercase mb-1">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full bg-[#090d13] border border-[#2d333b] focus:border-sky-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none resize-none"
                  placeholder="Notes about items, hats, or character design..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setPendingFile(null);
                }}
                className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Save File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect & Preview Modal */}
      {selectedAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12161f] border border-[#2d333b] rounded-2xl max-w-xl w-full p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAvatar(null)}
              className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#1f2937] transition-colors cursor-pointer"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <FolderIcon className="w-4 h-4 text-sky-400" />
              <h3 className="text-base font-bold text-white truncate">{selectedAvatar.name}</h3>
            </div>

            {/* Media Box */}
            <div className="w-full aspect-video max-h-72 rounded-xl bg-[#0a0d14] border border-[#2d333b] mb-4 flex items-center justify-center overflow-hidden">
              {selectedAvatar.category === 'image' && selectedAvatar.dataUrl ? (
                <img
                  src={selectedAvatar.dataUrl}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="w-14 h-14 rounded-xl bg-[#1e293b] flex items-center justify-center mx-auto mb-2 text-sky-400">
                    <FolderIcon className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-white">{selectedAvatar.fileName}</p>
                  <p className="text-xs text-[#8b949e]">{selectedAvatar.fileType}</p>
                </div>
              )}
            </div>

            {/* Metadata properties */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Original File</span>
                <span className="font-mono text-white truncate block">{selectedAvatar.fileName}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">File Size</span>
                <span className="font-semibold text-white">{formatBytes(selectedAvatar.fileSize)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Category</span>
                <span className="font-semibold text-sky-300 capitalize">{selectedAvatar.category}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Storage</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>{selectedAvatar.syncedToCloud ? 'IndexedDB + Cloud' : 'IndexedDB Local'}</span>
                </span>
              </div>
            </div>

            {selectedAvatar.description && (
              <div className="mb-4 p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[10px] text-[#8b949e] block mb-1 font-semibold uppercase">Notes</span>
                <p className="text-xs text-white">{selectedAvatar.description}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#21262d]">
              <button
                onClick={(e) => handleDelete(selectedAvatar.id, e)}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopyData(selectedAvatar, e)}
                  className="px-3 py-1.5 bg-[#1f2937] hover:bg-[#374151] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Copy Data URI string"
                >
                  {copiedId === selectedAvatar.id ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="w-3.5 h-3.5" />
                      <span>Copy Data</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => triggerFileDownload(selectedAvatar)}
                  className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoggedIn={loadAvatars}
      />
    </main>
  );
}
