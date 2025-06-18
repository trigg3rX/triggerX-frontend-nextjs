import React from "react";
import { Typography } from "./Typography";

export interface RadioOption {
  label: string;
  value: string | number | boolean;
  disabled?: boolean;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  name: string;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  options,
  value,
  onChange,
  name,
  className = "",
  orientation = "horizontal",
}) => {
  return (
    <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      {label && (
        <Typography variant="h3" color="secondary" align="left">
          {label}
        </Typography>
      )}
      <div
        className={`flex ${
          orientation === "horizontal" ? "space-x-6" : "flex-col space-y-4"
        } w-full md:w-[70%] ${className}`}
      >
        {options.map((option) => (
          <label
            key={option.value.toString()}
            className={`inline-flex items-center cursor-pointer ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={option.value.toString()}
              className="form-radio h-4 w-4 text-blue-500 accent-[#F8FF7C] "
              checked={value === option.value}
              onChange={() => !option.disabled && onChange(option.value)}
              disabled={option.disabled}
            />
            <span className="ml-2 text-white text-[10px] xs:text-xs sm:text-sm">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};
