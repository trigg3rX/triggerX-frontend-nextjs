import React, { Suspense } from "react";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import MainLeaderboard from "@/components/leaderboard/MainLeaderboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "TriggerX Leaderboard | Keeper, Developer & Contributor Rankings",
  description:
    "See your rank and points as a Keeper, Developer, or Contributor in the TriggerX network. Transparent rewards. Real participation.",
  openGraph: {
    title: "TriggerX Leaderboard | Track Points & Contributions",
    description:
      "See your rank and points as a Keeper, Developer, or Contributor in the TriggerX network. Transparent rewards. Real participation.",
    url: `https://app.triggerx.network/leaderboard`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://app.triggerx.network/OGImages/leaderboard.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX Leaderboard display with ranks",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://app.triggerx.network/leaderboard`,
  },
};

function Leaderboard() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <MainLeaderboard />
    </Suspense>
  );
}

export default Leaderboard;
