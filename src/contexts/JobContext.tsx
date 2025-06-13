"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { Template, JobContextType } from "@/types/job";
import { useJobNavigation } from "@/hooks/useJobNavigation";

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedJob, setSelectedJob] = useState<Template | null>(null);
  const { updateJobUrl, clearTemplateFromUrl, scrollToTemplate } =
    useJobNavigation();

  const handleJobSelect = useCallback(
    (template: Template) => {
      setSelectedJob(template);
      updateJobUrl(template);
      scrollToTemplate();
    },
    [updateJobUrl, scrollToTemplate],
  );

  const handleCreateCustomJob = useCallback(() => {
    setSelectedJob(null);
    clearTemplateFromUrl();
  }, [clearTemplateFromUrl]);

  return (
    <JobContext.Provider
      value={{
        selectedJob,
        setSelectedJob,
        handleJobSelect,
        handleCreateCustomJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};

export const useJob = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJob must be used within a JobProvider");
  }
  return context;
};
