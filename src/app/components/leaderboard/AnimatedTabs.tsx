import React from "react";
import { HoverHighlight } from "../common/HoverHighlight";
import { Typography } from "../ui/Typography";

interface Tab {
  id: string;
  label: string;
}
interface AnimatedTabsProps {
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const AnimatedTabs: React.FC<AnimatedTabsProps> = ({
  tabs,
  activeTab,
  setActiveTab,
}) => {
  return (
    <HoverHighlight className="my-5 sm:my-10 p-2">
      {tabs.map((tabInfo) => (
        <button
          key={tabInfo.id}
          className={`w-full  p-2 xs:p-3 sm:p-4 rounded-xl relative z-[1] ${
            activeTab === tabInfo.id
              ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A]"
              : "bg-transparent"
          }`}
          onClick={() => setActiveTab(tabInfo.id)}
        >
          <Typography variant="h5" noWrap={false}>
            {tabInfo.label}
          </Typography>
        </button>
      ))}
    </HoverHighlight>
  );
};

export default AnimatedTabs;
