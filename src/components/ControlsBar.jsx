import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

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
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-[#161b22] border border-[#30363d] p-2.5 rounded-xl">
      {/* Filter Segmented Control */}
      <div className="inline-flex p-1 bg-[#090d13] border border-[#30363d] rounded-lg">
        <button
          onClick={() => setFilterMode('custom')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
            filterMode === 'custom'
              ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          Player Outfits Only
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#21262d] text-white shadow-sm border border-[#30363d]'
              : 'text-[#8b949e] hover:text-[#f0f6fc]'
          }`}
        >
          All Looks & Clothes
        </button>
      </div>

      {/* Search Filter and Sorter */}
      <div className="flex items-center gap-2 flex-1 sm:justify-end">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8b949e]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search outfits by name..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#090d13] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc] focus:outline-none focus:border-[#00a2ff] focus:ring-1 focus:ring-[#00a2ff]/30 transition-all placeholder:text-[#8b949e]"
          />
        </div>

        {/* Sort Select */}
        <div className="relative shrink-0">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="pl-2.5 pr-7 py-1.5 bg-[#090d13] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc] focus:outline-none focus:border-[#00a2ff] appearance-none cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
          <ArrowUpDown className="w-3 h-3 text-[#8b949e] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="text-[11px] text-[#8b949e] shrink-0 font-mono hidden md:block pl-1">
          {filteredCount}/{totalCount}
        </div>
      </div>
    </div>
  );
}
