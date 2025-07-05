import React, { Suspense } from "react";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import MainLeaderboard from "@/components/leaderboard/MainLeaderboard";
import { getFullUrl } from "@/lib/metaUrl";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lederboard | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Lederboard | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: getFullUrl("/leaderboard"),
    siteName: "TriggerX",
    images: [
      {
        url: getFullUrl("/OGImages/leaderboard.png"),
        width: 1200,
        height: 630,
        alt: "Lederboard | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: getFullUrl("/leaderboard"),
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
