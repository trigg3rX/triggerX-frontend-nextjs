import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({ className = "", ...props }) => {
  return (
    <input
      className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none text-sm sm:text-base ${className}`}
      {...props}
    />
  );
};
