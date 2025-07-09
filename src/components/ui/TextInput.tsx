import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Typography } from "./Typography";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";

interface TextInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: "text" | "number" | "password";
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string | null;
  onValueChange?: (value: string) => void;
  id?: string;
  min?: number;
  max?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  type = "text",
  onFocus,
  onBlur,
  error = null,
  onValueChange,
  id,
  min,
  max,
}) => {
  const inputWidthClass = label ? "w-full md:w-[70%]" : "w-full";
  const [isFocused, setIsFocused] = useState(false);

  // Internal increment/decrement for number type
  const handleIncrement = () => {
    if (type !== "number") return;
    const current = Number(value) || 0;
    const next = max !== undefined ? Math.min(current + 1, max) : current + 1;
    onChange(next.toString());
    if (onValueChange) onValueChange(next.toString());
  };
  const handleDecrement = () => {
    if (type !== "number") return;
    const current = Number(value) || 0;
    const next =
      min !== undefined ? Math.max(current - 1, min) : Math.max(current - 1, 0);
    onChange(next.toString());
    if (onValueChange) onValueChange(next.toString());
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6 w-full">
      {label && (
        <Typography variant="h3" color="secondary" align="left">
          {label}
        </Typography>
      )}
      <div
        className={twMerge(
          "flex flex-col items-start relative",
          inputWidthClass,
        )}
      >
        <input
          type={type}
          className={twMerge(
            "w-full text-xs xs:text-sm sm:text-base bg-white/5 text-white py-2 sm:py-3 px-4 rounded-md sm:rounded-lg border border-white/10 placeholder-gray-400 outline-none focus:border-white/50",
            "[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]",
            error ? "border-red-500" : "",
            className,
          )}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (onValueChange) onValueChange(e.target.value);
          }}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            if (onFocus) onFocus();
          }}
          onBlur={() => {
            setIsFocused(false);
            if (onBlur) onBlur();
          }}
          id={id}
          min={min}
          max={max}
          onWheel={
            type === "number"
              ? (e) => (e.target as HTMLInputElement).blur()
              : undefined
          }
        />
        {type === "number" && isFocused && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col space-y-0 sm:space-y-0.5 z-10">
            <button
              type="button"
              tabIndex={-1}
              onClick={handleIncrement}
              className="p-0.5 hover:bg-white/10 rounded"
              onMouseDown={(e) => e.preventDefault()}
            >
              <IoIosArrowUp className="w-2 sm:w-3 h-2 sm:h-3 text-gray-400 hover:text-white text-base" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              onClick={handleDecrement}
              className="p-0.5 hover:bg-white/10 rounded"
              onMouseDown={(e) => e.preventDefault()}
            >
              <IoIosArrowDown className="w-2 sm:w-3 h-2 sm:h-3 text-gray-400 hover:text-white text-base" />
            </button>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-xs sm:text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};
