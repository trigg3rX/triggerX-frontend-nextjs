import React, { useRef, useEffect, useState } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { twMerge } from "tailwind-merge";
import { Typography } from "./Typography";

export interface DropdownOption {
  id: string | number;
  name: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  label?: string;
  options: DropdownOption[];
  selectedOption: string;
  onChange: (option: DropdownOption) => void;
  className?: string;
  icons?: Record<string, React.ReactNode>;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedOption,
  onChange,
  className = "",
  icons = {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
      {label && (
        <Typography variant="h3" color="secondary" align="left">
          {label}
        </Typography>
      )}
      <div
        ref={dropdownRef}
        className={twMerge("relative w-full md:w-[70%]", className)}
      >
        <div
          className="text-sm xs:text-sm sm:text-base w-full bg-[#1a1a1a] text-white py-3 px-4 rounded-lg cursor-pointer border border-white/10 flex items-center gap-5"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {icons[selectedOption] && (
            <span className="w-6 h-6 font-actayRegular text-xs xs:text-sm sm:text-base">
              {icons[selectedOption]}
            </span>
          )}
          <Typography variant="body" color="primary">
            {selectedOption}
          </Typography>
          <IoIosArrowDown
            className={`absolute top-4 right-4 text-white text-base transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isOpen && (
          <div className="absolute top-14 w-full bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden shadow-lg z-10">
            {options.map((option) => (
              <div
                key={option.id}
                className="py-3 px-4 hover:bg-[#333] cursor-pointer rounded-lg flex items-center gap-5 text-sm xs:text-sm sm:text-base"
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
              >
                {icons[option.name] && (
                  <span className="w-6 h-6">{icons[option.name]}</span>
                )}
                <Typography variant="body" color="primary">
                  {option.name}
                </Typography>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
