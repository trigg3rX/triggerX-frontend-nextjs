import { useRouter, useSearchParams } from "next/navigation";
import { Template } from "@/types/job";

export const useJobNavigation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateJobUrl = (template: Template) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("template", template.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearTemplateFromUrl = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("template");
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
    clearTemplateFromUrl,
    scrollToTemplate,
  };
};
