import React, { useRef } from "react";
import dynamic from "next/dynamic";

const TriggerTypeSelector = dynamic(
  () =>
    import("./form/TriggerTypeSelector").then((mod) => mod.TriggerTypeSelector),
  { ssr: false, loading: () => null },
);

import { useFormKeyboardNavigation } from "@/hooks/useFormKeyboardNavigation";

export const JobForm = ({}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { handleKeyDown } = useFormKeyboardNavigation();

  const handleFormSubmit = () => {
    return console.log("submitted");
  };

  return (
    <>
      <form
        ref={formRef}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        className="w-full"
      >
        <div className="space-y-8">
          <TriggerTypeSelector />
        </div>
      </form>
    </>
  );
};
