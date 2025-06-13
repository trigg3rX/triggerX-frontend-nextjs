import { useState } from "react";
import { Timeframe, TimeInterval } from "@/types/job";
import { useJobDetails } from "@/contexts/JobDetailsContext";

export const useJobForm = () => {
  const [jobType, setJobType] = useState<number>(0);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("Ethereum");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [timeframe, setTimeframe] = useState<Timeframe>({
    days: 0,
    hours: 0,
    minutes: 0,
  });
  const [timeInterval, setTimeInterval] = useState<TimeInterval>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [recurring, setRecurring] = useState<boolean>(false);

  const {
    contractDetails,
    linkedJobs,
    handleContractDetailChange,
    handleLinkJob,
    handleDeleteLinkedJob,
  } = useJobDetails();

  const handleJobTypeChange = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: number,
  ) => {
    e.preventDefault();
    setJobType(type);
  };

  const handleTimeframeChange = (field: keyof Timeframe, value: string) => {
    setTimeframe((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  const handleTimeIntervalChange = (
    field: keyof TimeInterval,
    value: string,
  ) => {
    setTimeInterval((prev) => ({
      ...prev,
      [field]: parseInt(value) || 0,
    }));
  };

  return {
    jobType,
    selectedNetwork,
    setSelectedNetwork,
    jobTitle,
    setJobTitle,
    timeframe,
    timeInterval,
    recurring,
    setRecurring,
    contractDetails,
    linkedJobs,
    handleJobTypeChange,
    handleTimeframeChange,
    handleTimeIntervalChange,
    handleContractDetailChange,
    handleLinkJob,
    handleDeleteLinkedJob,
  };
};
