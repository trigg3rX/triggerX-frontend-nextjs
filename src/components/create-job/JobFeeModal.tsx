import React, { useEffect, useRef, useState, useMemo } from "react";
import { Modal } from "../ui/Modal";
import { FiInfo } from "react-icons/fi";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import Tooltip from "../ui/Tooltip";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { useJobForm } from "@/contexts/JobFormContext";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import { parseEther } from "viem";
import JobProcessing from "./JobProcessing";

interface JobFeeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  estimatedFee: number;
}

const JobFeeModal: React.FC<JobFeeModalProps> = ({
  isOpen,
  setIsOpen,
  estimatedFee,
}) => {
  const { userBalance, fetchTGBalance } = useTGBalance();
  const {
    isSubmitting,
    isJobCreated,
    handleStakeTG,
    handleCreateJob,
    setIsJobCreated,
  } = useJobForm();
  const router = useRouter();

  const { address } = useAccount();
  const prevAddress = useRef<string | undefined>(address);
  const [topUpFailed, setTopUpFailed] = useState(false);
  const { data: ethBalance } = useBalance({
    address,
  });
  const [jobCreateFailed, setJobCreateFailed] = useState(false);

  useEffect(() => {
    if (
      isOpen &&
      address &&
      prevAddress.current &&
      address !== prevAddress.current
    ) {
      setIsOpen(false);
      setIsJobCreated(false);
    }
    prevAddress.current = address;
  }, [address, isOpen, setIsJobCreated, setIsOpen]);

  const hasEnoughBalance = useMemo(
    () => estimatedFee <= Number(userBalance),
    [estimatedFee, userBalance],
  );
  const requiredEth = useMemo(
    () => (0.001 * estimatedFee).toFixed(4),
    [estimatedFee],
  );
  const hasEnoughEthToStake =
    ethBalance && ethBalance.value >= parseEther(requiredEth);
  const isDisabled = false;

  const handleStake = async (e: React.MouseEvent) => {
    e.preventDefault();
    setJobCreateFailed(false);
    if (hasEnoughBalance) {
      const success = await handleCreateJob();
      setJobCreateFailed(!success);
      setTopUpFailed(false);
      fetchTGBalance();
    } else {
      const success = await handleStakeTG();
      setTopUpFailed(!success);
    }
  };

  useEffect(() => {
    if (!isOpen) setTopUpFailed(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setJobCreateFailed(false);
  }, [isOpen]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    setIsJobCreated(false);
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Redirect to dashboard or perform desired action
    setIsOpen(false);
    setIsJobCreated(false);
    router.push("/dashboard");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <JobProcessing />

      {!isJobCreated ? (
        <>
          <Typography variant="h2" className="mb-6">
            Estimated Fee
          </Typography>
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <div className="flex items-center">
                <Typography variant="body">Required TG</Typography>
                <Tooltip
                  title={
                    "TriggerGas (TG) is the standard unit for calculating computational and resource costs on the TriggerX platform."
                  }
                  placement="bottom"
                >
                  <FiInfo
                    className="text-gray-400 hover:text-white cursor-pointer ml-2 mb-1"
                    size={15}
                  />
                </Tooltip>
              </div>
              <Typography variant="body" color="secondary">
                {estimatedFee && estimatedFee > 0
                  ? ` ${estimatedFee.toFixed(2)} TG`
                  : "Something went wrong"}
              </Typography>
            </div>

            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <Typography variant="body">Your TG Balance</Typography>
              <Typography variant="body" color="secondary">
                {userBalance ? Number(userBalance).toFixed(2) : "0.0000"}
              </Typography>
            </div>

            {!hasEnoughBalance && (
              <div className="text-gray-300 flex flex-row justify-between gap-1 sm:gap-0 items-center">
                <div className="flex items-center">
                  <Typography variant="body">Required ETH to TG</Typography>
                  <Tooltip
                    title={
                      "Required ETH to Stake is based on the total TriggerXGas consumed and TriggerXGas Unit Price."
                    }
                    placement="top"
                  >
                    <FiInfo
                      className="text-gray-400 hover:text-white cursor-pointer ml-2"
                      size={15}
                    />
                  </Tooltip>
                </div>
                <Typography variant="body" color="secondary">
                  {requiredEth} ETH
                </Typography>
              </div>
            )}
          </div>
          <div className="flex flex-row gap-3 sm:gap-4">
            {hasEnoughBalance ? (
              <Button
                color="purple"
                onClick={handleStake}
                disabled={isDisabled || !estimatedFee}
                className="flex-1"
              >
                {isSubmitting
                  ? "Processing..."
                  : jobCreateFailed
                    ? "Try Again"
                    : "Next"}
              </Button>
            ) : (
              <Button
                onClick={handleStake}
                disabled={
                  isSubmitting ||
                  (!hasEnoughEthToStake && !topUpFailed) ||
                  !estimatedFee
                }
                className="flex-1"
              >
                {isSubmitting
                  ? "Topping Up..."
                  : topUpFailed
                    ? "Try Again"
                    : hasEnoughEthToStake && !hasEnoughBalance
                      ? "Top Up TG"
                      : "Insufficient ETH"}
              </Button>
            )}
            <Button
              onClick={handleClose}
              className="flex-1 bg-white/10 hover:bg-white/20"
            >
              Cancel
            </Button>
          </div>
          {!estimatedFee && (
            <Typography
              variant="caption"
              color="secondary"
              className="mt-6 opacity-50"
            >
              Unable to estimate the required TG fee. Please try again later or
              check your network connection.
            </Typography>
          )}
          {topUpFailed && (
            <Typography
              variant="caption"
              color="secondary"
              className="mt-6 opacity-50"
            >
              😕 Oops! Something went wrong while topping up your TG.
              <br />
              Please check your wallet and try again.
            </Typography>
          )}
          {!hasEnoughEthToStake && !isSubmitting && !topUpFailed && (
            <Typography
              variant="caption"
              color="secondary"
              className="mt-6 opacity-50"
            >
              🚫 Uh oh! Looks like your wallet is empty.
            </Typography>
          )}
          {jobCreateFailed && (
            <Typography
              variant="caption"
              color="secondary"
              className="mt-6 opacity-50"
            >
              😕 Looks like the job missed a step. Try again!
            </Typography>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:mt-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#A2A2A2] rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="white"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <Typography
            variant="h3"
            className="text-white text-lg sm:text-xl text-center"
          >
            Job Created Successfully!
          </Typography>
          <Typography
            variant="body"
            className="text-gray-400 text-center text-sm sm:text-base"
          >
            Your job has been created and is now active.
          </Typography>
          <Button onClick={handleDashboardClick} className="mb-5">
            Go to Dashboard
          </Button>
        </div>
      )}
    </Modal>
  );
};

export default JobFeeModal;
