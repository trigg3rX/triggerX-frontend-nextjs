import React from "react";
import { HoverHighlight } from "../common/HoverHighlight";

type TabType = "keeper" | "developer" | "contributor";

interface AnimatedTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TABS_DATA = [
  { id: "keeper" as TabType, label: "Keeper" },
  { id: "developer" as TabType, label: "Developer" },
  { id: "contributor" as TabType, label: "Contributor" },
];

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  activeTab,
  setActiveTab,
}) => {
  return (
    <HoverHighlight className="my-5 sm:my-10 p-2">
      {TABS_DATA.map((tabInfo) => (
        <button
          key={tabInfo.id}
          className={`w-[33%] text-[#FFFFFF] text-[10px] xs:text-xs md:text-lg lg:text-xl p-2 xs:p-3 sm:p-4 rounded-lg relative z-[1] ${
            activeTab === tabInfo.id
              ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
              : "bg-transparent"
          }`}
          onClick={() => setActiveTab(tabInfo.id)}
        >
          <h2>{tabInfo.label}</h2>
        </button>
      ))}
    </HoverHighlight>
  );
};

export default AnimatedTabs;
