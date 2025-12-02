import React, { Suspense } from "react";
import { Typography } from "@/components/ui/Typography";
import { QuickActions } from "@/components/dashboard/QuickActions";
import ActiveJobs from "@/components/dashboard/ActiveJobs";
import DashboardSkeleton from "@/components/skeleton/DashboardSkeleton";
import { Metadata } from "next";
import ETHBalance from "@/components/dashboard/ETHBalance";

export const metadata: Metadata = {
  title: "TriggerX Dashboard | Manage Your Automation Tasks",
  description:
    "Access your job history, manage main and linked jobs, check balance, and create new automation tasks—all from one intuitive dashboard.",
  openGraph: {
    title: "TriggerX Dashboard | Job Management & Token Balances",
    description:
      "Access your job history, manage main and linked jobs, check balance, and create new automation tasks—all from one intuitive dashboard.",
    url: `https://app.triggerx.network/dashboard`,
    siteName: "TriggerX",
    images: [
      {
        url: `https://app.triggerx.network/OGImages/dashboard.png`,
        width: 1200,
        height: 630,
        alt: "TriggerX dashboard showing main jobs, linked jobs, balance, and quick actions panel",
        type: "image/png",
      },
    ],
    type: "website",
  },
  alternates: { 
    canonical: `https://app.triggerx.network/dashboard.png`,
  },
};

function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div>
        <Typography variant="h1" color="primary">
          Dashboard
        </Typography>
        <Typography variant="h4" color="secondary" className="my-6">
          View all your jobs, logs, triggers, and automation status in one
          place.
        </Typography>
        <div className="flex  justify-evenly gap-5 lg:flex-row flex-col p-4 sm:p-6 ">
          <div className="xl:w-[73%] lg:w-[70%] w-full">
            <ActiveJobs />
          </div>
          <div className="space-y-6 sm:space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
            <ETHBalance />
            <QuickActions />
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default Dashboard;
