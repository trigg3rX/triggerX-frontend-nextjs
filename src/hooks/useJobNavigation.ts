import { useRouter, useSearchParams } from "next/navigation";
import { Template } from "@/types/job";

export const useJobNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateJobUrl = (template: Template) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("jobId"); // Remove jobId if present
    params.set("template", template.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // New function to clear both jobId and template
  const clearJobIdAndTemplateFromUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("template");
    params.delete("jobId");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const scrollToTemplate = () => {
    if (window.innerWidth < 1024) {
      requestAnimationFrame(() => {
        const templateSection = document.querySelector(".w-full.lg\\:w-3\\/4");
        templateSection?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return {
    updateJobUrl,
    clearJobIdAndTemplateFromUrl,
    scrollToTemplate,
  };
};
