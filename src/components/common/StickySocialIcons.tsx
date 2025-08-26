"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Tooltip } from "antd";
import Link from "next/link";

import github from "@/assets/footer_svgs/github.svg";
import githubdark from "@/assets/footer_svgs/githubdark.svg";
import twitter from "@/assets/footer_svgs/twitter.svg";
import twitterdark from "@/assets/footer_svgs/twitterdark.svg";
import telegram from "@/assets/footer_svgs/telegram.svg";
import telegramdark from "@/assets/footer_svgs/telegramdark.svg";
import gitbook from "@/assets/footer_svgs/gitbook.svg";
import gitbookdark from "@/assets/footer_svgs/gitbookdark.svg";
import mirror from "@/assets/footer_svgs/mirror.svg";
import mirrordark from "@/assets/footer_svgs/mirrordark.svg";
import medium from "@/assets/footer_svgs/medium.svg";
import mediumdark from "@/assets/footer_svgs/mediumdark.svg";
import youtube from "@/assets/footer_svgs/youtube.svg";
import youtubedark from "@/assets/footer_svgs/youtubedark.svg";

interface SocialLinkItem {
  id: string;
  title: string;
  href: string;
  iconLight: string;
  iconDark: string;
  applyBorderEffect: boolean;
  alt: string;
}

const socialLinks: SocialLinkItem[] = [
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

const StickySocialIcons: React.FC = () => {
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);

  return (
    <>
      {/* Desktop/Tablet Version - Fixed sidebar on right */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 hidden lg:block">
        <div className="flex flex-col space-y-3 bg-[#0a0a0a]/80 backdrop-blur-md rounded-full px-1 py-0 border border-gray-700/50">
          {socialLinks.map((link) => (
            <Tooltip
              key={link.id}
              title={link.title}
              color="#141414"
              placement="right"
            >
              <Link
                href={link.href}
                className={`flex items-center justify-center w-10 h-10 overflow-hidden rounded-full transition-all duration-200 hover:scale-110
                  ${link.applyBorderEffect ? "border border-white/30 hover:bg-white hover:border-white" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.alt}
                onMouseEnter={() => setHoveredIcon(link.id)}
                onMouseLeave={() => setHoveredIcon(null)}
              >
                <Image
                  src={hoveredIcon === link.id ? link.iconDark : link.iconLight}
                  alt={link.alt}
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain transition-transform duration-200"
                />
              </Link>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Mobile Version - Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0a0a0a]/95 backdrop-blur-md border-t border-gray-700/50">
        <div className="flex items-center justify-center space-x-4 px-4 py-3">
          {socialLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className="flex items-center justify-center p-1 rounded-full border border-gray-600 hover:border-gray-400 transition-all duration-200 hover:scale-110"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.alt}
            >
              <Image
                src={link.iconLight}
                alt={link.alt}
                width={20}
                height={20}
                className="w-5 h-5 object-contain"
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default StickySocialIcons;
