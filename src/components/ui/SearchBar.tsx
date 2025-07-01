import React, { ChangeEvent } from "react";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  placeholder = "Search",
  className = "",
}) => {
  return (
    <div className={`flex items-center w-full sm:w-auto max-w-xl ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={onSearchChange}
        className="bg-[#181818] text-[#EDEDED] border border-[#A2A2A2] placeholder-[#A2A2A2] rounded-l-full px-6 sm:px-6 py-3 focus:outline-none text-sm sm:text-base xl:text-lg shadow-none w-full sm:w-auto"
      />
      <button
        onClick={onClearSearch}
        className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors w-12 h-12 sm:w-12 sm:h-12 xl:w-14 xl:h-14 flex items-center justify-center -ml-5 sm:-ml-6 xl:-ml-5 z-10 border border-[#A2A2A2] rounded-full"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="none"
          viewBox="0 0 24 24"
          stroke="#fff"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line
            x1="21"
            y1="21"
            x2="16.65"
            y2="16.65"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default SearchBar;
