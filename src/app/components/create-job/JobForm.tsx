import React, { useRef } from "react";
import { useFormKeyboardNavigation } from "@/hooks/useFormKeyboardNavigation";
import { Card } from "../ui/Card";
import { TriggerTypeSelector } from "./form/TriggerTypeSelector";
import { NetworkSelector } from "./form/NetworkSelector";
import { JobTitleInput } from "./form/JobTitleInput";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import { TimeframeInputs } from "./form/TimeframeInputs";
import { TimeIntervalInputs } from "./form/TimeIntervalInputs";
import { RecurringInput } from "./form/RecurringInput";
import { ContractDetails } from "./form/ContractDetails";
import { Button } from "../ui/Button";
import { DeleteConfirmationButton } from "./form/DeleteConfirmationButton";
import { Dropdown } from "../ui/Dropdown";
import networksData from "@/utils/networks.json";
import { validateJobForm } from "./validateJobForm";
import { useAccount } from "wagmi";
import JobFeeModal from "./JobFeeModal";

const networkIcons = Object.fromEntries(
  Object.entries(networksData.networkIcons).map(([name, icon]) => [
    name,
    <svg
      key={name}
      viewBox={icon.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={icon.path}
        fill="currentColor"
      />
    </svg>,
  ]),
);

function scrollToErrorRef(
  scrollToId: string,
  refs: {
    jobTitleErrorRef: React.RefObject<HTMLDivElement | null>;
    errorFrameRef: React.RefObject<HTMLDivElement | null>;
    errorIntervalRef: React.RefObject<HTMLDivElement | null>;
  },
) {
  if (scrollToId.startsWith("job-title-input"))
    refs.jobTitleErrorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  else if (scrollToId.startsWith("timeframe-inputs"))
    refs.errorFrameRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  else if (scrollToId.startsWith("time-interval-inputs"))
    refs.errorIntervalRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  else
    document
      .getElementById(scrollToId)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export const JobForm: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const { handleKeyDown } = useFormKeyboardNavigation();
  const {
    jobType,
    timeframe,
    handleTimeframeChange,
    timeInterval,
    handleTimeIntervalChange,
    linkedJobs,
    handleLinkJob,
    handleDeleteLinkedJob,
    selectedNetwork,
    validateTimeframe,
    validateTimeInterval,
    validateJobTitle,
    validateABI,
    jobTitle,
    jobTitleError,
    errorFrame,
    errorInterval,
    setErrorFrame,
    setErrorInterval,
    setJobTitleError,
    errorFrameRef,
    errorIntervalRef,
    jobTitleErrorRef,
    contractInteractions,
    contractErrors,
    setContractErrors,
    recurring,
    extractJobDetails,
    getTimeframeInSeconds,
    getIntervalInSeconds,
    getNetworkIdByName,
    estimateFee,
    estimatedFee,
    isModalOpen,
    setIsModalOpen,
  } = useJobFormContext();
  const { address: userAddress } = useAccount();
  const networkId = getNetworkIdByName(selectedNetwork);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorFrame(null);
    setErrorInterval(null);
    setJobTitleError(null);
    setContractErrors({});

    const validationResult = validateJobForm({
      jobType,
      jobTitle,
      timeframe,
      timeInterval,
      contractInteractions,
      linkedJobs,
      validateJobTitle,
      validateTimeframe,
      validateTimeInterval,
      validateABI,
    });
    if (validationResult) {
      const { errorKey, errorValue, scrollToId } = validationResult;
      if (errorKey === "jobTitle") setJobTitleError(errorValue);
      else if (errorKey === "timeframe") setErrorFrame(errorValue);
      else if (errorKey === "timeInterval") setErrorInterval(errorValue);
      else setContractErrors((prev) => ({ ...prev, [errorKey]: errorValue }));
      setTimeout(() => {
        scrollToErrorRef(scrollToId, {
          jobTitleErrorRef,
          errorFrameRef,
          errorIntervalRef,
        });
      }, 100);
      return;
    }
    // If all validations pass:
    const timeframeInSeconds = getTimeframeInSeconds(timeframe);
    const intervalInSeconds = getIntervalInSeconds(timeInterval);
    const jobDetails = [
      extractJobDetails(
        "contract",
        contractInteractions,
        jobTitle,
        timeframeInSeconds,
        intervalInSeconds,
        recurring,
        userAddress,
        networkId,
        jobType,
      ),
    ];
    if (linkedJobs[jobType]?.length > 0) {
      for (const jobId of linkedJobs[jobType]) {
        const jobKey = `${jobType}-${jobId}`;
        jobDetails.push(
          extractJobDetails(
            jobKey,
            contractInteractions,
            jobTitle,
            timeframeInSeconds,
            intervalInSeconds,
            recurring,
            userAddress,
            networkId,
            jobType,
          ),
        );
      }
    }
    // Set upper_limit and lower_limit as numbers according to the rules
    jobDetails.forEach((jobData) => {
      jobData.upper_limit =
        jobData.condition_type === "In Range" || jobData.upper_limit
          ? String(parseFloat(jobData.upper_limit as string) || 0)
          : "0";
      jobData.lower_limit =
        jobData.condition_type === "In Range"
          ? String(parseFloat(jobData.lower_limit as string) || 0)
          : "0";
    });

    // Save jobDetails for modal actions
    setIsModalOpen(true);
    // Start fee estimation

    await estimateFee(
      jobType,
      timeframeInSeconds,
      intervalInSeconds,
      jobDetails[0].dynamic_arguments_script_url || "",
      recurring,
      Number(jobDetails[0].arg_type),
    );
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="w-full"
      >
        <div className="space-y-8">
          <TriggerTypeSelector />
          {jobType !== 0 && (
            <>
              <Card className="space-y-8 relative z-50">
                <JobTitleInput
                  error={jobTitleError || null}
                  ref={jobTitleErrorRef}
                />
                <NetworkSelector />
                <TimeframeInputs
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                  error={errorFrame || null}
                  ref={errorFrameRef}
                  onClearError={() => setErrorFrame(null)}
                />
                {jobType === 1 ? (
                  <TimeIntervalInputs
                    timeInterval={timeInterval}
                    onTimeIntervalChange={handleTimeIntervalChange}
                    error={errorInterval || null}
                    ref={errorIntervalRef}
                    onClearError={() => setErrorInterval(null)}
                  />
                ) : (
                  <RecurringInput />
                )}
                {jobType === 3 && (
                  <ContractDetails
                    contractKey="eventContract"
                    label="Event Contract Address"
                    error={contractErrors["eventContractAddress"]}
                    abiError={contractErrors["eventContractABI"]}
                    targetError={contractErrors["eventContractTarget"]}
                  />
                )}
                {/* Contract Address Error Display and Scroll Anchor */}
                <ContractDetails
                  contractKey="contract"
                  label="Contract Address"
                  error={contractErrors["contractAddress"]}
                  abiError={contractErrors["contractABI"]}
                  targetError={contractErrors["contractTarget"]}
                  ipfsError={contractErrors["contractIpfs"]}
                  argsError={contractErrors["contractArgs"]}
                  sourceUrlError={contractErrors["contractSourceUrl"]}
                  conditionTypeError={contractErrors["contractConditionType"]}
                  limitsError={contractErrors["contractLimits"]}
                />
              </Card>

              {linkedJobs[jobType]?.length > 0 && (
                <div className="space-y-8 relative z-30">
                  {linkedJobs[jobType].map((jobId) => (
                    <Card key={jobId} className="relative space-y-8 !pt-[50px]">
                      <div className="absolute top-0 left-0 bg-[#303030] border-b border-white/10 flex justify-center items-center gap-3 mt-0 w-[100%] rounded-2xl rounded-br-none rounded-bl-none">
                        <p className="py-4 text-sm md:text-base">
                          Linked Job {jobId}
                        </p>
                        <DeleteConfirmationButton
                          jobType={jobType}
                          jobId={jobId}
                          handleDeleteLinkedJob={handleDeleteLinkedJob}
                        />
                      </div>
                      <Dropdown
                        label="Network"
                        options={networksData.supportedNetworks}
                        selectedOption={selectedNetwork}
                        onChange={() => {}}
                        icons={networkIcons}
                        className="pointer-events-none opacity-60 cursor-not-allowed"
                      />
                      <ContractDetails
                        contractKey={`${jobType}-${jobId}`}
                        label={`Contract Address`}
                        error={contractErrors[`${jobType}-${jobId}Address`]}
                        abiError={contractErrors[`${jobType}-${jobId}ABI`]}
                        targetError={
                          contractErrors[`${jobType}-${jobId}Target`]
                        }
                        ipfsError={contractErrors[`${jobType}-${jobId}Ipfs`]}
                        argsError={contractErrors[`${jobType}-${jobId}Args`]}
                        sourceUrlError={
                          contractErrors[`${jobType}-${jobId}SourceUrl`]
                        }
                        conditionTypeError={
                          contractErrors[`${jobType}-${jobId}ConditionType`]
                        }
                        limitsError={
                          contractErrors[`${jobType}-${jobId}Limits`]
                        }
                      />
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center items-center relative z-10 mt-8">
                <Button
                  type="submit"
                  color="yellow"
                  className="min-w-[120px] md:min-w-[170px]"
                  disabled={isModalOpen}
                >
                  {isModalOpen ? "Estimating fees..." : "Create Job"}
                </Button>
                {(linkedJobs[jobType]?.length ?? 0) < 3 && (
                  <Button
                    type="button"
                    color="white"
                    className="min-w-[120px] md:min-w-[170px]"
                    onClick={() => handleLinkJob(jobType)}
                  >
                    Link Job
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </form>

      <JobFeeModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        estimatedFee={estimatedFee}
      />
    </>
  );
};
