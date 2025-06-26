import { Suspense } from "react";
import { CreateJobLayout } from "./components/create-job/CreateJobLayout";
import { JobFormProvider } from "@/contexts/JobFormContext";
import CreateJobSkeleton from "./components/skeleton/CreateJobSkeleton";

export default function Home() {
  return (
    <Suspense fallback={<CreateJobSkeleton />}>
      <JobFormProvider>
        <CreateJobLayout />
      </JobFormProvider>
    </Suspense>
  );
}
