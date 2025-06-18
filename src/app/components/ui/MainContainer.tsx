import React from "react";
import { twMerge } from "tailwind-merge";

type CardVariant = "default" | "gradient";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  isActive?: boolean;
}

export const MainContainer: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  isActive = false,
}) => {
  const baseStyles = "rounded-2xl p-6 transition-all duration-300";

  const variantStyles = {
    default: "bg-[#141414] backdrop-blur-xl border border-white/10 ",
    gradient: isActive
      ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white"
      : "bg-white/5 border border-white/10",
  };

  const combinedClassName = twMerge(
    baseStyles,
    variantStyles[variant],
    className,
  );

  return <div className={combinedClassName}>{children}</div>;
};
