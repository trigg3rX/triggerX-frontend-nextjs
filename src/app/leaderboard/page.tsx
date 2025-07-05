import React, { Suspense } from "react";
import LeaderboardSkeleton from "@/components/skeleton/LeaderboardSkeleton";
import MainLeaderboard from "@/components/leaderboard/MainLeaderboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lederboard | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Lederboard | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: `https://triggerx-app-nextjs.vercel.app/leaderboard`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/leaderboard.png`,
        width: 1200,
        height: 630,
        alt: "Lederboard | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://triggerx-app-nextjs.vercel.app/leaderboard`,
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
