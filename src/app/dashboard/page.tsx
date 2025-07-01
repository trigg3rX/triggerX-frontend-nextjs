import React from "react";
import { Typography } from "@/components/ui/Typography";
import TgBalance from "@/components/dashboard/TgBalance";
import { QuickActions } from "@/components/dashboard/QuickActions";
import Statistics from "@/components/dashboard/Statistics";
import ActiveJobs from "@/components/dashboard/ActiveJobs";

function Dashboard() {
  return (
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
  );
}

export default Dashboard;
