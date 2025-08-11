"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface NavItem {
  href: string;
  label: string;
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  currentPath: string;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navItems,
  currentPath,
}) => {
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-3 bg-[#181818F0] backdrop-blur-sm rounded-md shadow-lg z-20 min-w-[280px] border border-[#4B4A4A]">
      <div className="flex flex-col text-white">
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNavigation(item.href)}
            className={`w-full text-left text-[12px] sm:text-[14px]
              ${currentPath === item.href ? "text-white" : "text-gray-300 hover:text-white"}
              px-4 py-3 rounded-md cursor-pointer transition-colors duration-150 ease-in-out hover:bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-transparent hover:border-[#4B4A4A]`}
          >
            {item.label}
          </button>
        ))}
        <div className="px-4 py-3 ">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
