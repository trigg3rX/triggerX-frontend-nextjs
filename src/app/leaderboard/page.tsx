"use client";
import React, { useState, useEffect } from "react";
import { Typography } from "../components/ui/Typography";
import SearchBar from "../components/ui/SearchBar";
import { useAccount } from "wagmi";
import AnimatedTabs from "../components/leaderboard/AnimatedTabs";
import WalletBanner from "../components/common/WalletBanner";
import MainTable from "../components/leaderboard/MainTable";
import { TabType, TableData } from "@/types/leaderboard";

const tabs = [
  { id: "keeper", label: "Keeper" },
  { id: "developer", label: "Developer" },
  { id: "contributor", label: "Contributor" },
];

function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("keeper");
  const { isConnected } = useAccount();
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let apiUrl = "";
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_BASE_URL) throw new Error("API base URL is not set");

        console.log("API_BASE_URL:", API_BASE_URL);

        if (activeTab === "keeper") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/keepers`;
        } else if (activeTab === "developer" || activeTab === "contributor") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/users`;
        }

        console.log("Fetching from:", apiUrl);
        const response = await fetch(apiUrl);
        console.log("Response status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        const data = await response.json();

        // Transform data based on tab
        let transformed: TableData[] = [];
        if (activeTab === "keeper") {
          transformed = Array.isArray(data)
            ? data.map((keeper) => ({
                id: keeper.id || keeper.keeper_address,
                name: keeper.keeper_name,
                address: keeper.keeper_address,
                jobPerformed: keeper.no_executed_tasks,
                jobAttested: keeper.no_attested_tasks,
                points: keeper.keeper_points,
              }))
            : [];
        } else if (activeTab === "developer") {
          transformed = Array.isArray(data)
            ? data.map((user) => ({
                id: user.id || user.user_address,
                name: user.user_name || user.user_address,
                address: user.user_address,
                totalJobs: user.total_jobs,
                taskPerformed: user.total_tasks,
                points: user.user_points,
              }))
            : [];
        } else if (activeTab === "contributor") {
          transformed = Array.isArray(data)
            ? data.map((user) => ({
                id: user.id || user.user_address,
                name: user.user_name || user.user_address,
                address: user.user_address,
                contributions: user.contributions || 0,
                communityPoints: user.community_points || 0,
                points: user.user_points,
              }))
            : [];
        }
        setTableData(transformed);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

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
      <AnimatedTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as TabType)}
      />

      {!isConnected && (
        <WalletBanner message="Please connect your wallet to see your performance metrics in the leaderboard" />
      )}
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <MainTable activeTab={activeTab} data={tableData} />
    </div>
  );
}

export default Leaderboard;
