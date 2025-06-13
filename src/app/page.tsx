import { Suspense } from "react";
import { CreateJobLayout } from "./components/create-job/CreateJobLayout";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateJobLayout />
    </Suspense>
  );
}
