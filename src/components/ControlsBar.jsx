import React from 'react';
import { SearchIcon, ShirtIcon, LayersIcon, SparklesIcon } from './Icons.jsx';
import { CustomDropdown } from './CustomDropdown.jsx';

export function ControlsBar({
  filterMode,
  setFilterMode,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  filteredCount,
  totalCount,
}) {
  const sortOptions = [
    { value: 'default', label: 'Default Order' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'year-desc', label: 'Year (Newest)' },
    { value: 'year-asc', label: 'Year (Oldest)' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#12161f] border border-[#2d333b] p-2.5 rounded-xl shadow-md">
      {/* Segmented Filter Control */}
      <div className="inline-flex p-1 bg-[#090d13] border border-[#2d333b] rounded-lg">
        {/* 1. Player Outfits (Auto-on default) */}
        <button
          type="button"
          onClick={() => setFilterMode('custom')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterMode === 'custom'
              ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
              : 'text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          <ShirtIcon className="w-3.5 h-3.5 text-sky-400" />
          <span>Player Outfits</span>
        </button>

        {/* 2. Clothes & Items */}
        <button
          type="button"
          onClick={() => setFilterMode('clothes')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterMode === 'clothes'
              ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
              : 'text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          <LayersIcon className="w-3.5 h-3.5 text-purple-400" />
          <span>Clothes & Items</span>
        </button>

        {/* 3. All (Both) */}
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            filterMode === 'all'
              ? 'bg-[#1f2937] text-white shadow-sm border border-[#374151]'
              : 'text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>All</span>
        </button>
      </div>

      {/* Search Filter and Sorter */}
      <div className="flex items-center gap-2 flex-1 sm:justify-end">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8b949e]">
            <SearchIcon className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              filterMode === 'all'
                ? 'Search all items...'
                : filterMode === 'clothes'
                ? 'Search clothes, hats & items...'
                : 'Search player outfits...'
            }
            className="w-full pl-8 pr-3 py-1.5 bg-[#090d13] border border-[#2d333b] rounded-lg text-xs text-[#f0f6fc] focus:outline-none focus:border-sky-500 transition-all placeholder:text-[#6e7681]"
          />
        </div>

        {/* Custom Animated Sorter Dropdown */}
        <CustomDropdown
          value={sortOption}
          onChange={setSortOption}
          options={sortOptions}
          buttonClassName="py-1.5 bg-[#090d13] border-[#2d333b]"
        />

        <div className="text-[11px] text-[#8b949e] shrink-0 font-mono hidden md:block pl-1">
          {filteredCount}/{totalCount}
        </div>
      </div>
    </div>
  );
}
