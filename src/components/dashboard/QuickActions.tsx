"use client";
import React from "react";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import TopUpTgDialog from "./TopUpTgDialog";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { Card } from "../ui/Card";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { useBalance, useAccount } from "wagmi";

export const QuickActions = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [stakeAmount, setStakeAmount] = React.useState("");
  const { fetchTGBalance } = useTGBalance();
  const { isConnected } = useWalletConnectionContext();
  const { address } = useAccount();
  const { data: accountBalance } = useBalance({
    address: address,
  });

  return (
    <Card>
      <Typography variant="h2" color="white" align="left">
        Quick Actions
      </Typography>

      <div className="space-y-8">
        <div>
          <Button
            className="w-full my-5"
            onClick={() => setIsDialogOpen(true)}
            disabled={!isConnected}
          >
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
        accountBalance={accountBalance}
        fetchTGBalance={fetchTGBalance}
      />
    </Card>
  );
};
