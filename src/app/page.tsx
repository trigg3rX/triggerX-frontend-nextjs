import { Suspense } from "react";
import { CreateJobLayout } from "./components/create-job/CreateJobLayout";
import { JobFormProvider } from "@/contexts/JobFormContext";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobFormProvider>
        <CreateJobLayout />
      </JobFormProvider>
    </Suspense>
  );
}
