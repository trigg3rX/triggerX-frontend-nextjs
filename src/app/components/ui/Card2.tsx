import React from "react";
import { twMerge } from "tailwind-merge";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card2: React.FC<CardProps> = ({ children, className = "" }) => {
  const baseStyles =
    "rounded-xl  transition-all duration-300 bg-[#1a1a1a]  border border-[#2a2a2a]";

  const combinedClassName = twMerge(baseStyles, className);

  return <div className={combinedClassName}>{children}</div>;
};
