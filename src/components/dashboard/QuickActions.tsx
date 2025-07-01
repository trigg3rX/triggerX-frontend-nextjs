"use client";
import React from "react";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import TopUpTgDialog from "./TopUpTgDialog";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { Card } from "../ui/Card";

export const QuickActions = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [stakeAmount, setStakeAmount] = React.useState("");
  const [isStaking, setIsStaking] = React.useState(false);
  const { fetchTGBalance } = useTGBalance();

  const accountBalance = { formatted: "10" };

  const handleStake = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (typeof window.ethereum === "undefined") {
      toast.error("Please install MetaMask to use this feature");
      return;
    }
    const stakeRegistryAddress =
      process.env.NEXT_PUBLIC_TRIGGER_GAS_REGISTRY_ADDRESS;
    if (!stakeRegistryAddress) {
      toast.error("Stake registry address not configured");
      return;
    }
    try {
      setIsStaking(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getNetwork(); // network is not used, just ensure connection
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(
        stakeRegistryAddress,
        [
          "function purchaseTG(uint256 amount) external payable returns (uint256)",
        ],
        signer,
      );
      const stakeAmountInWei = ethers.parseEther(stakeAmount.toString());
      if (stakeAmountInWei === BigInt(0)) {
        throw new Error("Stake amount must be greater than zero.");
      }
      const tx = await stakingContract.purchaseTG(
        ethers.parseEther(stakeAmount.toString()),
        { value: ethers.parseEther(stakeAmount.toString()) },
      );
      await tx.wait();
      await fetchTGBalance();
      toast.success("Staking successful!");
      setIsDialogOpen(false);
      setStakeAmount("");
    } catch (error: unknown) {
      console.error("Error staking:", error);
      let message = "Error staking";
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof (error as { message?: string }).message === "string"
      ) {
        message = (error as { message?: string }).message!;
      }
      toast.error(message);
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <Card>
      <Typography variant="h2" color="white" align="left">
        Quick Actions
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
    </Card>
  );
};
