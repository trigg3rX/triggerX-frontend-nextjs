import React, { useCallback } from "react";
import { Typography } from "../../ui/Typography";
import { Card } from "../../ui/Card";
import timeBasedSvg from "@/app/assets/create-job/time-based.svg";
import timeBasedGif from "@/app/assets/create-job/time-based.gif";
import conditionBasedSvg from "@/app/assets/create-job/condition-based.svg";
import conditionBasedGif from "@/app/assets/create-job/condition-based.gif";
import eventBasedSvg from "@/app/assets/create-job/event-based.svg";
import eventBasedGif from "@/app/assets/create-job/event-based.gif";
import { useJobForm } from "@/hooks/useJobForm";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { TriggerButton } from "./TriggerButton";
import { TriggerOption } from "@/types/job";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";

const options: TriggerOption[] = [
  {
    value: 1,
    label: "Time-based Trigger",
    icon: timeBasedSvg,
    selectedIcon: timeBasedGif,
  },
  {
    value: 2,
    label: "Condition-based Trigger",
    icon: conditionBasedSvg,
    selectedIcon: conditionBasedGif,
  },
  {
    value: 3,
    label: "Event-based Trigger",
    icon: eventBasedSvg,
    selectedIcon: eventBasedGif,
  },
];

export const TriggerTypeSelector = () => {
  const { isConnected } = useWalletConnectionContext();
  const { jobType, handleJobTypeChange } = useJobForm();

  const handleTriggerSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, value: number) => {
      if (isConnected) {
        handleJobTypeChange(e, value);
        console.log("Selected Job Type:", value);
      }
    },
    [isConnected, handleJobTypeChange],
  );

  return (
    <>
      <Card className="p-6">
        <Typography
          variant="h3"
          align="left"
          color="secondary"
          className="mb-6"
        >
          Trigger Type
        </Typography>
        <div className="flex flex-wrap md:flex-nowrap gap-4 justify-between w-[95%] mx-auto">
          {options.map((option) => (
            <TriggerButton
              key={option.value}
              option={option}
              isSelected={Number(option.value) === jobType}
              onSelect={handleTriggerSelect}
            />
          ))}
        </div>
      </Card>
      <WalletConnectionCard className="mt-4" />
    </>
  );
};
