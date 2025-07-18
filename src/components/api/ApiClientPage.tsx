"use client";
import React, { useState } from "react";
import QuickStartGuide from "./QuickGuide";
import GenerateApi from "./GenerateApi";
import Documentation from "./Documentation";
import { Typography } from "../ui/Typography";
import AnimatedTabs from "../leaderboard/AnimatedTabs";

const tabs = [
  { id: "documentation", label: "Documentation" },
  { id: "api-creation", label: "API Creation" },
];

function ApiClientPage() {
  const [activeTab, setActiveTab] = useState<string>(tabs[1].id);

  return (
    <>
      <Typography variant="h1">API Documentation</Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        Build and deploy custom APIs for automated triggers using simple job
        logic.
      </Typography>
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <>
        {activeTab === "api-creation" && (
          <div className="flex flex-col lg:flex-row gap-8 w-full justify-between">
            <GenerateApi />
            <QuickStartGuide />
          </div>
        )}
        {activeTab === "documentation" && <Documentation />}
      </>
    </>
  );
}

export default ApiClientPage;
