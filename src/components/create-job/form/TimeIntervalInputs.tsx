import { forwardRef } from "react";
import { TimeInterval } from "@/types/job";
import { TimeInputs } from "../../common/TimeInputs";

interface TimeIntervalInputsProps {
  timeInterval: TimeInterval;
  onTimeIntervalChange: (field: keyof TimeInterval, value: string) => void;
  error: string | null;
  onClearError?: () => void;
}

const timeIntervalFields = [
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
  {
    label: "Seconds",
    field: "seconds" as const,
    max: 59,
  },
];

export const TimeIntervalInputs = forwardRef<
  HTMLDivElement,
  TimeIntervalInputsProps
>(({ timeInterval, onTimeIntervalChange, error, onClearError }, ref) => {
  return (
    <TimeInputs<keyof TimeInterval>
      title="Time Interval"
      fields={timeIntervalFields}
      values={timeInterval}
      onChange={onTimeIntervalChange}
      error={error}
      ref={ref}
      onClearError={onClearError}
    />
  );
});

TimeIntervalInputs.displayName = "TimeIntervalInputs";
