// components/layout/Footer.tsx
"use client";

import React from "react";
import Image from "next/image";

import { FooterNavSection } from "./FooterNavSection";

import logo from "@/assets/footer_svgs/footerLogo.svg";
import footer1 from "@/assets/footer_svgs/footer1.png";
import footer2 from "@/assets/footer_svgs/footer2.png";

import { Typography } from "../ui/Typography";

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

const footerNavLinksTop: FooterNavItem[] = [
  {
    id: "status",
    label: "Status",
    href: "https://status.triggerx.network/",
    isLink: true,
    target: "_blank",
    rel: "noopener noreferrer",
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200",
  },
  {
    id: "build",
    label: "Build",
    href: "/",
    isLink: true,
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200",
  },
  {
    id: "docs",
    label: "Docs",
    href: "https://triggerx.gitbook.io/triggerx-docs",
    isLink: true,
    target: "_blank",
    rel: "noopener noreferrer",
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200",
  },
  {
    id: "devhub",
    label: "Dev Hub",
    href: "/devhub",
    isLink: true,
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200",
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
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200",
  },
  {
    id: "termsOfUse",
    label: "Term of Use",
    isLink: false,
    title: "Available Soon",
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200 cursor-default",
  },
  {
    id: "privacyPolicy",
    label: "Privacy Policy",
    isLink: false,
    title: "Available Soon",
    className:
      "hover:text-[#f8ff7c] hover:underline underline-offset-2 transition-colors duration-200 cursor-default",
  },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 flex flex-col items-center justify-center gap-[20px] md:gap-[40px] lg:gap-[80px] 2xl:gap-[120px] my-[80px] lg:my-0">
      {/* Main Content Area */}
      <div className="z-40 flex mt-10 md:mt-20 flex-col-reverse sm:flex-row items-start sm:items-end justify-between gap-[15px] sm:gap-10 w-[88%] sm:w-[95%] md:w-[75%] xl:w-[70%] mx-auto">
        {/* Left Section: Social Links & Copyright */}
        <div className="flex flex-col items-start gap-4 w-full xs:w-[88%] sm:w-auto mx-auto md:mx-0">
          <Typography className=" text-[10px] xs:text-[12px] lg:text-[14px] 2xl:text-[15px] mt-2 text-[#d1d5db]">
            Build with ❤️ by{" "}
            <a
              href="https://lampros.tech/?utm_source=triggerx&utm_medium=footer"
              target="_blank"
              className="underline hover:text-[#f8ff7c] underline-offset-2"
            >
              Lampros Tech
            </a>
          </Typography>
          <p className="text-start text-[10px] xs:text-[12px] lg:text-[13px] 2xl:text-[15px] text-[#d1d5db] whitespace-nowrap">
            © {currentYear} TriggerX. All rights reserved.
          </p>
        </div>

        {/* Right Section: Navigation Links */}
        <div className=" w-full xs:w-[88%] sm:w-auto mx-auto md:mx-0 flex flex-col justify-center gap-4 md:gap-6 items-start md:items-end">
          <FooterNavSection
            navItems={footerNavLinksTop}
            className="w-full md:w-auto flex justify-between sm:justify-end gap-x-6 gap-y-2 md:gap-x-7 lg:gap-x-12 text-[10px] xs:text-[12px] lg:text-[14px] 2xl:text-[15px] text-gray-300 whitespace-nowrap tracking-wide flex-wrap"
          />
          <FooterNavSection
            navItems={footerNavLinksBottom}
            className="w-full md:w-auto flex justify-between sm:justify-end gap-x-3 gap-y-2 md:gap-x-5 lg:gap-x-8 text-[10px] xs:text-[12px] lg:text-[14px] 2xl:text-[15px] text-gray-300 whitespace-nowrap tracking-wide flex-wrap"
          />
        </div>
      </div>

      {/* Footer Logo Banner */}
      <div className="z-20 w-[95%] mx-auto  pt-5 pb-3 mt-0 ">
        <Image
          src={logo}
          alt="TriggerX Footer Banner"
          className="w-full h-auto"
          priority={false}
        />
      </div>

      {/* Decorative Background Images */}
      <div className="z-10 absolute left-0 bottom-[80%] md:bottom-[40%] lg:bottom-[40%] w-[80px] sm:w-[130px] lg:w-[150px] 2xl:w-[200px] h-max overflow-hidden">
        <Image
          src={footer1}
          alt=""
          className="w-full h-auto relative -left-5 md:left-0"
        />
      </div>

      <div className="z-10 absolute right-0 bottom-[60%] md:bottom-[30%] lg:bottom-[30%] w-[80px] sm:w-[130px] 2xl:w-[220px] h-max overflow-hidden">
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
