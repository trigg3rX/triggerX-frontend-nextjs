import React from "react";
import JobProgressBar from "./JobProgressBar";

interface JobProcessingProps {
  isStepperVisible: boolean;
  currentStep: number;
  steps: { id: number; text: string; status: string }[];
}

const JobProcessing: React.FC<JobProcessingProps> = ({
  isStepperVisible,
  currentStep,
  steps,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-white text-base text-center">Creating Job</h3>
        {isStepperVisible && (
          <JobProgressBar currentStep={currentStep} steps={steps} />
        )}
      </div>
    </>
  );
};

export default JobProcessing;
