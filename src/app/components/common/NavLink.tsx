"use client";

import React from "react";
import Link from "next/link";

export interface NavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onMouseEnter?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  onClick?: () => void; // Optional: if extra actions beyond navigation are needed
  className?: string;
}

const NavLink: React.FC<NavLinkProps> = ({
  href,
  label,
  isActive,
  onMouseEnter,
  onClick,
  className,
}) => {
  const activeClasses =
    "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] rounded-xl border border-[#4B4A4A]";
  const baseClasses = "py-3 rounded-xl cursor-pointer";

  return (
    <Link href={href} passHref legacyBehavior>
      <a
        onMouseEnter={onMouseEnter}
        onClick={onClick} // Handle navigation via Link, onClick for extra actions
        className={`${baseClasses} ${isActive ? activeClasses : "transparent"} ${className || ""}`}
      >
        {label}
      </a>
    </Link>
  );
};

export default NavLink;
