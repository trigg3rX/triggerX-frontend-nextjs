"use client";
import React from "react";
import { Button } from "../ui/Button";
import { MainContainer } from "../ui/MainContainer";
import { Typography } from "../ui/Typography";
import TopUpTgDialog from "./TopUpTgDialog";

export const QuickActions = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [stakeAmount, setStakeAmount] = React.useState("");
  const [isStaking, setIsStaking] = React.useState(false);

  // Dummy account balance for now, replace with real data as needed
  const accountBalance = { formatted: "10" };

  const handleStake = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsStaking(true);
    // Simulate async staking
    setTimeout(() => {
      setIsStaking(false);
      setIsDialogOpen(false);
      setStakeAmount("");
    }, 2000);
  };

  return (
    <MainContainer>
      <Typography variant="h3" align="left">
        Your Balance
      </Typography>

      <div className="space-y-8">
        <div>
          <Button className="w-full my-5" onClick={() => setIsDialogOpen(true)}>
            Top Up TG
          </Button>
          <Button className="w-full">Create New Job</Button>
        </div>
      </div>

      <TopUpTgDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        stakeAmount={stakeAmount}
        setStakeAmount={setStakeAmount}
        isStaking={isStaking}
        accountBalance={accountBalance}
        handleStake={handleStake}
      />
    </MainContainer>
  );
};
