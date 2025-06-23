import React from "react";
import { Typography } from "./Typography";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  disabled?: boolean;
  color?: "yellow" | "white" | "purple";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  disabled = false,
  color = "white",
  ...props
}) => {
  let bgColor = "bg-[#FFFFFF]";
  let textColor = "text-black";
  if (color === "yellow") bgColor = "bg-[#F8FF7C]";
  else if (color === "purple") {
    bgColor = "bg-[#C07AF6]";
    textColor = "text-white";
  }

  return (
    <button
      className={`relative bg-[#222222] border border-[#222222] px-4 py-1.5 xs:px-6 xs:py-2 sm:px-8 sm:py-3 text-nowrap rounded-full group transition-transform
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${className}`}
      disabled={disabled}
      {...props}
    >
      <span
        className={`absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out ${disabled ? " " : "group-hover:translate-y-2"}`}
      ></span>
      <span
        className={`absolute inset-0 ${bgColor} rounded-full scale-100 translate-y-0 group-hover:translate-y-0`}
      ></span>
      <span className="relative z-10 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out">
        <Typography variant="button" className={textColor}>
          {children}
        </Typography>
      </span>
    </button>
  );
};
