import React, { Suspense } from "react";
import { Typography } from "@/components/ui/Typography";
import TgBalance from "@/components/dashboard/TgBalance";
import { QuickActions } from "@/components/dashboard/QuickActions";
import Statistics from "@/components/dashboard/Statistics";
import ActiveJobs from "@/components/dashboard/ActiveJobs";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";
import { Metadata } from "next";
import { getFullUrl } from "@/lib/metaUrl";

export const metadata: Metadata = {
  title: "Dashboard | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Dashboard | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: getFullUrl("/dashboard"),
    siteName: "TriggerX",
    images: [
      {
        url: getFullUrl("/OGImages/dashboard.png"),
        width: 1200,
        height: 630,
        alt: "Dashboard | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: getFullUrl("/dashboard"),
  },
};

function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="w-[90%] mx-auto">
        <Typography variant="h1" color="primary" className="mb-10">
          Dashboard
        </Typography>
        <div className="flex  justify-evenly gap-5 lg:flex-row flex-col ">
          <div className="xl:w-[73%] lg:w-[70%] w-full">
            <ActiveJobs />
          </div>
          <div className="space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
            <TgBalance />
            <QuickActions />
            <Statistics />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default Dashboard;
