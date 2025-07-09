import React from "react";
import { twMerge } from "tailwind-merge";

type CardVariant = "default" | "gradient" | "soft";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  isActive?: boolean;
  label?: string;
  value?: number | string;
  expanded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  isActive = false,
  label,
  value,
  expanded = false,
}) => {
  const baseStyles = "rounded-2xl p-5 sm:p-6 transition-all duration-300";
  const expandedStyles =
    "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border-2 border-white shadow-lg";

  const variantStyles = {
    default:
      "bg-[#141414] backdrop-blur-xl border border-white/10 hover:border-white/20",
    gradient: isActive
      ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white"
      : "bg-white/5 border border-white/10",
    soft: "bg-white/5 border border-white/10 rounded-lg",
  };

  const combinedClassName = twMerge(
    baseStyles,
    expanded ? expandedStyles : "",
    variantStyles[variant],
    className,
  );

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
