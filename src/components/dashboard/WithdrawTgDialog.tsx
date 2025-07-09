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

interface WithdrawTgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  withdrawAmount: string;
  setWithdrawAmount: (value: string) => void;
  tgBalance: string;
  fetchTGBalance: () => Promise<void>;
}

const WithdrawTgDialog: React.FC<WithdrawTgDialogProps> = ({
  open,
  onOpenChange,
  withdrawAmount,
  setWithdrawAmount,
  tgBalance,
  fetchTGBalance,
}) => {
  const { stakeRegistryAddress } = useStakeRegistry();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isInputActive, setIsInputActive] = useState(false);

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getNetwork();
      setIsWithdrawing(true);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(
        stakeRegistryAddress,
        ["function claimETHForTG(uint256 tgAmount) external"],
        signer,
      );
      const withdrawAmountInWei = ethers.parseEther(withdrawAmount.toString());
      if (withdrawAmountInWei === BigInt(0)) {
        throw new Error("Withdraw amount must be greater than zero.");
      }
      if (withdrawAmountInWei > ethers.parseEther(tgBalance || "0")) {
        throw new Error("Insufficient TG balance.");
      }
      const tx = await stakingContract.claimETHForTG(withdrawAmountInWei);
      await tx.wait();
      await fetchTGBalance();
      toast.success("Withdrawal successful!");
      onOpenChange(false);
      setWithdrawAmount("");
    } catch (error: unknown) {
      console.error("Error withdrawing:", error);
      toast.error((error as Error).message || "Error withdrawing TG");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Typography variant="h3" color="white" align="left">
              Withdraw TG
            </Typography>
          </DialogTitle>
          <DialogDescription>
            <Typography variant="body" color="gray" align="left">
              Withdraw TG back to ETH. 1 ETH = 1000 TG
            </Typography>
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleWithdraw} className="space-y-6 ">
          <div>
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                Amount (TG)
              </Typography>
            </label>
            <InputField
              type="number"
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              placeholder="Enter TG amount"
              className="rounded-xl"
              onFocus={() => setIsInputActive(true)}
              onBlur={() => setIsInputActive(false)}
            />
            {(isInputActive || !!withdrawAmount) && (
              <Typography
                variant="body"
                color="gray"
                align="left"
                className="mt-3"
              >
                Your TG Balance:{" "}
                <span className="text-white">
                  {tgBalance ? Number(tgBalance).toFixed(2) : "0.00"} TG
                </span>
              </Typography>
            )}
            {withdrawAmount && Number(withdrawAmount) > 0 && (
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
                  {(Number(withdrawAmount) / 1000).toFixed(6)} ETH
                </Typography>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isWithdrawing ||
                !withdrawAmount ||
                Number(withdrawAmount) > Number(tgBalance || 0)
              }
              className="w-full"
            >
              {isWithdrawing
                ? "Withdrawing..."
                : Number(withdrawAmount) > Number(tgBalance || 0)
                  ? "Insufficient TG"
                  : "Withdraw TG"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawTgDialog;
