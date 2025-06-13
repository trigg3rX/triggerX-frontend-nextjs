// components/layout/Footer.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Tooltip } from "antd";
import Link from "next/link";
import { FooterNavSection } from "./FooterNavSection";

import logo from "@/app/assets/footer_svgs/footerLogo.svg";
import footer1 from "@/app/assets/footer_svgs/footer1.png";
import footer2 from "@/app/assets/footer_svgs/footer2.png";
import github from "@/app/assets/footer_svgs/github.svg";
import githubdark from "@/app/assets/footer_svgs/githubdark.svg";
import twitter from "@/app/assets/footer_svgs/twitter.svg";
import twitterdark from "@/app/assets/footer_svgs/twitterdark.svg";
import telegram from "@/app/assets/footer_svgs/telegram.svg";
import telegramdark from "@/app/assets/footer_svgs/telegramdark.svg";
import gitbook from "@/app/assets/footer_svgs/gitbook.svg";
import gitbookdark from "@/app/assets/footer_svgs/gitbookdark.svg";
import mirror from "@/app/assets/footer_svgs/mirror.svg";
import mirrordark from "@/app/assets/footer_svgs/mirrordark.svg";
import medium from "@/app/assets/footer_svgs/medium.svg";
import mediumdark from "@/app/assets/footer_svgs/mediumdark.svg";
import youtube from "@/app/assets/footer_svgs/youtube.svg";
import youtubedark from "@/app/assets/footer_svgs/youtubedark.svg";

interface SocialLinkItem {
  id: string;
  title: string;
  href: string;
  iconLight: string;
  iconDark: string;
  applyBorderEffect: boolean;
  alt: string;
}

// Define interface for navigation links
interface FooterNavItemBase {
  id: string;
  label: string;
  className: string;
  title?: string;
}

interface FooterLinkItem extends FooterNavItemBase {
  isLink: true;
  href: string;
  target?: string;
  rel?: string;
}

interface FooterSpanItem extends FooterNavItemBase {
  isLink: false;
}

type FooterNavItem = FooterLinkItem | FooterSpanItem;

const footerSocialLinks: SocialLinkItem[] = [
  {
    id: "github",
    title: "Github",
    href: "https://github.com/trigg3rX",
    iconLight: github,
    iconDark: githubdark,
    applyBorderEffect: true,
    alt: "TriggerX on GitHub",
  },
  {
    id: "twitter",
    title: "Twitter",
    href: "https://x.com/TriggerXnetwork",
    iconLight: twitter,
    iconDark: twitterdark,
    applyBorderEffect: true,
    alt: "TriggerX on Twitter",
  },
  {
    id: "telegram",
    title: "Telegram",
    href: "https://t.me/triggerxnetwork",
    iconLight: telegram,
    iconDark: telegramdark,
    applyBorderEffect: true,
    alt: "TriggerX on Telegram",
  },
  {
    id: "gitbook",
    title: "Gitbook",
    href: "https://triggerx.gitbook.io/triggerx-docs",
    iconLight: gitbook,
    iconDark: gitbookdark,
    applyBorderEffect: true,
    alt: "TriggerX on GitBook",
  },
  {
    id: "mirror",
    title: "Mirror",
    href: "https://mirror.xyz/0x0255F7A175f73a05765719c165445F63155aF8E9",
    iconLight: mirror,
    iconDark: mirrordark,
    applyBorderEffect: true,
    alt: "TriggerX on Mirror",
  },
  {
    id: "medium",
    title: "Medium",
    href: "https://medium.com/@triggerx",
    iconLight: medium,
    iconDark: mediumdark,
    applyBorderEffect: true,
    alt: "TriggerX on Medium",
  },
  {
    id: "youtube",
    title: "Youtube",
    href: "https://www.youtube.com/@triggerxnetwork",
    iconLight: youtube,
    iconDark: youtubedark,
    applyBorderEffect: true,
    alt: "TriggerX on YouTube",
  },
];

const footerNavLinksTop: FooterNavItem[] = [
  {
    id: "build",
    label: "Build",
    href: "/",
    isLink: true,
    className: "hover:text-gray-400 transition-colors",
  },
  {
    id: "docs",
    label: "Docs",
    href: "https://triggerx.gitbook.io/triggerx-docs",
    isLink: true,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "hover:text-gray-400 transition-colors",
  },
  {
    id: "devhub",
    label: "Dev Hub",
    href: "/devhub",
    isLink: true,
    className: "hover:text-gray-400 transition-colors",
  },
];

const footerNavLinksBottom: FooterNavItem[] = [
  {
    id: "joinAsKeeper",
    label: "Join As Keeper",
    href: "https://triggerx.gitbook.io/triggerx-docs/getting-started-as-keepers",
    isLink: true,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "hover:text-gray-400 transition-colors",
  },
  {
    id: "termsOfUse",
    label: "Term of Use",
    isLink: false,
    title: "Available Soon",
    className: "hover:text-gray-400 transition-colors cursor-default",
  },
  {
    id: "privacyPolicy",
    label: "Privacy Policy",
    isLink: false,
    title: "Available Soon",
    className: "hover:text-gray-400 transition-colors cursor-default",
  },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  return (
    <footer className="relative flex flex-col items-center justify-center gap-[5px] md:gap-[90px] lg:gap-[120px] 2xl:gap-[120px]">
      {/* Main Content Area */}
      <div className="z-40 flex mt-10 md:mt-20 flex-col-reverse md:flex-row items-start md:items-end justify-between gap-10 w-[88%] md:w-[80%] xl:w-[70%] mx-auto">
        {/* Left Section: Social Links & Copyright */}
        <div className="flex flex-col gap-4 w-full md:w-auto mx-auto md:mx-0">
          <div className="flex space-x-2 xs:space-x-3 lg:space-x-4 items-center mr-auto">
            {footerSocialLinks.map((link) => (
              <Tooltip
                key={link.id}
                title={link.title}
                color="#141414"
                placement="top"
              >
                <Link
                  href={link.href}
                  className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 overflow-hidden rounded-full transition-colors duration-200
                    ${link.applyBorderEffect ? "border border-white hover:bg-white hover:border-white" : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.alt}
                  onMouseEnter={() => setHoveredIcon(link.id)}
                  onMouseLeave={() => setHoveredIcon(null)}
                >
                  <Image
                    src={
                      hoveredIcon === link.id ? link.iconDark : link.iconLight
                    }
                    alt={link.alt}
                    width={24}
                    height={24}
                    className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 object-contain transition-transform duration-200 group-hover:scale-110" // Consider if group-hover is intended here or direct hover on Image
                  />
                </Link>
              </Tooltip>
            ))}
          </div>
          <p className="text-start text-[10px] xs:text-[12px] lg:text-[13px] 2xl:text-[15px] text-gray-400 whitespace-nowrap">
            © {currentYear} TriggerX. All rights reserved.
          </p>
        </div>

        {/* Right Section: Navigation Links */}
        <div className="text-white w-full md:w-auto mx-auto md:mx-0 flex flex-col justify-center gap-4 md:gap-6 items-start md:items-end">
          <FooterNavSection
            navItems={footerNavLinksTop}
            className="w-full md:w-auto flex justify-between md:justify-end gap-x-6 gap-y-2 md:gap-x-7 lg:gap-x-12 text-[10px] xs:text-[12px] lg:text-[14px] 2xl:text-[15px] text-gray-300 whitespace-nowrap tracking-wide flex-wrap"
          />
          <FooterNavSection
            navItems={footerNavLinksBottom}
            className="w-full md:w-auto flex justify-between md:justify-end gap-x-3 gap-y-2 md:gap-x-5 lg:gap-x-8 text-[10px] xs:text-[12px] lg:text-[14px] 2xl:text-[15px] text-gray-300 whitespace-nowrap tracking-wide flex-wrap"
          />
        </div>
      </div>

      {/* Footer Logo Banner */}
      <div className="z-20 w-[95%] mx-auto h-max p-5 mt-0 sm:mt-8 md:mt-12">
        <Image
          src={logo}
          alt="TriggerX Footer Banner"
          className="w-full h-auto"
          priority={false}
        />
      </div>

      {/* Decorative Background Images */}
      <div className="z-10 absolute left-0 bottom-[80%] md:bottom-[26%] lg:bottom-[40%] w-[80px] sm:w-[130px] lg:w-[150px] 2xl:w-[200px] h-max overflow-hidden">
        <Image
          src={footer1}
          alt=""
          className="w-full h-auto relative -left-5 md:left-0"
        />
      </div>

      <div className="z-10 absolute right-0 bottom-[60%] md:bottom-[50%] lg:bottom-[30%] w-[80px] sm:w-[130px] 2xl:w-[220px] h-max overflow-hidden">
        <Image
          src={footer2}
          alt=""
          className="w-full h-auto relative left-5 md:left-0"
        />
      </div>
    </footer>
  );
};

export default Footer;
