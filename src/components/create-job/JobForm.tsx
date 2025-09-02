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
import JobFeeModal from "./JobFeeModal";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { LucideCopyButton } from "../ui/CopyButton";
import { useSearchParams } from "next/navigation";
import { useJobs } from "@/hooks/useJobs";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { useChainId } from "wagmi";

const networkIcons = Object.fromEntries(
  Object.entries(networksData.networkIcons).map(([name, icon]) => [
    name,
    <svg
      key={name}
      viewBox={icon.viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {icon.paths ? (
        icon.paths.map((d, i) => (
          <path
            key={i}
            fillRule="evenodd"
            clipRule="evenodd"
            d={d}
            fill="currentColor"
          />
        ))
      ) : (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d={icon.path}
          fill="currentColor"
        />
      )}
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
  const chainId = useChainId();
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
    estimatedFee,
    isModalOpen,
    setIsModalOpen,
    setEstimatedFee,
    hasConfirmedPermission,
    setHasConfirmedPermission,
    permissionError,
    setPermissionError,
  } = useJobFormContext();

  const { isConnected } = useWalletConnectionContext();

  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const { jobs } = useJobs();
  const jobForm = useJobFormContext();
  const isUpdateMode = Boolean(jobId);

  React.useEffect(() => {
    if (jobId && jobs.length > 0) {
      // Search in main jobs first
      let job = jobs.find((j) => String(j.id) === String(jobId));

      // If not found in main jobs, search in linked jobs
      if (!job) {
        for (const mainJob of jobs) {
          if (mainJob.linkedJobs && mainJob.linkedJobs.length > 0) {
            const linkedJob = mainJob.linkedJobs.find(
              (lj) => String(lj.id) === String(jobId),
            );
            if (linkedJob) {
              job = linkedJob;
              break;
            }
          }
        }
      }

      if (job) {
        (async () => {
          // Map string taskDefinitionId to numeric trigger type
          const triggerTypeMap: Record<string, number> = {
            "Time-based": 1,
            "Condition-based": 2,
            "Event-based": 3,
          };
          const triggerType = triggerTypeMap[job.taskDefinitionId] || 1;
          jobForm.setJobType(triggerType);
          jobForm.setJobTitle(job.jobTitle);
          // Convert job.timeFrame (seconds) to {days, hours, minutes}
          const tf = Number(job.timeFrame);
          const days = Math.floor(tf / 86400);
          const hours = Math.floor((tf % 86400) / 3600);
          const minutes = Math.floor((tf % 3600) / 60);
          jobForm.setTimeframe({ days, hours, minutes });
          // Convert job.timeInterval (seconds) to {hours, minutes, seconds}
          const ti = Number(job.timeInterval);
          const tiHours = Math.floor(ti / 3600);
          const tiMinutes = Math.floor((ti % 3600) / 60);
          const tiSeconds = ti % 60;
          jobForm.setTimeInterval({
            hours: tiHours,
            minutes: tiMinutes,
            seconds: tiSeconds,
          });
          // Fetch ABI using contract address
          const abiString = await fetchContractABI(
            job.targetContractAddress,
            chainId,
          );
          jobForm.handleSetContractDetails(
            "contract",
            job.targetContractAddress,
            abiString || "[]",
          );
          // Wait for state to update, then set function and arg type
          setTimeout(() => {
            jobForm.handleFunctionChange("contract", job.targetFunction || "");
            jobForm.handleArgumentTypeChange(
              "contract",
              job.argType === "2" ? "dynamic" : "static",
            );
          }, 100);
        })();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, jobs]);

  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorFrame(null);
    setErrorInterval(null);
    setJobTitleError(null);
    setContractErrors({});
    setPermissionError(null);

    // Check if the permission checkbox is checked
    if (!hasConfirmedPermission) {
      setPermissionError(
        "Please confirm that the address 0x2469...F474 has the required role/permission.",
      );
      return;
    }

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
    setEstimatedFee(0);
    setIsModalOpen(true);
    // Do NOT call estimateFee here. The modal will handle it.
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="w-full"
      >
        <div className="space-y-6 sm:space-y-8">
          <TriggerTypeSelector disabled={isUpdateMode} />
          {isConnected && jobType !== 0 && (
            <>
              <Card className="space-y-6 sm:space-y-8 relative z-50">
                <JobTitleInput
                  error={jobTitleError || null}
                  ref={jobTitleErrorRef}
                  readOnly={isUpdateMode}
                />
                {/* <NetworkSelector disabled={isUpdateMode} /> */}
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
                  <RecurringInput readOnly={!isUpdateMode ? false : false} />
                )}
                {jobType === 3 && (
                  <ContractDetails
                    contractKey="eventContract"
                    label="Event Contract Address"
                    error={contractErrors["eventContractAddress"]}
                    abiError={contractErrors["eventContractABI"]}
                    targetError={contractErrors["eventContractTarget"]}
                    readOnly={isUpdateMode}
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
                  readOnly={isUpdateMode}
                />
              </Card>

              {linkedJobs[jobType]?.length > 0 && (
                <div className="space-y-6 sm:space-y-8 relative z-30">
                  {linkedJobs[jobType].map((jobId) => (
                    <Card
                      key={jobId}
                      className="relative space-y-6 sm:space-y-8 !pt-[50px]"
                    >
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

              {/* Permission Checkbox */}
              <Card className="flex flex-col items-start gap-2">
                <div className="flex items-start gap-2">
                  <input
                    id="permission-checkbox"
                    type="checkbox"
                    checked={hasConfirmedPermission}
                    onChange={(e) => {
                      setHasConfirmedPermission(e.target.checked);
                      if (e.target.checked) setPermissionError(null);
                    }}
                    className="w-4 h-4"
                  />
                  <label
                    htmlFor="permission-checkbox"
                    className="text-sm select-none text-gray-400"
                  >
                    If your target function contains a modifier or requires
                    certain address for calling the function, then make sure
                    that this
                    <span className="ml-2 text-white break-all">
                      0x2469e89386947535A350EEBccC5F2754fd35F474
                    </span>
                    <LucideCopyButton
                      text="0xd2B4F73FE4c747716F20839c37C451f241226b03"
                      className="align-middle inline-block !px-2"
                    />
                    address have role/permission to call that function.
                  </label>
                </div>
                {permissionError && (
                  <div className="text-red-500 text-xs mt-1 ml-1">
                    {permissionError}
                  </div>
                )}
              </Card>

              <div className="flex gap-4 justify-center items-center relative z-10 mt-8">
                <Button
                  type="submit"
                  color="yellow"
                  className="min-w-[120px] md:min-w-[170px]"
                  disabled={isModalOpen}
                >
                  {isModalOpen
                    ? "Estimating fees..."
                    : isUpdateMode
                      ? "Update Job"
                      : "Create Job"}
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
