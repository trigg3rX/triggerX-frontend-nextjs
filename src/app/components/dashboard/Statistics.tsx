"use client";

import { MainContainer } from "../ui/MainContainer";
import { Typography } from "../ui/Typography";

const Statistics = () => {
  return (
    <MainContainer className="">
      <Typography variant="h2" color="white" align="left" className="mb-5">
        Statistics
      </Typography>
      <div className="space-y-4 ">
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badgeYellow"
            color="black"
            className="py-3 px-4 text-black"
          >
            10
          </Typography>
          <Typography
            variant="body"
            color="gray"
            className="xl:text-lg text-sm "
          >
            Total Jobs
          </Typography>
        </div>
        <div className="flex justify-start items-center gap-7">
          <Typography
            variant="badgeWhite"
            color="black"
            className="py-3 px-4 text-black"
          >
            20
          </Typography>
          <Typography
            variant="body"
            color="gray"
            className="xl:text-lg text-sm "
          >
            Linked Jobs
          </Typography>
        </div>
      </div>
    </MainContainer>
  );
};

export default Statistics;
