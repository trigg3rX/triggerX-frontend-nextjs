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
  } = useJobFormContext();

  const handleFormSubmit = () => {
    return console.log("submitted");
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
              <Card className="space-y-8">
                <JobTitleInput />
                <NetworkSelector />
                <TimeframeInputs
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                  error={null}
                />
                {jobType === 1 ? (
                  <TimeIntervalInputs
                    timeInterval={timeInterval}
                    onTimeIntervalChange={handleTimeIntervalChange}
                    error={null}
                  />
                ) : (
                  <RecurringInput />
                )}
                {jobType === 3 && (
                  <ContractDetails
                    contractKey="eventContract"
                    label="Event Contract Address"
                  />
                )}
                <ContractDetails
                  contractKey="contract"
                  label="Contract Address"
                />
              </Card>

              {linkedJobs[jobType]?.length > 0 && (
                <div className="space-y-8 relative z-40">
                  {linkedJobs[jobType].map((jobId) => (
                    <div
                      key={jobId}
                      className="relative bg-[#141414] backdrop-blur-xl rounded-2xl px-6 pt-12 pb-10 border border-white/10 hover:border-white/20 transition-all duration-300 space-y-8"
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
                      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <label className="block text-sm sm:text-base font-medium text-gray-300">
                          Network
                        </label>
                        <div className="relative w-full md:w-[70%] xl:w-[80%]">
                          <li className="text-sm xs:text-sm sm:text-base w-full bg-[#1a1a1a] text-white py-3 px-4 rounded-lg border border-white/10 flex items-center gap-5">
                            <p className="w-6 h-6 "></p>
                          </li>
                        </div>
                      </div>
                      <ContractDetails
                        contractKey={`${jobType}-${jobId}`}
                        label={`Contract Address for Linked Job ${jobId}`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4 justify-center items-center relative z-30 mt-8">
                <Button
                  type="submit"
                  color="yellow"
                  className="min-w-[120px] md:min-w-[170px]"
                >
                  Create Job
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
    </>
  );
};
