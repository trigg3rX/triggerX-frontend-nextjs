import { forwardRef } from "react";
import { Timeframe } from "@/types/job";
import { TimeInputs } from "../../common/TimeInputs";

interface TimeframeInputsProps {
  timeframe: Timeframe;
  onTimeframeChange: (field: keyof Timeframe, value: string) => void;
  error: string | null;
  onClearError?: () => void;
}

const timeFields = [
  {
    label: "Days",
    field: "days" as const,
  },
  {
    label: "Hours",
    field: "hours" as const,
    max: 23,
  },
  {
    label: "Minutes",
    field: "minutes" as const,
    max: 59,
  },
];

export const TimeframeInputs = forwardRef<HTMLDivElement, TimeframeInputsProps>(
  ({ timeframe, onTimeframeChange, error, onClearError }, ref) => {
    return (
      <TimeInputs<keyof Timeframe>
        title="Timeframe"
        fields={timeFields}
        values={timeframe}
        onChange={onTimeframeChange}
        error={error}
        ref={ref}
        onClearError={onClearError}
      />
    );
  },
);

TimeframeInputs.displayName = "TimeframeInputs";
