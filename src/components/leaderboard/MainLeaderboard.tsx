"use client";
import React, { Suspense, useState } from "react";
import { useAccount } from "wagmi";
import useLeaderboardData from "@/hooks/useLeaderboardData";
import { TabType, TableData } from "@/types/leaderboard";
import LeaderboardSkeleton from "../skeleton/LeaderboardSkeleton";
import { Typography } from "../ui/Typography";
import SearchBar from "../ui/SearchBar";
import AnimatedTabs from "./AnimatedTabs";
import WalletBanner from "../common/WalletBanner";
import MainTable from "./MainTable";
import { onRetry } from "sanity";
import ContributorLinkButton from "./ContributorLinkButton";

const tabs = [
  { id: "keeper", label: "Keeper" },
  { id: "developer", label: "Developer" },
  { id: "contributor", label: "Contributor" },
];

/**
 * Top-level leaderboard page composition and data wiring.
 * - Manages active tab and search term.
 * - Fetches tab-specific data via useLeaderboardData.
 * - Filters by address and renders MainTable.
 */
function MainLeaderboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("keeper");
  const { isConnected, address } = useAccount();

  const { leaderboardData, error, isLoading } = useLeaderboardData(
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
    <Suspense fallback={<LeaderboardSkeleton />}>
      <div className="w-[90%] mx-auto">
        <Typography variant="h1" color="primary">
          Leaderboard
        </Typography>
        <Typography variant="h4" color="secondary" className="my-6">
          See how operators rank based on jobs completed and rewards earned
          weekly.
        </Typography>
        <div className="flex flex-col xl:flex-row justify-between items-end gap-6 p-4 sm:p-6 !pb-0">
          <div className="w-full">
            <Typography
              variant="h2"
              color="blue"
              align="left"
              className="w-full mb-2"
            >
              Points & Fair Use
            </Typography>

            <Typography
              variant="h4"
              color="primary"
              align="left"
              className="w-full mb-2"
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
        {activeTab === "contributor" && <ContributorLinkButton />}

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
          error={error}
          isLoading={isLoading}
          onRetry={onRetry}
        />
      </div>
    </Suspense>
  );
}

export default MainLeaderboard;
