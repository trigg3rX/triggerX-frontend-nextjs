import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Modal } from "../ui/Modal";
import { FiInfo } from "react-icons/fi";
import { Typography } from "../ui/Typography";
import { Button } from "../ui/Button";
import Tooltip from "../ui/Tooltip";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { useJobForm } from "@/contexts/JobFormContext";
import { useRouter } from "next/navigation";
import { useAccount, useBalance } from "wagmi";
import JobProcessing from "./JobProcessing";
import { useSearchParams } from "next/navigation";
import GameCanvas from "./GameCanvas";

interface JobFeeModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  estimatedFee: number;
}

const steps = [
  { id: 1, text: "Updating Database", status: "pending" },
  { id: 2, text: "Validating Job", status: "pending" },
  { id: 3, text: "Calculating Fees", status: "pending" },
];

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
    estimateFee,
    jobType,
    timeframe,
    timeInterval,
    recurring,
    contractInteractions,
    extractJobDetails,
    getTimeframeInSeconds,
    getIntervalInSeconds,
    getNetworkIdByName,
    selectedNetwork,
    jobTitle,
    resetContractInteractionState,
    reset,
    estimatedFeeInWei,
  } = useJobForm();
  const router = useRouter();
  const { address, chain } = useAccount();
  const prevAddress = useRef<string | undefined>(address);
  const [topUpFailed, setTopUpFailed] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const { data: ethBalance } = useBalance({
    address,
  });
  const [jobCreateFailed, setJobCreateFailed] = useState(false);
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const isUpdateMode = Boolean(jobId);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepperVisible, setIsStepperVisible] = useState(true);
  const [feeEstimated, setFeeEstimated] = useState(false);

  // Prepare job details for fee estimation
  const getJobDetailsForEstimate = useCallback(() => {
    const networkId = getNetworkIdByName(selectedNetwork);
    const timeframeInSeconds = getTimeframeInSeconds(timeframe);
    const intervalInSeconds = getIntervalInSeconds(timeInterval);
    return extractJobDetails(
      "contract",
      contractInteractions,
      jobTitle,
      timeframeInSeconds,
      intervalInSeconds,
      recurring,
      address,
      networkId,
      jobType,
    );
  }, [
    contractInteractions,
    jobTitle,
    timeframe,
    timeInterval,
    recurring,
    address,
    getNetworkIdByName,
    selectedNetwork,
    jobType,
    extractJobDetails,
    getTimeframeInSeconds,
    getIntervalInSeconds,
  ]);

  // Stepper logic
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsStepperVisible(true);
      setFeeEstimated(false);
      return;
    }
    if (isOpen && isStepperVisible) {
      if (currentStep === 0) {
        const timer = setTimeout(() => setCurrentStep(1), 500);
        return () => clearTimeout(timer);
      }
      if (currentStep === 1) {
        const timer = setTimeout(() => setCurrentStep(2), 500);
        return () => clearTimeout(timer);
      }
      if (currentStep === 2 && !feeEstimated) {
        // Call estimateFee and wait for it to finish
        const doEstimate = async () => {
          const jobDetails = getJobDetailsForEstimate();
          await estimateFee(
            jobType,
            getTimeframeInSeconds(timeframe),
            getIntervalInSeconds(timeInterval),
            jobDetails.dynamic_arguments_script_url || "",
            recurring,
            Number(jobDetails.arg_type),
          );
          setFeeEstimated(true);
          setTimeout(() => {
            setIsStepperVisible(false);
          }, 500); // Small delay for smooth transition
        };
        doEstimate();
      }
    }
  }, [
    isOpen,
    currentStep,
    isStepperVisible,
    feeEstimated,
    estimateFee,
    getJobDetailsForEstimate,
    jobType,
    timeframe,
    timeInterval,
    recurring,
    getTimeframeInSeconds,
    getIntervalInSeconds,
  ]);

  // Reset stepper when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsStepperVisible(true);
      setFeeEstimated(false);
    }
  }, [isOpen]);

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

  // Refetch balances and reset modal state on address or network change
  useEffect(() => {
    if (isOpen && (address || chain)) {
      fetchTGBalance(); // Refetch TG balance
      setIsJobCreated(false);
      setTopUpFailed(false);
      setJobCreateFailed(false);
    }
  }, [address, chain, isOpen, fetchTGBalance, setIsJobCreated]);

  const hasEnoughBalance = useMemo(() => {
    const fee = Number(estimatedFee);
    const balance = Number(userBalance);
    const epsilon = 1e-6;
    const result = fee - balance <= epsilon;
    console.log(
      "estimatedFee:",
      fee,
      "userBalance:",
      balance,
      "hasEnoughBalance:",
      result,
    );
    return result;
  }, [estimatedFee, userBalance]);

  const requiredEth = useMemo(() => {
    if (estimatedFeeInWei) {
      // Convert Wei to ETH for display
      return (Number(estimatedFeeInWei) / 1e18).toFixed(6);
    }
    return (0.001 * estimatedFee).toFixed(6);
  }, [estimatedFee, estimatedFeeInWei]);

  const hasEnoughEthToStake = useMemo(() => {
    if (!ethBalance || !estimatedFeeInWei) return false;
    return ethBalance.value >= estimatedFeeInWei;
  }, [ethBalance, estimatedFeeInWei]);
  const isDisabled = false;

  const handleStake = async (e: React.MouseEvent) => {
    e.preventDefault();
    setJobCreateFailed(false);

    // Reset contract interaction state when starting a new attempt
    if (jobCreateFailed) {
      resetContractInteractionState();
    }

    if (hasEnoughBalance) {
      const success = await handleCreateJob(jobId || undefined);
      setJobCreateFailed(!success);
      setTopUpFailed(false);
      fetchTGBalance();
    } else {
      const success = await handleStakeTG();
      setTopUpFailed(!success);
      if (success) {
        setIsCheckingBalance(true);
      }
    }
  };

  // Poll TG balance after top-up until hasEnoughBalance is true
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isCheckingBalance && !hasEnoughBalance) {
      interval = setInterval(() => {
        fetchTGBalance();
      }, 1200);
    }
    if (isCheckingBalance && hasEnoughBalance) {
      setIsCheckingBalance(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckingBalance, hasEnoughBalance, fetchTGBalance]);

  useEffect(() => {
    if (!isOpen) setTopUpFailed(false);
  }, [isOpen]);

  // Reset contract interaction state when modal opens
  useEffect(() => {
    if (isOpen) {
      resetContractInteractionState();
    }
  }, [isOpen, resetContractInteractionState]);

  useEffect(() => {
    if (!isOpen) {
      setJobCreateFailed(false);
      // Reset contract interaction state when modal closes
      resetContractInteractionState();
    }
  }, [isOpen, resetContractInteractionState]);

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
      {/* Stepper and Game Canvas */}
      {isStepperVisible && (
        <JobProcessing
          isStepperVisible={isStepperVisible}
          currentStep={currentStep}
          steps={steps}
        />
      )}
      <GameCanvas />

      {/* Fee summary and buttons, only after stepper is done */}
      {!isStepperVisible && !isJobCreated && (
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
                  ? ` ${estimatedFee.toFixed(6)} TG`
                  : "Something went wrong"}
              </Typography>
            </div>

            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <Typography variant="body">Your TG Balance</Typography>
              <Typography variant="body" color="secondary">
                {userBalance ? Number(userBalance).toFixed(6) : "0.000000"}
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
                    : "Submit"}
              </Button>
            ) : (
              <Button
                onClick={handleStake}
                disabled={
                  isSubmitting ||
                  isCheckingBalance ||
                  (!hasEnoughEthToStake && !topUpFailed) ||
                  !estimatedFee
                }
                className="flex-1"
              >
                {isSubmitting
                  ? "Topping Up..."
                  : isCheckingBalance
                    ? "Checking TG Balance..."
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
          {!hasEnoughEthToStake &&
            !hasEnoughBalance &&
            !isSubmitting &&
            !topUpFailed && (
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
      )}
      {/* Success state */}
      {!isStepperVisible && isJobCreated && (
        <div className="flex flex-col items-center gap-3 sm:gap-4 mt-4 sm:mt-5">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#A2A2A2] rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="green"
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
            {isUpdateMode
              ? "Job Updated Successfully!"
              : "Job Created Successfully!"}
          </Typography>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={handleDashboardClick} className="mb-5">
              Go to Dashboard
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                reset();
                handleClose();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="mb-5"
            >
              Create New Job
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default JobFeeModal;
