"use client";

import React from "react";
import Link from "next/link";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "paginationArrow"
  | "paginationActive"
  | "paginationInactive"
  | "paginationEllipsis";
type ButtonSize = "sm" | "md" | "lg";

interface ActionButtonProps {
  text: string;
  href?: string; // If it's a navigation link
  onClick?: () => void; // If it's an action button
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode; // For leading icon
  iconPosition?: "leading" | "trailing";
  openInNewTab?: boolean; // For links
  disabled?: boolean;
  type?: "button" | "submit" | "reset"; // HTML button type
  ariaLabel?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  href,
  onClick,
  className = "",
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "leading",
  openInNewTab = false,
  disabled = false,
  type = "button",
  ariaLabel,
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium ";
  const sizeClasses = {
    sm: "px-4 py-2 text-xs sm:text-sm",
    md: "px-5 py-2.5 text-sm sm:text-base", // Original style was closer to this
    lg: "px-8 py-3 text-base sm:text-lg",
  };

  const variantClasses = {
    primary:
      "bg-[#F8FF7C] text-black border border-transparent hover:bg-yellow-300 focus:ring-[#F8FF7C] transform hover:scale-105", // Yellow button
    secondary:
      "bg-[#222222] text-white border border-[#FFFFFF80]/50 hover:bg-[#333333] focus:ring-gray-500 relative overflow-hidden", // Dark button with animated bg
    ghost: "bg-transparent text-white ",
    paginationArrow: "bg-white text-black text-center w-10 h-10 rounded-xl  ",
    paginationActive:
      "bg-[#1B0825] border border-[#C07AF6] text-white font-bold w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#271039] hover:text-white", // purple border, filled
    paginationInactive:
      "bg-transparent border border-white text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-[#FFFFFF] hover:text-black", // transparent, white border
    paginationEllipsis:
      "bg-[#2D2D2D] text-white w-10 h-10 rounded-xl flex items-center justify-center cursor-default",
  };

  // Special animated background for 'secondary' variant
  const animatedBgSpan =
    variant === "secondary" ? (
      <>
        <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-1 group-focus:translate-y-1"></span>
        <span className="absolute inset-0 bg-white rounded-full scale-100 translate-y-0 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>{" "}
        {/* This seems like it was meant to be a white fill on hover */}
        {/* For actual text color change on hover, it's better handled by Tailwind's hover:text- utilities directly on the text span */}
      </>
    ) : null;

  const content = (
    <>
      {animatedBgSpan}
      <span
        className={`relative z-10 flex items-center justify-center ${variant === "secondary" ? "group-hover:text-black transition-colors duration-300" : ""}`}
      >
        {icon && iconPosition === "leading" && <span className="">{icon}</span>}
        {text}
        {icon && iconPosition === "trailing" && (
          <span className="">{icon}</span>
        )}
      </span>
    </>
  );

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  if (href) {
    const isExternal = href.startsWith("http");
    const target = openInNewTab || isExternal ? "_blank" : undefined;
    const rel = target === "_blank" ? "noopener noreferrer" : undefined;

    if (isExternal || target === "_blank") {
      return (
        <a
          href={href}
          className={combinedClasses}
          target={target}
          rel={rel}
          aria-label={ariaLabel || text}
        >
          {content}
        </a>
      );
    }
    return (
      <Link
        href={href}
        className={combinedClasses}
        aria-label={ariaLabel || text}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClasses}
      disabled={disabled}
      aria-label={ariaLabel || text}
    >
      {content}
    </button>
  );
};

export { ActionButton };
