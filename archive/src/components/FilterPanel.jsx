import React from 'react';
import { 
  SlidersHorizontal, X, SortAsc, Library, Mic2, Tags, Calendar 
} from 'lucide-react';
import Logo from './ui/Logo';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { FilterCombobox } from './FilterCombobox';

export function FilterPanel({
  filterFormat, setFilterFormat,
  filterArtist, setFilterArtist,
  filterGenre, setFilterGenre,
  filterYear, setFilterYear,
  filterStatus, setFilterStatus,
  sortBy, setSortBy,
  uniqueArtists,
  uniqueGenres,
  uniqueYears,
  onClearAll
}) {
  const activeFiltersCount = [
    filterFormat !== "All",
    filterArtist !== "All",
    filterGenre !== "All",
    filterYear !== "All",
    filterStatus !== "All"
    // sortBy is always active, doesn't count as a "filter" per se
  ].filter(Boolean).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`flex items-center gap-2 rounded px-2 py-1 text-sm font-medium transition-colors cursor-pointer ${
            activeFiltersCount > 0 
              ? 'bg-neutral-800 text-emerald-400' 
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <SlidersHorizontal size={16} />
          <span className="hidden sm:inline">Filters</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-neutral-900">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 bg-neutral-900 border-neutral-800" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-white">Filter & Sort</h4>
            {activeFiltersCount > 0 && (
              <button 
                onClick={onClearAll}
                className="text-xs text-neutral-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Clear All
              </button>
            )}
          </div>
          
          <div className="space-y-3">
             {/* Sort */}
             <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 uppercase">Sort Order</label>
                <FilterCombobox
                    options={[
                        { value: "custom", label: "Custom" },
                        { value: "addedAt", label: "Recently Added" },
                        { value: "releaseDate", label: "Release Date" },
                        { value: "artist", label: "Artist" },
                        { value: "title", label: "Title" },
                    ]}
                    value={sortBy}
                    onChange={setSortBy}
                    placeholder="Sort By"
                    icon={SortAsc}
                    className="w-full"
                />
             </div>

             <div className="h-px bg-neutral-800 my-2" />

             {/* Filters */}
             <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase">Status</label>
                    <FilterCombobox
                        options={["Collection", "Wishlist", "Pre-order", "All"]}
                        value={filterStatus}
                        onChange={setFilterStatus}
                        placeholder="All Status"
                        icon={Library}
                        className="w-full"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase">Format</label>
                    <FilterCombobox
                        options={["Digital", "Vinyl", "CD", "Cassette"]}
                        value={filterFormat}
                        onChange={setFilterFormat}
                        placeholder="Format"
                        icon={Logo}
                        className="w-full"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-xs font-medium text-neutral-500 uppercase">Year</label>
                    <FilterCombobox
                        options={uniqueYears}
                        value={filterYear}
                        onChange={setFilterYear}
                        placeholder="Year"
                        icon={Calendar}
                        className="w-full"
                    />
                 </div>
                 
                 <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase">Artist</label>
                    <FilterCombobox
                        options={uniqueArtists}
                        value={filterArtist}
                        onChange={setFilterArtist}
                        placeholder="All Artists"
                        searchPlaceholder="Search artists..."
                        icon={Mic2}
                        className="w-full"
                    />
                 </div>

                 <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-medium text-neutral-500 uppercase">Genre</label>
                    <FilterCombobox
                        options={uniqueGenres}
                        value={filterGenre}
                        onChange={setFilterGenre}
                        placeholder="All Genres"
                        searchPlaceholder="Search genres..."
                        icon={Tags}
                        className="w-full"
                    />
                 </div>
             </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
