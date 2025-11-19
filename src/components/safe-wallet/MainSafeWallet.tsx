"use client";

import React, { useState, useCallback } from "react";
import SafeJobs from "@/components/safe-wallet/SafeJobs";
import SafeTokens from "@/components/safe-wallet/SafeTokens";
import SafeWalletSidebar from "@/components/safe-wallet/SafeWalletSidebar";
import { HoverHighlight } from "@/components/common/HoverHighlight";

type TabKey = "jobs" | "tokens";

const TABS: { key: TabKey; label: string }[] = [
  { key: "jobs", label: "Jobs" },
  { key: "tokens", label: "Tokens" },
];

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");
  const [selectedSafe, setSelectedSafe] = useState<string | null>(null);

  const handleSafeSelect = useCallback((safe: string | null) => {
    setSelectedSafe(safe);
  }, []);

  const renderMainContent = () => {
    switch (activeTab) {
      case "jobs":
        return <SafeJobs selectedSafe={selectedSafe} />;
      case "tokens":
        return <SafeTokens selectedSafe={selectedSafe} />;
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 p-4 sm:p-6">
      {/* Sidebar - moved to the left for better affordance */}
      <div className="h-full xl:w-[25%] w-full">
        <SafeWalletSidebar
          selectedSafe={selectedSafe}
          onSafeSelect={handleSafeSelect}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full xl:w-[75%]">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="w-max">
            <HoverHighlight>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={` min-w-[170px] text-nowrap px-4 py-3 rounded-xl cursor-pointer text-xs sm:text-sm lg:text-base transition-colors ${
                    activeTab === t.key
                      ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A] text-white"
                      : "text-gray-200 hover:text-white"
                  }`}
                  aria-pressed={activeTab === t.key}
                >
                  {t.label}
                </button>
              ))}
            </HoverHighlight>
          </div>

          {/* Tab Content */}
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default Page;
