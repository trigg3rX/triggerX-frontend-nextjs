"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Template, JobContextType } from "@/types/job";
import { useJobNavigation } from "@/hooks/useJobNavigation";

interface JobProviderProps {
  children: React.ReactNode;
  templates: Template[];
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export const JobProvider: React.FC<JobProviderProps> = ({
  children,
  templates,
}) => {
  const [selectedJob, setSelectedJob] = useState<Template | null>(null);
  const { updateJobUrl, clearJobIdAndTemplateFromUrl, scrollToTemplate } =
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
    clearJobIdAndTemplateFromUrl();
  }, [clearJobIdAndTemplateFromUrl]);

  // On mount, check for ?template=... in the URL and select the template by id
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const templateId = url.searchParams.get("template");
      if (templateId && templates && templates.length > 0) {
        const found = templates.find(
          (t) => t.id.toLowerCase() === templateId.toLowerCase(),
        );
        if (found) {
          setSelectedJob(found);
        }
      }
    }
  }, [templates]);

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
