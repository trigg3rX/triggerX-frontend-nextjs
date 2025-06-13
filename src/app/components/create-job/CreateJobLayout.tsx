"use client";

import React from "react";
import { PointsSystem } from "./PointsSystem";
import { TemplateList } from "./TemplateList";
import { JobProvider } from "@/contexts/JobContext";
import templatesData from "@/data/templates.json";
import { JobFormSection } from "./JobFormSection";
import { Typography } from "../ui/Typography";

export const CreateJobLayout: React.FC = () => {
  return (
    <JobProvider>
      <>
        <div className="w-[90%] mx-auto text-wrap">
          <Typography variant="h1">Create Automation Job</Typography>
          <Typography variant="h4" color="secondary" className="my-6">
            Set up your automated blockchain tasks with precise conditions and
            parameters.
          </Typography>
        </div>
        <div className="flex flex-col xl:flex-row gap-6 sm:gap-8 p-4 sm:p-6">
          <div className="w-full xl:w-1/3 space-y-6 sm:space-y-8">
            <PointsSystem />
            <TemplateList templates={templatesData.templates} />
          </div>
          <JobFormSection />
        </div>
      </>
    </JobProvider>
  );
};
