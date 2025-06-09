import React, { useRef, useState } from "react";
import { NavLinkProps } from "./NavLink";

interface HoverHighlightProps {
  children: React.ReactElement<Partial<NavLinkProps>>[];
  className?: string;
  highlightClassName?: string;
}

export const HoverHighlight: React.FC<HoverHighlightProps> = ({
  children,
  className = "",
  highlightClassName = "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]",
}) => {
  const [highlightStyle, setHighlightStyle] = useState({
    width: "0px",
    left: "0px",
    opacity: 0,
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
      });
    }
  };

  const handleMouseLeave = () => {
    setHighlightStyle({
      width: "0px",
      left: "0px",
      opacity: 0,
    });
  };

  return (
    <nav
      ref={navRef}
      className={`relative bg-[#181818F0] rounded-xl z-10 ${className}`}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`absolute rounded-xl transition-all duration-300 ${highlightClassName}`}
        style={{
          ...highlightStyle,
          height: "100%",
          transition: "all 0.3s ease-in-out",
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
