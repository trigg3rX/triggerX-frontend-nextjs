import React, { Suspense } from "react";
import { Typography } from "@/components/ui/Typography";
import TgBalance from "@/components/dashboard/TgBalance";
import { QuickActions } from "@/components/dashboard/QuickActions";
import AlertEmail from "@/components/dashboard/AlertEmail";
import ActiveJobs from "@/components/dashboard/ActiveJobs";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TriggerX",
  description: "TriggerX - Web3 Automation Platform.",
  openGraph: {
    title: "Dashboard | TriggerX ",
    description: "TriggerX - Web3 Automation Platform.",
    url: `https://triggerx-app-nextjs.vercel.app/dashboard`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://triggerx-app-nextjs.vercel.app/OGImages/dashboard.png`,
        width: 1200,
        height: 630,
        alt: "Dashboard | TriggerX",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: `https://triggerx-app-nextjs.vercel.app/dashboard.png`,
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
            <AlertEmail />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default Dashboard;
