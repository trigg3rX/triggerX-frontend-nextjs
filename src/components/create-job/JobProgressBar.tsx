import React from "react";

interface JobProgressBarProps {
  currentStep: number;
  steps: { id: number; text: string; status: string }[];
}

const JobProgressBar: React.FC<JobProgressBarProps> = ({
  currentStep,
  steps,
}) => {
  return (
    <div className="w-auto">
      {currentStep < steps.length && (
        <div
          key={steps[currentStep].id}
          className="transition-all duration-700 ease-in-out animate-pulse"
        >
          <h4 className="text-sm sm:text-md">{steps[currentStep].text}</h4>
        </div>
      )}
      <div className="h-1.5 bg-gray-500 opacity-50 rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-[#F8FF7C] transition-all duration-500"
          style={{
            width: `${((currentStep + 1) / (steps.length + 1)) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default JobProgressBar;
