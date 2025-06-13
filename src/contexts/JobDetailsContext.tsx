"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { ContractDetail, ContractDetails } from "@/types/job";

interface JobDetailsContextType {
  contractDetails: { [key: number]: ContractDetails };
  linkedJobs: { [key: number]: string[] };
  handleContractDetailChange: (
    jobType: number,
    jobKey: string,
    field: keyof ContractDetail,
    value: unknown,
  ) => void;
  handleLinkJob: (jobType: number) => void;
  handleDeleteLinkedJob: (jobType: number, jobId: string) => void;
}

const JobDetailsContext = createContext<JobDetailsContextType | undefined>(
  undefined,
);

export const JobDetailsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contractDetails, setContractDetails] = useState<{
    [key: number]: ContractDetails;
  }>({});
  const [linkedJobs, setLinkedJobs] = useState<{ [key: number]: string[] }>({});

  const handleContractDetailChange = useCallback(
    (
      jobType: number,
      jobKey: string,
      field: keyof ContractDetail,
      value: unknown,
    ) => {
      setContractDetails((prev) => ({
        ...prev,
        [jobType]: {
          ...prev[jobType],
          [jobKey]: {
            ...prev[jobType]?.[jobKey],
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const handleLinkJob = useCallback((jobType: number) => {
    const newJobId = `job_${Date.now()}`;
    setLinkedJobs((prev) => ({
      ...prev,
      [jobType]: [...(prev[jobType] || []), newJobId],
    }));
  }, []);

  const handleDeleteLinkedJob = useCallback(
    (jobType: number, jobId: string) => {
      setLinkedJobs((prev) => ({
        ...prev,
        [jobType]: prev[jobType].filter((id) => id !== jobId),
      }));
    },
    [],
  );

  return (
    <JobDetailsContext.Provider
      value={{
        contractDetails,
        linkedJobs,
        handleContractDetailChange,
        handleLinkJob,
        handleDeleteLinkedJob,
      }}
    >
      {children}
    </JobDetailsContext.Provider>
  );
};

export const useJobDetails = () => {
  const context = useContext(JobDetailsContext);
  if (context === undefined) {
    throw new Error("useJobDetails must be used within a JobDetailsProvider");
  }
  return context;
};
