import React from "react";
import { Typography } from "../components/ui/Typography";
// import { MainContainer } from "../components/ui/MainContainer";
// import TgBalance from "../components/dashboard/TgBalance";
// import { QuickActions } from "../components/dashboard/QuickActions";
// import Statistics from "../components/dashboard/Statistics";

function Dashboard() {
  return (
    <>
      <Typography variant="h1" color="primary">
        Dashboard
      </Typography>
      {/* <div className="flex max-w-[1600px] mx-auto justify-evenly gap-5 lg:flex-row flex-col ">
        <div className="xl:w-[73%] lg:w-[70%] w-full">
          <MainContainer>Hello</MainContainer>
        </div>
        <div className="space-y-8 h-full xl:w-[25%] lg:w-[30%] w-full">
          <TgBalance />
          <QuickActions />
          <Statistics />
        </div>
      </div> */}
    </>
  );
}

export default Dashboard;
