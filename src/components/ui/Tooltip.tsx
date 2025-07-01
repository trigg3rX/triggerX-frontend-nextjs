import React, { ReactNode, useState } from "react";

interface TooltipProps {
  title: string;
  children: ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const getTooltipPosition = (placement: string) => {
  switch (placement) {
    case "bottom":
      return "left-1/2 -translate-x-1/2 top-full mt-2";
    case "left":
      return "right-full mr-2 top-1/2 -translate-y-1/2";
    case "right":
      return "left-full ml-2 top-1/2 -translate-y-1/2";
    case "top":
    default:
      return "left-1/2 -translate-x-1/2 bottom-full mb-2";
  }
};

const Tooltip: React.FC<TooltipProps> = ({
  title,
  children,
  placement = "top",
  className = "",
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      tabIndex={0}
    >
      {children}
      {visible && (
        <div
          className={`w-[200px] xs:w-[240px] sm:w-[280px] md:w-[320px] absolute z-50 px-4 py-4 bg-[#181818] text-white text-xs rounded-xl border border-[#4B4A4A] shadow-lg whitespace-pre-line ${getTooltipPosition(placement)} text-gray-300 text-opacity-55`}
          role="tooltip"
        >
          {title}
        </div>
      )}
    </span>
  );
};

export default Tooltip;
