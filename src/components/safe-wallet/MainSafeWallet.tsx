"use client";

import React, { useState, useCallback } from "react";
import SafeJobs from "@/components/safe-wallet/SafeJobs";
import SafeTokens from "@/components/safe-wallet/SafeTokens";
import SafeWalletSidebar from "@/components/safe-wallet/SafeWalletSidebar";

type TabKey = "jobs" | "tokens" | "templates";

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
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 p-4 sm:p-6">
      {/* Sidebar - moved to the left for better affordance */}
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 h-full lg:w-[25%] xl:w-[25%] w-full order-1 lg:order-1">
        <SafeWalletSidebar
          selectedSafe={selectedSafe}
          onSafeSelect={handleSafeSelect}
        />
      </div>

      {/* Main Content Area */}
      <div className="lg:w-[73%] xl:w-[73%] w-full order-2 lg:order-2 min-w-0">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="overflow-x-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === t.key
                      ? "bg-white/10 text-white"
                      : "text-[#A2A2A2] hover:text-white"
                  }`}
                  aria-pressed={activeTab === t.key}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default Page;
