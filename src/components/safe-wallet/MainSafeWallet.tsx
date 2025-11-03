"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import SafeJobs from "./SafeJobs";
import SafeTokens from "./SafeTokens";
import SafeWalletSidebar from "./SafeWalletSidebar";

type TabKey = "jobs" | "tokens" | "templates";

const TABS: { key: TabKey; label: string }[] = [
  { key: "jobs", label: "Jobs" },
  { key: "tokens", label: "Tokens" },
  { key: "templates", label: "Templates" },
];

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("jobs");
  const [selectedSafe, setSelectedSafe] = useState<string | null>(null);

  const handleSafeSelect = (safe: string | null) => {
    setSelectedSafe(safe);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "jobs":
        return <SafeJobs selectedSafe={selectedSafe} />;
      case "tokens":
        return <SafeTokens selectedSafe={selectedSafe} />;
      case "templates":
        return (
          <div className="p-6">
            <Typography variant="h3" color="primary" className="mb-4">
              Job Templates
            </Typography>
            <Typography variant="caption" color="secondary" className="mb-4">
              Quick-start templates using the selected Safe (mock actions).
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Time-based Trigger",
                "Condition-based Trigger",
                "Event-based Trigger",
              ].map((name) => (
                <div
                  key={name}
                  className="bg-white/5 border border-white/10 rounded-lg p-4"
                >
                  <Typography variant="body" align="left" className="mb-2">
                    {name}
                  </Typography>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors"
                      onClick={() => alert(`Use template: ${name}`)}
                    >
                      Use Template
                    </button>
                    <button
                      className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded text-sm transition-colors"
                      onClick={() => alert("Preview (mock)")}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return <SafeJobs selectedSafe={selectedSafe} />;
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
