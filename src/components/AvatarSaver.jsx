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
import { saveCharacter, setActiveAvatar } from '../services/catalog.js';
import { AuthModal } from './AuthModal.jsx';
import {
  UploadCloud,
  FileUp,
  Image as ImageIcon,
  Box,
  FileCode,
  File,
  Search,
  Filter,
  Trash2,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Cloud,
  HardDrive,
  Database,
  ArrowUpDown,
  LayoutGrid,
  List as ListIcon,
  Tag,
  Plus,
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

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

  // Load avatars from IndexedDB on initial render
  const loadAvatars = async () => {
    setIsLoading(true);
    try {
      const items = await getAllFromIndexedDB();
      setAvatars(items);

      // If user is logged in, perform sync from Firestore
      if (user?.uid) {
        setIsSyncing(true);
        try {
          const syncedItems = await syncFromFirestore(user.uid);
          setAvatars(syncedItems);
          setSyncMessage('Synced with cloud storage');
          setTimeout(() => setSyncMessage(null), 3500);
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
      // Push any unsynced local avatars to Firestore
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
      setSyncMessage('All avatars synced across your devices!');
      setTimeout(() => setSyncMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setSyncMessage('Sync finished with local storage.');
      setTimeout(() => setSyncMessage(null), 3500);
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

  // Drag and Drop handlers
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
      setTimeout(() => setSyncMessage(null), 3500);
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

  // Wear in Avatar Maker
  const handleWearInMaker = (item, e) => {
    if (e) e.stopPropagation();
    const charData = {
      id: `char_saved_${item.id}`,
      name: item.name,
      baseUser: null,
      playerAvatarType: 'R15',
      previewUrl: item.dataUrl || 'https://tr.rbxcdn.com/30DAY-Avatar-Png',
      equippedItems: [],
    };
    saveCharacter(charData);
    setActiveAvatar(charData);
    navigate('/creator');
  };

  // Copy Data URL
  const handleCopyData = (item, e) => {
    if (e) e.stopPropagation();
    if (!item.dataUrl) return;
    navigator.clipboard.writeText(item.dataUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add demo avatar for quick testing if empty
  const handleAddSampleAvatar = async () => {
    try {
      // Create a canvas with a styled Roblox avatar badge
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');

      // Draw background gradient
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      grad.addColorStop(0, '#00a2ff');
      grad.addColorStop(1, '#0055ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);

      // Add roblox blocky character silhouette
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(140, 50, 120, 100, 12); // head
      ctx.roundRect(110, 160, 180, 140, 10); // torso
      ctx.roundRect(50, 160, 50, 130, 8); // arm
      ctx.roundRect(300, 160, 50, 130, 8); // arm
      ctx.roundRect(120, 310, 70, 80, 6); // leg
      ctx.roundRect(210, 310, 70, 80, 6); // leg
      ctx.fill();

      // Face smiley
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(175, 95, 8, 0, Math.PI * 2);
      ctx.arc(225, 95, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(200, 115, 20, 0, Math.PI);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#111827';
      ctx.stroke();

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const sampleFile = new File([blob], 'Classic_Blocky_Noob.png', { type: 'image/png' });

      await saveAvatarFile({
        file: sampleFile,
        name: 'Classic Blocky Character',
        description: 'Sample Roblox character saved for demonstration',
        tags: ['CLASSIC', 'NOOB', 'DEMO'],
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

  // Compute stats
  const totalBytes = useMemo(() => {
    return avatars.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  }, [avatars]);

  const syncedCount = useMemo(() => {
    return avatars.filter((item) => item.syncedToCloud).length;
  }, [avatars]);

  // Category Icon helper
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case '3d':
        return <Box className="w-4 h-4 text-purple-400" />;
      case 'config':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      default:
        return <File className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Avatar Saver & Library
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              /save
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
            Upload any avatar file (PNG, 3D model, RBXM, JSON config). Stored in IndexedDB & LocalStorage with cross-device Firebase cloud sync!
          </p>
        </div>

        {/* Quick Action / Auth state */}
        <div className="flex flex-wrap items-center gap-2">
          {user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 bg-[#161b22] hover:bg-[#21262d] border border-cyan-500/30 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold flex items-center justify-center text-[10px]">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="truncate max-w-[120px]">{user.displayName || user.email}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" title="Cloud Active" />
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Sign In for Cross-Device Sync</span>
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync with Cloud & refresh IndexedDB"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
        </div>
      </div>

      {/* Sync notification message banner */}
      {syncMessage && (
        <div className="mb-4 p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-cyan-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-cyan-400/80 hover:text-cyan-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8b949e]">Total Saved</p>
            <p className="text-base font-bold text-white">{avatars.length} Files</p>
          </div>
        </div>

        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8b949e]">Storage Used</p>
            <p className="text-base font-bold text-white">{formatBytes(totalBytes)}</p>
          </div>
        </div>

        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8b949e]">Cloud Synced</p>
            <p className="text-base font-bold text-white">
              {user ? `${syncedCount} / ${avatars.length}` : 'Local (Sign In)'}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-[#161b22] border border-[#30363d] rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-[#8b949e]">IndexedDB Cache</p>
            <p className="text-base font-bold text-white">Active (Offline Ready)</p>
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Hero Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all mb-8 ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]'
            : 'border-[#30363d] bg-[#161b22]/70 hover:border-[#484f58] hover:bg-[#161b22]'
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-1">
            Drag & Drop Any Avatar File Here
          </h3>
          <p className="text-xs text-[#8b949e] mb-4">
            Supports PNG avatar renders, 3D meshes (.obj, .glb, .rbxm), outfit JSON configs, textures, or character presets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <FileUp className="w-4 h-4" />
              <span>Browse Files from Device</span>
            </button>

            {avatars.length === 0 && (
              <button
                onClick={handleAddSampleAvatar}
                className="px-3.5 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-cyan-300 text-xs font-semibold rounded-xl border border-[#30363d] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Sample Roblox Avatar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 mb-6 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved avatars by name, tag, or extension..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-cyan-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#6e7681] outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
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
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Sort & View toggles */}
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] text-xs text-[#c9d1d9] rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest Size</option>
              <option value="size-asc">Smallest Size</option>
            </select>

            <div className="flex items-center bg-[#0d1117] border border-[#30363d] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'grid' ? 'bg-[#21262d] text-cyan-400' : 'text-[#8b949e] hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${
                  viewMode === 'list' ? 'bg-[#21262d] text-cyan-400' : 'text-[#8b949e] hover:text-white'
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
          <div className="w-10 h-10 rounded-full border-3 border-cyan-500/20 border-t-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#8b949e]">Loading saved avatars from IndexedDB & Cloud...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAvatars.length === 0 && (
        <div className="py-16 px-4 bg-[#161b22] border border-[#30363d] rounded-2xl text-center max-w-md mx-auto mb-8">
          <div className="w-12 h-12 rounded-full bg-[#21262d] flex items-center justify-center text-[#8b949e] mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Saved Avatars Found</h3>
          <p className="text-xs text-[#8b949e] mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'No avatar files match your filter criteria.'
              : 'You have not uploaded any avatar files yet. Drag & drop or browse above to store your first avatar!'}
          </p>
          {searchTerm || selectedCategory !== 'all' ? (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg border border-[#30363d] cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={handleAddSampleAvatar}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Roblox Avatar</span>
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
              className="group bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-cyan-500/50 rounded-2xl p-3 flex flex-col transition-all cursor-pointer relative shadow-sm hover:shadow-cyan-500/10 hover:-translate-y-0.5"
            >
              {/* Thumbnail / Preview */}
              <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#21262d] mb-2.5 overflow-hidden flex items-center justify-center relative">
                {item.category === 'image' && item.dataUrl ? (
                  <img
                    src={item.dataUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    {getCategoryIcon(item.category)}
                    <span className="text-[11px] font-bold text-white mt-1.5 uppercase tracking-wider">
                      {item.fileName.split('.').pop() || item.category}
                    </span>
                    <span className="text-[9px] text-[#8b949e]">{formatBytes(item.fileSize)}</span>
                  </div>
                )}

                {/* Cloud sync indicator */}
                <div className="absolute top-2 right-2">
                  {item.syncedToCloud ? (
                    <span
                      className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400"
                      title="Synced to Firebase Cloud"
                    >
                      <Cloud className="w-2.5 h-2.5" />
                    </span>
                  ) : (
                    <span
                      className="w-5 h-5 rounded-full bg-[#21262d]/80 border border-[#30363d] flex items-center justify-center text-[#8b949e]"
                      title="Stored in IndexedDB / LocalStorage"
                    >
                      <HardDrive className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Category tag */}
                <span className="absolute bottom-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[#c9d1d9] border border-white/10 uppercase">
                  {item.category}
                </span>
              </div>

              {/* Title & Metadata */}
              <h4 className="text-xs font-bold text-white truncate mb-0.5 group-hover:text-cyan-300 transition-colors">
                {item.name}
              </h4>
              <p className="text-[10px] text-[#8b949e] truncate mb-2">{item.fileName}</p>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2.5 overflow-hidden max-h-4">
                  {item.tags.slice(0, 2).map((t, i) => (
                    <span key={i} className="text-[9px] px-1 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-auto pt-2 border-t border-[#21262d] grid grid-cols-3 gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAvatar(item);
                  }}
                  className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] hover:text-white flex items-center justify-center text-[10px] font-semibold transition-colors"
                  title="Inspect"
                >
                  <Eye className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileDownload(item);
                  }}
                  className="p-1 rounded bg-[#21262d] hover:bg-[#30363d] text-cyan-400 hover:text-cyan-300 flex items-center justify-center text-[10px] font-semibold transition-colors"
                  title="Download File"
                >
                  <Download className="w-3 h-3" />
                </button>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1 rounded bg-[#21262d] hover:bg-rose-950/40 text-[#8b949e] hover:text-rose-400 flex items-center justify-center text-[10px] font-semibold transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && viewMode === 'list' && filteredAvatars.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden mb-8 divide-y divide-[#21262d]">
          {filteredAvatars.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedAvatar(item)}
              className="p-3.5 hover:bg-[#1c2128] flex items-center gap-3 transition-colors cursor-pointer"
            >
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#21262d] shrink-0 overflow-hidden flex items-center justify-center">
                {item.category === 'image' && item.dataUrl ? (
                  <img src={item.dataUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                ) : (
                  getCategoryIcon(item.category)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white truncate hover:text-cyan-300">{item.name}</h4>
                  <span className="text-[10px] font-mono text-[#8b949e] px-1.5 py-0.2 rounded bg-[#0d1117] border border-[#21262d]">
                    {item.fileName}
                  </span>
                  {item.syncedToCloud ? (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Cloud Synced
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#21262d] text-[#8b949e]">
                      Local Only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#8b949e] mt-0.5">
                  <span>{formatBytes(item.fileSize)}</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  {item.tags?.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="truncate">{item.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {item.category === 'image' && (
                  <button
                    onClick={(e) => handleWearInMaker(item, e)}
                    className="px-2.5 py-1 bg-[#00B06F]/20 hover:bg-[#00B06F]/30 text-[#00c57c] border border-[#00B06F]/30 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Wear in Avatar Maker"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Wear</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerFileDownload(item);
                  }}
                  className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-cyan-400 cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={(e) => handleDelete(item.id, e)}
                  className="p-1.5 rounded-lg bg-[#21262d] hover:bg-rose-950/40 text-[#8b949e] hover:text-rose-400 cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Details Modal (before final save) */}
      {isUploadModalOpen && pendingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12161f] border border-[#30363d] rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setPendingFile(null);
              }}
              className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#21262d]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>Save Avatar File</span>
            </h3>
            <p className="text-xs text-[#8b949e] mb-4">
              File: <span className="text-white font-mono">{pendingFile.name}</span> ({formatBytes(pendingFile.size)})
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
                  Avatar / Asset Name
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="e.g. Cyberpunk Ninja R15"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
                  Category
                </label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="image">Avatar Render / Image (PNG, JPG, WebP)</option>
                  <option value="3d">3D Asset / Model (.obj, .glb, .rbxm)</option>
                  <option value="config">Outfit Config / Preset (JSON, YAML)</option>
                  <option value="other">Other Asset / Accessory</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  placeholder="e.g. R15, Anime, Cool, Wings"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8b949e] uppercase mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                  placeholder="Notes about colors, hats, or character lore..."
                />
              </div>

              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl text-[11px] text-[#8b949e] space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dual Local + Cloud Storage</span>
                </div>
                <p>Saved immediately into browser IndexedDB and LocalStorage. {user ? 'Will also sync to your Firebase cloud account!' : 'Sign in anytime to sync to your phone and other devices.'}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setPendingFile(null);
                }}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
              >
                Save Avatar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect & Preview Modal */}
      {selectedAvatar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#12161f] border border-[#30363d] rounded-2xl max-w-xl w-full p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAvatar(null)}
              className="absolute top-4 right-4 text-[#8b949e] hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              {getCategoryIcon(selectedAvatar.category)}
              <h3 className="text-base font-bold text-white truncate">{selectedAvatar.name}</h3>
            </div>

            {/* Media Box */}
            <div className="w-full aspect-video max-h-72 rounded-xl bg-gradient-to-b from-[#1c2333] to-[#0d1117] border border-[#21262d] mb-4 flex items-center justify-center overflow-hidden relative">
              {selectedAvatar.category === 'image' && selectedAvatar.dataUrl ? (
                <img
                  src={selectedAvatar.dataUrl}
                  alt={selectedAvatar.name}
                  className="w-full h-full object-contain p-3"
                />
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#21262d] flex items-center justify-center mx-auto mb-2 text-cyan-400">
                    {getCategoryIcon(selectedAvatar.category)}
                  </div>
                  <p className="text-sm font-bold text-white">{selectedAvatar.fileName}</p>
                  <p className="text-xs text-[#8b949e]">{selectedAvatar.fileType}</p>
                </div>
              )}
            </div>

            {/* Metadata properties */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Original File Name</span>
                <span className="font-mono text-white truncate block">{selectedAvatar.fileName}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">File Size</span>
                <span className="font-semibold text-white">{formatBytes(selectedAvatar.fileSize)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Category</span>
                <span className="font-semibold text-cyan-300 capitalize">{selectedAvatar.category}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#21262d]">
                <span className="text-[10px] text-[#8b949e] block">Storage Status</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{selectedAvatar.syncedToCloud ? 'IndexedDB + Cloud' : 'IndexedDB + LocalStorage'}</span>
                </span>
              </div>
            </div>

            {selectedAvatar.description && (
              <div className="mb-4 p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[10px] text-[#8b949e] block mb-1 font-semibold uppercase">Description</span>
                <p className="text-xs text-white">{selectedAvatar.description}</p>
              </div>
            )}

            {selectedAvatar.tags && selectedAvatar.tags.length > 0 && (
              <div className="mb-4">
                <span className="text-[10px] text-[#8b949e] block mb-1 font-semibold uppercase">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAvatar.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[#21262d] text-cyan-300 text-[11px] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#21262d]">
              <button
                onClick={(e) => handleDelete(selectedAvatar.id, e)}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopyData(selectedAvatar, e)}
                  className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  title="Copy Data URI string"
                >
                  {copiedId === selectedAvatar.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Data</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => triggerFileDownload(selectedAvatar)}
                  className="px-3.5 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {selectedAvatar.category === 'image' && (
                  <button
                    onClick={(e) => handleWearInMaker(selectedAvatar, e)}
                    className="px-4 py-1.5 bg-[#00B06F] hover:bg-[#00c57c] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Wear in Maker</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal for Cross-Device Sync */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoggedIn={loadAvatars}
      />
    </main>
  );
}
