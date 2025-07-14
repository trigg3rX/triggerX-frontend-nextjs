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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setWithdrawAmount("");
    }
    onOpenChange(open);
  };

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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <div className="relative w-full">
              <InputField
                type="number"
                value={withdrawAmount}
                onChange={setWithdrawAmount}
                placeholder="Enter TG amount"
                className="rounded-xl w-full pr-16"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray text-white border border-gray-500 text-xs font-semibold px-3 py-1 rounded-lg hover:scale-105 transition-all duration-200"
                style={{ minWidth: 40 }}
                onClick={() => setWithdrawAmount(tgBalance || "0")}
                disabled={isWithdrawing || !tgBalance || tgBalance === "0"}
              >
                Max
              </button>
            </div>

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

            <div className="mt-2 text-xs bg-yellow-100  text-yellow-800 p-2 rounded">
              <Typography
                variant="body"
                color="inherit"
                align="left"
                className="!m-0"
              >
                <strong>Note:</strong> If TG is insufficient, the job will not
                be executed.
              </Typography>
            </div>
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
                  {(Number(withdrawAmount) / 1000).toFixed(6)}
                </Typography>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              color="white"
              className="w-full"
              onClick={() => onOpenChange(false)}
              disabled={isWithdrawing || !!withdrawAmount}
            >
              Cancel
            </Button>
            <Button
              color="purple"
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
