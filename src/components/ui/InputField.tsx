import React from "react";
import { twMerge } from "tailwind-merge";
import { Typography } from "./Typography";

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
  readOnly?: boolean;
}

export const InputField: React.FC<TextInputProps> = ({
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
  readOnly,
}) => {
  const inputWidthClass = label ? "w-full md:w-[70%]" : "w-full";

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6 w-full">
      {label && (
        <Typography variant="h3" color="secondary" align="left">
          {label}
        </Typography>
      )}
      <div className={twMerge("flex flex-col items-start", inputWidthClass)}>
        <input
          type={type}
          className={twMerge(
            "w-full text-sm xs:text-sm sm:text-base bg-white/5 text-white py-3 px-4 rounded-lg border border-white/10 placeholder-gray-400 outline-none focus:border-white/50",
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
          onFocus={onFocus}
          onBlur={onBlur}
          id={id}
          readOnly={readOnly}
        />
        {error && (
          <div className="text-red-500 text-xs sm:text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
};
