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
  disabled?: boolean;
  color?: "primary" | "secondary";
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  selectedOption,
  onChange,
  className = "",
  icons = {},
  disabled = false,
  color = "primary",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const colorClasses = {
    primary: {
      trigger:
        "bg-[#1a1a1a] border-white/10 text-white hover:border-white/30 focus:border-white/30",
      menu: "bg-[#1a1a1a] border-white/10",
      optionHover: "hover:bg-white/10",
    },
    secondary: {
      trigger:
        "bg-white/5 border-white/10 text-white hover:border-white/30 focus:border-white/30",
      menu: "bg-[#2a2a2a] border-white/10",
      optionHover: "hover:bg-white/10",
    },
  };

  const selectedColors = colorClasses[color] || colorClasses.primary;

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
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
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
          className={twMerge(
            "text-xs xs:text-sm sm:text-base w-full py-2.5 sm:py-3 px-4 rounded-md sm:rounded-lg cursor-pointer border flex items-center gap-5 transition-colors duration-200",
            selectedColors.trigger,
            disabled ? "opacity-50 cursor-not-allowed" : "",
          )}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
        >
          {icons[selectedOption] && (
            <span className="w-4 h-4 sm:w-6 sm:h-6">
              {icons[selectedOption]}
            </span>
          )}
          <Typography variant="body" color="primary">
            {selectedOption}
          </Typography>
          <IoIosArrowDown
            className={`absolute top-3.5 sm:top-4 right-4 w-3 h-3 sm:w-4 sm:h-4 text-white text-base transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>

        {isOpen && !disabled && (
          <div
            className={twMerge(
              "absolute top-12 sm:top-14 w-full rounded-md sm:rounded-xl overflow-hidden shadow-lg z-10 border",
              selectedColors.menu,
            )}
          >
            {options.map((option) => (
              <div
                key={option.id}
                className={twMerge(
                  "py-2.5 sm:py-3 px-4 cursor-pointer rounded-md sm:rounded-lg flex items-center gap-5 transition-colors",
                  selectedColors.optionHover,
                )}
                onClick={() => {
                  if (!disabled) {
                    onChange(option);
                    setIsOpen(false);
                  }
                }}
              >
                {icons[option.name] && (
                  <span className="w-4 h-4 sm:w-6 sm:h-6">
                    {icons[option.name]}
                  </span>
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
