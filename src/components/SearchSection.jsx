import React from 'react';
import { SearchIcon, XIcon, HistoryIcon } from './Icons.jsx';

export function SearchSection({
  query,
  setQuery,
  onSearch,
  isLoading,
  recentSearches = [],
  onSelectRecent,
  onClearRecent,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch();
  };

  return (
    <div className="w-full bg-[#12161f] border border-[#2d333b] rounded-xl p-4 sm:p-5 mb-6 shadow-md">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8b949e]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type any Roblox Username or User ID..."
            className="w-full pl-10 pr-9 py-2.5 bg-[#090d13] border border-[#2d333b] rounded-lg text-white text-sm focus:outline-none focus:border-sky-500 transition-all placeholder:text-[#6e7681]"
            autoFocus
            disabled={isLoading}
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8b949e] hover:text-white transition-colors cursor-pointer"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm rounded-lg shadow transition-all shrink-0 cursor-pointer flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Finding...</span>
            </>
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[#21262d] text-xs text-[#8b949e]">
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#c9d1d9]">
            <HistoryIcon className="w-3 h-3 text-[#8b949e]" /> Recent:
          </span>
          {recentSearches.slice(0, 5).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                onSelectRecent(item);
              }}
              disabled={isLoading}
              className="px-2 py-0.5 rounded-md bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] hover:text-white text-xs border border-[#2d333b] transition-colors cursor-pointer"
            >
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={onClearRecent}
            className="text-[11px] text-[#8b949e] hover:text-rose-400 underline ml-auto transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
