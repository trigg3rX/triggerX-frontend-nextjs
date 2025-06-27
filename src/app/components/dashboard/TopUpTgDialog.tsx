"use client";
import React from "react";
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

interface TopUpTgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeAmount: string;
  setStakeAmount: (value: string) => void;
  isStaking: boolean;
  accountBalance?: { formatted?: string };
  handleStake: (e: React.FormEvent<HTMLFormElement>) => void;
}

const TopUpTgDialog: React.FC<TopUpTgDialogProps> = ({
  open,
  onOpenChange,
  stakeAmount,
  setStakeAmount,
  isStaking,
  accountBalance,
  handleStake,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <Typography variant="h3" color="white" align="left">
              Top Up TG
            </Typography>
          </DialogTitle>
          <DialogDescription>
            <Typography variant="body" color="gray" align="left">
              Exchange ETH to TG (Flue of your job) to automate jobs on TriggerX
              1 ETH = 1000 TG
            </Typography>
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
              <div className="mt-3 p-3 bg-[#242323] rounded-xl flex flex-col">
                <Typography variant="body" color="gray" align="left">
                  Estimated TG
                </Typography>
                <Typography
                  variant="h3"
                  color="white"
                  align="left"
                  className="mt-1 font-bold tracking-wider"
                >
                  {(Number(stakeAmount) * 1000).toFixed(2)} TG
                </Typography>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                isStaking ||
                !stakeAmount ||
                Number(stakeAmount) > Number(accountBalance?.formatted || 0)
              }
              className="w-full"
            >
              <span
                className={`font-actayRegular relative z-10 px-0 py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base ${
                  isStaking ||
                  !stakeAmount ||
                  Number(stakeAmount) > Number(accountBalance?.formatted || 0)
                    ? "opacity-50"
                    : ""
                }`}
              >
                <Typography
                  variant="button"
                  color="white"
                  align="center"
                  className="w-full"
                >
                  {isStaking
                    ? "Topping Up..."
                    : Number(stakeAmount) >
                        Number(accountBalance?.formatted || 0)
                      ? "Insufficient ETH"
                      : "Top Up TG"}
                </Typography>
              </span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TopUpTgDialog;
