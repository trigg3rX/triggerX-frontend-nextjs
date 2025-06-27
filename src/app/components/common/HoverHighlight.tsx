import React, { useRef, useState } from "react";
import { NavLinkProps } from "./header/NavLink";

interface HoverHighlightProps {
  children: React.ReactElement<Partial<NavLinkProps>>[];
  className?: string;
  highlightClassName?: string;
}

export const HoverHighlight: React.FC<HoverHighlightProps> = ({
  children,
  className = "",
  highlightClassName = "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A] rounded-[10px]",
}) => {
  const [highlightStyle, setHighlightStyle] = useState({
    width: "0px",
    left: "0px",
    opacity: 0,
    height: "100%",
  });
  const navRef = useRef<HTMLElement>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const navRect = navRef.current?.getBoundingClientRect();

    if (navRect) {
      setHighlightStyle({
        width: `${rect.width}px`,
        left: `${rect.left - navRect.left}px`,
        opacity: 1,
        height: `${rect.height}px`,
      });
    }
  };

  const handleMouseLeave = () => {
    setHighlightStyle({
      width: "0px",
      left: "0px",
      opacity: 0,
      height: "100%",
    });
  };

  return (
    <nav
      ref={navRef}
      className={`relative bg-[#181818F0] rounded-xl z-10 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute transition-all duration-300 ${highlightClassName}`}
        style={{
          ...highlightStyle,
          position: "absolute",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          pointerEvents: "none",
        }}
      />
      <div className="relative flex">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onMouseEnter: handleMouseEnter,
            });
          }
          return child;
        })}
      </div>
    </nav>
  );
};
