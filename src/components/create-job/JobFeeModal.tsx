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
import { useTriggerBalance } from "@/contexts/BalanceContext";
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
  const { userBalance, fetchBalance } = useTriggerBalance();
  const {
    isSubmitting,
    isJobCreated,
    handleTopUpETH,
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
    feePerExecution,
    desiredExecutions,
    setDesiredExecutions,
    calculatedExecutions,
    executionMode,
    selectedSafeWallet,
    userSafeWallets,
    language,
  } = useJobForm();
  const router = useRouter();
  const { address, chain } = useAccount();
  const chainId = chain?.id;
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
      language || "go",
      executionMode,
      selectedSafeWallet,
      chainId,
      userSafeWallets,
    );
  }, [
    contractInteractions,
    jobTitle,
    timeframe,
    timeInterval,
    recurring,
    address,
    chainId,
    getNetworkIdByName,
    selectedNetwork,
    jobType,
    language,
    executionMode,
    selectedSafeWallet,
    userSafeWallets,
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
          await estimateFee(jobDetails);
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
      fetchBalance(); // Refetch ETH balance
      setIsJobCreated(false);
      setTopUpFailed(false);
      setJobCreateFailed(false);
    }
  }, [address, chain, isOpen, fetchBalance, setIsJobCreated]);

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
    if (estimatedFeeInWei && userBalance) {
      // Calculate the difference needed
      const balanceInWei = BigInt(Math.floor(Number(userBalance) * 1e18));
      const difference = estimatedFeeInWei - balanceInWei;
      if (difference > 0) {
        return (Number(difference) / 1e18).toFixed(8);
      }
    }
    return "0.00000000";
  }, [estimatedFeeInWei, userBalance]);

  const hasEnoughEthToStake = useMemo(() => {
    if (!ethBalance || !estimatedFeeInWei) return false;
    return ethBalance.value >= estimatedFeeInWei;
  }, [ethBalance, estimatedFeeInWei]);
  const isDisabled = false;

  const handleTopUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
      fetchBalance();
    } else {
      const success = await handleTopUpETH();
      setTopUpFailed(!success);
      if (success) {
        setIsCheckingBalance(true);
      }
    }
  };

  // Poll ETH balance after top-up until hasEnoughBalance is true
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isCheckingBalance && !hasEnoughBalance) {
      interval = setInterval(() => {
        fetchBalance();
      }, 1200);
    }
    if (isCheckingBalance && hasEnoughBalance) {
      setIsCheckingBalance(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckingBalance, hasEnoughBalance, fetchBalance]);

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

  const handleClose = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault();
    setIsOpen(false);
    setIsJobCreated(false);
  };

  const handleDashboardClick = (e: React.MouseEvent<HTMLButtonElement>) => {
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
            {/* Fee per execution */}
            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <div className="flex items-center">
                <Typography variant="body">Fee per Execution</Typography>
                <Tooltip
                  title={
                    "Cost for each job execution on the TriggerX platform."
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
                {feePerExecution
                  ? `${(Number(feePerExecution) / 1e18).toFixed(8)} ETH`
                  : "Calculating..."}
              </Typography>
            </div>

            {/* Number of executions */}
            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <div className="flex items-center">
                <Typography variant="body">Number of Executions</Typography>
                <Tooltip
                  title={
                    calculatedExecutions !== null
                      ? "Auto-calculated based on timeframe/interval for time-based jobs"
                      : "Number of times you want to fund this job for"
                  }
                  placement="bottom"
                >
                  <FiInfo
                    className="text-gray-400 hover:text-white cursor-pointer ml-2 mb-1"
                    size={15}
                  />
                </Tooltip>
              </div>
              {calculatedExecutions !== null ? (
                <Typography variant="body" color="secondary">
                  {calculatedExecutions} (auto-calculated)
                </Typography>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={desiredExecutions}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = Math.max(1, parseInt(e.target.value) || 1);
                    setDesiredExecutions(value);
                  }}
                  className="w-24 px-2 py-1 text-right bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-purple-500"
                />
              )}
            </div>

            {/* Total required ETH */}
            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center border-t border-white/10 pt-3">
              <div className="flex items-center">
                <Typography variant="body" className="font-semibold">
                  Total Required ETH
                </Typography>
                <Tooltip
                  title={
                    "Total ETH needed to fund all executions on the TriggerX platform."
                  }
                  placement="bottom"
                >
                  <FiInfo
                    className="text-gray-400 hover:text-white cursor-pointer ml-2 mb-1"
                    size={15}
                  />
                </Tooltip>
              </div>
              <Typography
                variant="body"
                color="secondary"
                className="font-semibold"
              >
                {estimatedFee && estimatedFee > 0
                  ? `${estimatedFee.toFixed(6)} ETH`
                  : "Calculating..."}
              </Typography>
            </div>

            {/* Your ETH balance */}
            <div className="flex flex-row justify-between gap-1 sm:gap-0 items-center">
              <Typography variant="body">Your ETH Balance</Typography>
              <Typography variant="body" color="secondary">
                {userBalance ? Number(userBalance).toFixed(8) : "0.000000"}
              </Typography>
            </div>

            {!hasEnoughBalance && (
              <div className="text-gray-300 flex flex-row justify-between gap-1 sm:gap-0 items-center">
                <div className="flex items-center">
                  <Typography variant="body">Required ETH to top-up</Typography>
                  <Tooltip
                    title={"Additional ETH needed to fund this job."}
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
                onClick={handleTopUp}
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
                onClick={handleTopUp}
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
                    ? "Checking ETH Balance..."
                    : topUpFailed
                      ? "Try Again"
                      : hasEnoughEthToStake && !hasEnoughBalance
                        ? "Top Up ETH"
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
              Unable to estimate the required ETH fee. Please try again later or
              check your network connection.
            </Typography>
          )}
          {topUpFailed && (
            <Typography
              variant="caption"
              color="secondary"
              className="mt-6 opacity-50"
            >
              😕 Oops! Something went wrong while topping up your ETH.
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
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
