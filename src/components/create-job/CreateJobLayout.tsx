"use client";

import React from "react";
import { PointsSystem } from "./PointsSystem";
import { TemplateList } from "./TemplateList";
import { JobProvider } from "@/contexts/JobContext";
import templatesData from "@/data/templates.json";
import { JobFormSection } from "./JobFormSection";
import { Typography } from "../ui/Typography";
import { useJob } from "@/contexts/JobContext";

export const CreateJobLayout: React.FC = () => {
  return (
    <JobProvider templates={templatesData.templates}>
      <CreateJobLayoutContent />
    </JobProvider>
  );
};

const CreateJobLayoutContent: React.FC = () => {
  const jobFormRef = React.useRef<HTMLDivElement>(null);
  const { selectedJob } = useJob();

  const handleScrollToForm = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1026 &&
      jobFormRef.current
    ) {
      const y =
        jobFormRef.current.getBoundingClientRect().top + window.scrollY - 200;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  React.useEffect(() => {
    if (selectedJob === null) {
      handleScrollToForm();
    } else if (typeof window !== "undefined" && window.innerWidth >= 1026) {
      // On desktop, scroll to JobFormSection when a template is selected
      if (jobFormRef.current) {
        const y =
          jobFormRef.current.getBoundingClientRect().top + window.scrollY - 200;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  }, [selectedJob]);

  return (
    <>
      <Typography variant="h1">Create Automation Job</Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        Set up your automated blockchain tasks with precise conditions and
        parameters.
      </Typography>

      <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 p-4 sm:p-6">
        <div className="w-full xl:w-1/3">
          <div className="xl:sticky xl:top-[200px] xl:max-h-[calc(100vh-200px)] xl:overflow-auto space-y-6 sm:space-y-8">
            <PointsSystem />
            <TemplateList
              templates={templatesData.templates}
              onTemplateSelect={handleScrollToForm}
            />
          </div>
        </div>
        <div ref={jobFormRef} className="w-full xl:w-2/3">
          <JobFormSection />
        </div>
      </div>
    </>
  );
};
