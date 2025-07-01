import React, { useCallback } from "react";
import { Typography } from "../../ui/Typography";
import { Card } from "../../ui/Card";
import timeBasedSvg from "@/assets/create-job/time-based.svg";
import timeBasedGif from "@/assets/create-job/time-based.gif";
import conditionBasedSvg from "@/assets/create-job/condition-based.svg";
import conditionBasedGif from "@/assets/create-job/condition-based.gif";
import eventBasedSvg from "@/assets/create-job/event-based.svg";
import eventBasedGif from "@/assets/create-job/event-based.gif";
import { WalletConnectionCard } from "../../common/WalletConnectionCard";
import { TriggerButton } from "./TriggerButton";
import { TriggerOption } from "@/types/job";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { IoMdNotifications } from "react-icons/io";
import { useJobFormContext } from "@/hooks/useJobFormContext";

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

  const { jobType, handleJobTypeChange } = useJobFormContext();

  const handleTriggerSelect = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, value: number) => {
      if (isConnected) {
        handleJobTypeChange(e, value);
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
          className="mb-4 sm:mb-6"
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
      {isConnected && !jobType && (
        <Card>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <IoMdNotifications className="w-5 h-5 border rounded-full p-[2px] text-gray-300" />
            <Typography
              variant="body"
              align="center"
              color="secondary"
              className="text-wrap mt-0 sm:mt-[3px]"
            >
              Select trigger type to create a new job
            </Typography>
          </div>
        </Card>
      )}
      <WalletConnectionCard className="mt-4" />
    </>
  );
};
