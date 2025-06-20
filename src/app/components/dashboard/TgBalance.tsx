"use client";

import { MainContainer } from "../ui/MainContainer";
import { Typography } from "../ui/Typography";

const TgBalance = () => {
  return (
    <MainContainer>
      <Typography variant="h3" color="white" align="left" className="mb-5">
        Your Balance
      </Typography>
      <div className="p-6 bg-[#242323] rounded-xl ">
        <Typography variant="body" color="gray" align="left" className=" mb-7 ">
          Total TG Balance
        </Typography>
        <Typography
          variant="h3"
          color="secondary"
          align="left"
          className="  truncate"
        >
          20.40 TG
        </Typography>
      </div>
    </MainContainer>
  );
};

export default TgBalance;
