import { useContext } from "react";
import { JobFormContext, JobFormContextType } from "@/contexts/JobFormContext";

export const useJobFormContext = (): JobFormContextType => {
  const context = useContext(JobFormContext);
  if (context === undefined) {
    throw new Error("useJobFormContext must be used within a JobFormProvider");
  }
  return context;
};
