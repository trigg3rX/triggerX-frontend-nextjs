"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import React from "react";
import { useRouter } from "next/navigation";
import BalanceDisplay from "../ui/BalanceDisplay";

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
    <div className="absolute top-full right-0 mt-3 bg-[#181818F0] backdrop-blur-sm p-4 rounded-md shadow-lg z-20 min-w-[200px] border border-[#4B4A4A]">
      <div className="flex flex-col gap-4 text-white">
        {navItems.map((item) => (
          <>
            <button // Using button for semantic click handling
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`w-full text-left
              ${currentPath === item.href ? "text-white font-semibold" : "text-gray-300 hover:text-white"}
              px-3 py-2 rounded-md cursor-pointer transition-colors duration-150 ease-in-out`}
            >
              {item.label}
            </button>
          </>
        ))}
        <BalanceDisplay className="hidden sm:flex" />
        <ConnectButton
          chainStatus="none"
          accountStatus="address"
          showBalance={false}
        />
      </div>
    </div>
  );
};

export default MobileMenu;
