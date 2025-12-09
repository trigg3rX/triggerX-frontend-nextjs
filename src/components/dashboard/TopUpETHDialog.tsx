"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../common/Dailog";
import { InputField } from "../ui/InputField";
import { Button } from "../ui/Button";
import { Typography } from "../ui/Typography";
import { useStakeRegistry } from "@/hooks/useStakeRegistry";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { useTriggerBalance } from "@/contexts/BalanceContext";
import { useAccount, useBalance } from "wagmi";

interface TopUpETHDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeAmount: string;
  setStakeAmount: (value: string) => void;
}

const TopUpETHDialog: React.FC<TopUpETHDialogProps> = ({
  open,
  onOpenChange,
  stakeAmount,
  setStakeAmount,
}) => {
  const { stakeRegistryAddress } = useStakeRegistry();
  const [isStaking, setIsStaking] = useState(false);
  const { fetchBalance } = useTriggerBalance();
  const { address } = useAccount();
  const { data: accountBalance } = useBalance({
    address: address,
  });

  // Wrapper to clear stakeAmount when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setStakeAmount("");
    }
    onOpenChange(open);
  };

  // Initiate on-chain deposit of ETH; refresh balances on success
  const handleStake = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getNetwork();
      setIsStaking(true);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(
        stakeRegistryAddress,
        ["function depositETH(uint256 ethAmount) external payable"],
        signer,
      );

      const stakeAmountInWei = ethers.parseEther(stakeAmount || "0");
      if (stakeAmountInWei === BigInt(0)) {
        throw new Error("Amount must be greater than zero.");
      }
      const tx = await stakingContract.depositETH(stakeAmountInWei, {
        value: stakeAmountInWei,
      });
      await tx.wait();
      // Add a small delay to allow the node to update state
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchBalance();
      toast.success("Top-up ETH successful!");
      onOpenChange(false);
      setStakeAmount("");
    } catch (error) {
      console.log(error);
      setIsStaking(false);
      toast.error("Top-up ETH failed!");
    } finally {
      setIsStaking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit ETH</DialogTitle>
          <DialogDescription>
            Deposit ETH to automate jobs on TriggerX.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleStake} className="space-y-6 ">
          <div>
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                Amount (ETH)
              </Typography>
            </label>
            <InputField
              type="number"
              value={stakeAmount}
              onChange={setStakeAmount}
              placeholder="Enter ETH amount"
              className="rounded-xl"
            />

            {stakeAmount && Number(stakeAmount) > 0 && (
              <>
                <Typography
                  variant="body"
                  color="gray"
                  align="left"
                  className="mt-3"
                >
                  Your ETH Balance:{" "}
                  <span className="text-white">
                    {accountBalance?.formatted
                      ? Number(accountBalance.formatted).toFixed(4)
                      : "0.0000"}{" "}
                    ETH
                  </span>
                </Typography>
                <div className="mt-3 p-3 bg-[#242323] rounded-xl flex flex-col">
                  <Typography variant="body" color="gray" align="left">
                    Estimated ETH
                  </Typography>
                  <Typography
                    variant="h3"
                    color="white"
                    align="left"
                    className="mt-1 font-bold tracking-wider"
                  >
                    {Number(stakeAmount).toFixed(6)}
                  </Typography>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <div className="flex w-full gap-3">
              <Button
                type="button"
                color="white"
                className="w-full"
                onClick={() => handleOpenChange(false)}
                disabled={isStaking || !!stakeAmount}
              >
                Cancel
              </Button>
              {(() => {
                let stakeAmountInWei: bigint = BigInt(0);
                try {
                  stakeAmountInWei = ethers.parseEther(stakeAmount || "0");
                } catch {
                  stakeAmountInWei = BigInt(0);
                }
                // Only show insufficient ETH if user entered an amount and it exceeds balance
                const hasInsufficientEth =
                  !!stakeAmount &&
                  stakeAmountInWei > (accountBalance?.value ?? BigInt(0));
                return (
                  <Button
                    color="purple"
                    type="submit"
                    disabled={isStaking || !stakeAmount || stakeAmount === "0"}
                    className="w-full"
                  >
                    {isStaking
                      ? "Topping Up..."
                      : hasInsufficientEth
                        ? "Insufficient ETH"
                        : "Deposit ETH"}
                  </Button>
                );
              })()}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpETHDialog;
