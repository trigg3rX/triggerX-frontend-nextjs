"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import NavLink from "./NavLink";
import MobileMenu from "./MobileMenu";
import BalanceDisplay from "../ui/BalanceDisplay";
import logo from "@/app/assets/logo.svg";
import landingImg from "@/app/assets/navbar-landing.svg";
import Link from "next/link";
import { HoverHighlight } from "./HoverHighlight";

const navItems = [
  { href: "/devhub", label: "Dev Hub" },
  { href: "/", label: "Create Job" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
];

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 w-full headerbg bg-[#0a0a0a]/80 backdrop-blur-md z-50">
      {/* Desktop Header */}
      <div className="w-[90%] mx-auto my-6 md:my-8 header hidden lg:flex items-center justify-between">
        <div>
          <Link
            href="https://www.triggerx.network/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={logo}
              alt="TriggerX"
              width={180}
              height={40}
              priority
              className="w-[170px] h-auto"
            />
          </Link>
        </div>

        <div className="relative">
          <div
            className="absolute z-0 w-[500px] h-max transition-all duration-700 ease-out"
            style={{
              top: isScrolled ? -300 : -50, // Adjust as needed
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <Image
              src={landingImg}
              alt="Navigation Background Design"
              width={500}
              height={150}
              className="w-full h-auto"
            />
          </div>

          <nav className="relative bg-[#181818F0] rounded-xl z-10">
            <HoverHighlight>
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href}
                  className="text-center xl:w-[150px] lg:w-[120px] lg:text-[13px] xl:text-base text-gray-200 hover:text-white"
                  onClick={() => setMenuOpen(false)}
                />
              ))}
            </HoverHighlight>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
          {/* <BalanceDisplay /> */}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="w-[90%] mx-auto flex justify-between items-center my-6 header lg:hidden">
        <div
          className="absolute left-1/2 transform -translate-x-1/2 -translate-y-10 z-0 transition-all duration-700 ease-out"
          style={{
            top: isScrolled ? -100 : 15,
          }}
        >
          <Image
            src={landingImg}
            alt="Mobile Navigation Background"
            width={256}
            height={100}
            className="w-64 h-auto"
          />
        </div>

        <div className="flex-shrink-0 relative z-10">
          <a
            href="https://www.triggerx.network/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={logo}
              alt="TriggerX Logo"
              width={130}
              height={30}
              className="w-[140px] md:w-[170px] h-auto"
            />
          </a>
        </div>

        <div className="relative flex items-center gap-2 md:gap-4 z-10">
          <BalanceDisplay className="hidden sm:flex" />
          <ConnectButton
            chainStatus="none"
            accountStatus="address"
            showBalance={false}
          />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-2xl p-2 focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? "✖" : "☰"}
          </button>
          <MobileMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            navItems={navItems}
            currentPath={pathname}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
