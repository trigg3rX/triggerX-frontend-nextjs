"use client";
import React, { useState } from "react";
import { Typography } from "@/components/ui/Typography";
import SearchBar from "@/components/ui/SearchBar";
import { useAccount } from "wagmi";
import AnimatedTabs from "@/components/leaderboard/AnimatedTabs";
import WalletBanner from "@/components/common/WalletBanner";
import MainTable from "@/components/leaderboard/MainTable";
import useLeaderboardData from "@/hooks/useLeaderboardData";
import { TabType, TableData } from "@/types/leaderboard";

const tabs = [
  { id: "keeper", label: "Keeper" },
  { id: "developer", label: "Developer" },
  { id: "contributor", label: "Contributor" },
];

function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("keeper");
  const { isConnected, address } = useAccount();

  const { leaderboardData } = useLeaderboardData(
    activeTab,
    address,
    isConnected,
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Determine which data to pass to MainTable based on activeTab
  let tableData: TableData[] = [];
  if (activeTab === "keeper") tableData = leaderboardData.keepers;
  else if (activeTab === "developer") tableData = leaderboardData.developers;
  else if (activeTab === "contributor")
    tableData = leaderboardData.contributors;

  // Filter tableData by searchTerm (address, case-insensitive)
  const filteredTableData = searchTerm
    ? tableData.filter((item) =>
        item.address.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : tableData;

  return (
    <div className="w-[90%] mx-auto">
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
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as TabType)}
      />

      {!isConnected && (
        <WalletBanner message="Please connect your wallet to see your performance metrics in the leaderboard" />
      )}
      <MainTable
        activeTab={activeTab}
        data={filteredTableData}
        onViewProfile={(address) =>
          window.open(
            `https://app.eigenlayer.xyz/operator/${address}`,
            "_blank",
          )
        }
        userAddress={address}
      />
    </div>
  );
}

export default Leaderboard;
