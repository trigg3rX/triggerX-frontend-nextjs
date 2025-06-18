import React from "react";
import { twMerge } from "tailwind-merge";

interface CardProps {
  label?: string;
  value?: number | string;
  className?: string;
  children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  label,
  value,
  className = "",
  children,
}) => {
  const baseStyles =
    "rounded-xl transition-all duration-300 bg-[#1a1a1a] border border-[#5F5F5F] p-3";

  const combinedClassName = twMerge(baseStyles, className);

  return (
    <div className={combinedClassName}>
      {children ? (
        children
      ) : (
        <>
          {label && <div className="text-gray-400 text-sm mb-1">{label}</div>}
          {value !== undefined && (
            <div className="text-white font-semibold">
              {typeof value === "number" ? value.toFixed(2) : value}
            </div>
          )}
        </>
      )}
    </div>
  );
};
