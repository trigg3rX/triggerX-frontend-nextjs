import React, { useContext } from "react";
import { TextInput } from "../../ui/TextInput";
import { JobFormContext } from "@/contexts/JobFormContext";

export const JobTitleInput: React.FC = () => {
  const context = useContext(JobFormContext);
  if (context === undefined) {
    throw new Error("JobTitleInput must be used within a JobFormProvider");
  }
  const { jobTitle, setJobTitle } = context;

  return (
    <TextInput
      label="Job Title"
      placeholder="Enter job title"
      value={jobTitle}
      onChange={setJobTitle}
    />
  );
};
