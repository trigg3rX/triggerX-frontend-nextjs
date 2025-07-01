import React, { useState } from "react";
import { HeadingPair } from "@/types/sanity";

interface DevHubTableOfContentsProps {
  headingPairs?: HeadingPair[];
  activeHeading: string;
  className?: string;
}

export const DevHubTableOfContents: React.FC<DevHubTableOfContentsProps> = ({
  headingPairs = [],
  activeHeading,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleHeadingClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    h2Heading: string,
  ) => {
    e.preventDefault();
    const targetElement = document.getElementById(h2Heading);
    if (targetElement) {
      const yOffset = -160;
      const y =
        targetElement.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const renderHeadingList = (isMobile = false) => (
    <ul
      className={`space-y-2 font-actay ${isMobile ? "absolute w-full bg-[#141313] text-white rounded-lg border border-[#5F5F5F] mt-2 shadow-lg z-10" : "hidden md:block"}`}
    >
      {headingPairs.map((pair, index) => (
        <li
          key={index}
          className={`py-2 px-2 ${isMobile ? "" : "text-xs lg:text-sm 2xl:text-base"}`}
        >
          <a
            href={`#${pair.h2Heading}`}
            onClick={(e) => handleHeadingClick(e, pair.h2Heading)}
            className={`hover:underline ${
              activeHeading === pair.h2Heading
                ? "text-green-400 font-bold"
                : "text-gray-300"
            }`}
          >
            [ {index + 1} ] {pair.displayHeading}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`w-full md:w-1/4 min-w-[180px] lg:min-w-[230px] md:sticky top-24 h-full ${className}`}
    >
      {/* Mobile Dropdown */}
      <div className="md:hidden relative my-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center px-4 py-2 bg-[#141313] text-white rounded-lg border border-[#5F5F5F] text-xs font-actayWide"
        >
          Table Of Content
          <span
            className={`transform transition ${isOpen ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {isOpen && renderHeadingList(true)}
      </div>

      <h2 className="hidden md:block font-actayWide text-sm lg:text-lg font-extrabold my-10">
        Table of Content
      </h2>
      {renderHeadingList()}
    </aside>
  );
};
