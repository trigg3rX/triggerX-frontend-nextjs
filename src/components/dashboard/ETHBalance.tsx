"use client";

import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { useTriggerBalance } from "@/contexts/BalanceContext";
import useCountUp from "@/hooks/useCountUp";

const ETHBalance = () => {
  const { userBalance } = useTriggerBalance();
  const balance = userBalance ? Number(userBalance) : 0;
  const animatedBalance = useCountUp(balance, 1000);
  return (
    <Card>
      <Typography variant="h2" color="white" align="left" className="mb-5">
        Your Balance
      </Typography>
      <div className="p-6 bg-[#242323] rounded-xl ">
        <Typography variant="h3" color="gray" align="left" className=" mb-7 ">
          Total ETH Balance
        </Typography>
        <Typography
          variant="h2"
          color="secondary"
          align="left"
          className="  truncate"
        >
          {balance ? animatedBalance.toFixed(6) : "0.000000"}
        </Typography>
      </div>
    </Card>
  );
};

export default ETHBalance;
