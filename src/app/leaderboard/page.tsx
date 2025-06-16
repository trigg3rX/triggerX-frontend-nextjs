"use client";
import React, { useState } from "react";
import { Typography } from "../components/ui/Typography";
import SearchBar from "../components/ui/SearchBar";
import { useAccount } from "wagmi";
import AnimatedTabs from "../components/leaderboard/AnimatedTabs";
import WalletBanner from "../components/common/WalletBanner";
import MainTable from "../components/leaderboard/MainTable";

type TabType = "keeper" | "developer" | "contributor";

function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("keeper");
  const { isConnected } = useAccount();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <Typography variant="h1" color="primary" className="mb-10">
        Leaderboard
      </Typography>
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6">
        <div className="w-full">
          <Typography
            variant="h2"
            color="blue"
            align="left"
            className="w-full mb-2"
          >
            Points & Fair Use
          </Typography>
          <div className="mb-2">
            <Typography
              variant="h4"
              color="primary"
              align="left"
              className="w-full"
            >
              <li>
                Operator and developer points are tracked separately and do not
                affect each others rewards.
              </li>
              <li>
                Each wallet has a maximum point cap to ensure fair participation
                and prevent scripted job farming.
              </li>
            </Typography>
          </div>
          <Typography color="gray" align="left" className="w-full">
            The system is designed to reward genuine contributions.
          </Typography>
        </div>
        <div className="flex justify-center items-end w-full sm:w-auto lg:mb-8">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClearSearch={() => setSearchTerm("")}
          />
        </div>
      </div>
      <AnimatedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isConnected && (
        <WalletBanner message="Please connect your wallet to see your performance metrics in the leaderboard" />
      )}
      <MainTable activeTab={activeTab} />
    </div>
  );
}

export default Leaderboard;
