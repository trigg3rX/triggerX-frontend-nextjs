import { useState, useEffect } from "react";
import {
  KeeperData,
  DeveloperData,
  ContributorData,
  TabType,
} from "@/types/leaderboard";

interface LeaderboardData {
  keepers: KeeperData[];
  developers: DeveloperData[];
  contributors: ContributorData[];
}

const initialData: LeaderboardData = {
  keepers: [],
  developers: [],
  contributors: [],
};

export default function useLeaderboardData(
  activeTab: TabType,
  connectedAddress?: string,
  isConnected?: boolean,
) {
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let apiUrl = "";
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        console.log("[Leaderboard] API_BASE_URL:", API_BASE_URL);
        if (!API_BASE_URL) {
          throw new Error("API base URL is not set");
        }
        if (activeTab === "keeper") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/keepers`;
        } else if (activeTab === "developer" || activeTab === "contributor") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/users`;
        }
        console.log(
          `[Leaderboard] Fetching for tab: ${activeTab}, URL:`,
          apiUrl,
        );
        const response = await fetch(apiUrl);
        console.log("[Leaderboard] Response status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        const data = await response.json();
        console.log("[Leaderboard] Raw API response:", data);
        if (activeTab === "keeper") {
          const transformedKeeperData: KeeperData[] = Array.isArray(data)
            ? data.map((keeper) => ({
                id: keeper.id || keeper.keeper_address, // fallback if no id
                name: keeper.keeper_name,
                address: keeper.keeper_address,
                jobPerformed: keeper.no_executed_tasks,
                jobAttested: keeper.no_attested_tasks,
                points: keeper.keeper_points,
              }))
            : [];
          transformedKeeperData.sort((a, b) => b.points - a.points);
          console.log(
            "[Leaderboard] Transformed Keeper Data:",
            transformedKeeperData,
          );
          setLeaderboardData((prev) => ({
            ...prev,
            keepers: transformedKeeperData,
          }));
        } else if (activeTab === "developer") {
          const transformedUserData: DeveloperData[] = Array.isArray(data)
            ? data.map((user) => ({
                id: user.id || user.user_address, // fallback if no id
                name: user.user_name || user.user_address,
                address: user.user_address,
                totalJobs: user.total_jobs,
                taskPerformed: user.total_tasks,
                points: user.user_points,
              }))
            : [];
          transformedUserData.sort((a, b) => b.points - a.points);
          console.log(
            "[Leaderboard] Transformed Developer Data:",
            transformedUserData,
          );
          setLeaderboardData((prev) => ({
            ...prev,
            developers: transformedUserData,
          }));
        } else if (activeTab === "contributor") {
          const transformedContributors: ContributorData[] = Array.isArray(data)
            ? data.map((user) => ({
                id: user.id || user.user_address, // fallback if no id
                name: user.user_name || user.user_address,
                address: user.user_address,
                contributions: user.contributions || 0,
                communityPoints: user.community_points || 0,
                points: user.user_points,
              }))
            : [];
          transformedContributors.sort((a, b) => b.points - a.points);
          console.log(
            "[Leaderboard] Transformed Contributor Data:",
            transformedContributors,
          );
          setLeaderboardData((prev) => ({
            ...prev,
            contributors: transformedContributors,
          }));
        }
      } catch (err) {
        console.error("[Leaderboard] Error fetching leaderboard data:", err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, connectedAddress, isConnected]);

  return { leaderboardData, isLoading, error };
}
