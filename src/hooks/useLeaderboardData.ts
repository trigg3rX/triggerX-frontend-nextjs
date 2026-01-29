import { useState, useEffect } from "react";
import {
  KeeperData,
  DeveloperData,
  ContributorData,
  TabType,
} from "@/types/leaderboard";
import { devLog } from "@/lib/devLog";

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
  refreshKey?: number,
) {
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch leaderboard data when the active tab or refresh key changes.
   *
   * - For the "keeper" tab, calls `/api/leaderboard/keepers` and transforms into `KeeperData[]`.
   * - For the "developer" tab, calls `/api/leaderboard/users` and transforms into `DeveloperData[]`.
   *
   * The API base URL and API key are read from `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_API_KEY` env vars.
   */
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let apiUrl = "";
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!API_BASE_URL) {
          throw new Error("API base URL is not set");
        }

        if (activeTab === "keeper") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/keepers`;
        } else if (activeTab === "developer" || activeTab === "contributor") {
          apiUrl = `${API_BASE_URL}/api/leaderboard/users`;
        }

        devLog(`[Leaderboard] Fetching for tab: ${activeTab}, URL:`, apiUrl);
        const response = await fetch(apiUrl, {
          headers: {
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
        });
        devLog("[Leaderboard] Response status:", response.status);
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
        const data = await response.json();
        devLog("[Leaderboard] Raw API response:", data);
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
          devLog(
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
          devLog(
            "[Leaderboard] Transformed Developer Data:",
            transformedUserData,
          );
          setLeaderboardData((prev) => ({
            ...prev,
            developers: transformedUserData,
          }));
        }
        setIsLoading(true);
      } catch (err) {
        if (err instanceof Error) {
          setError("Something went wrong.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab, refreshKey]);

  return { leaderboardData, isLoading, error };
}
