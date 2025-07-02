import React, { useState, useRef, useEffect } from "react";
import { apiData } from "@/data/apiData";
import ApiMethod from "../api/ApiMethod";
import ApiDetailView from "./ApiDetailView";
import styles from "@/app/styles/scrollbar.module.css";
import { Typography } from "../ui/Typography";
import { Card } from "../ui/Card";

const ApiDocsPage: React.FC = () => {
  // Set the first API as the default active one
  const [activeApiId, setActiveApiId] = useState<string>(apiData[0].id);
  const detailsRef = useRef<HTMLDivElement>(null);

  const activeApi = apiData.find((api) => api.id === activeApiId);

  useEffect(() => {
    if (detailsRef.current) {
      const isMobile = window.innerWidth < 1024; // Tailwind's lg breakpoint
      if (isMobile) {
        // Scroll the main window so the details panel is 200px from the top
        const rect = detailsRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY + rect.top;
        window.scrollTo({
          top: scrollTop - 200,
          behavior: "smooth",
        });
      } else {
        // Scroll the details panel's own scrollbar to 200px from the top
        detailsRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }
  }, [activeApiId]);

  return (
    <div
      className={`flex flex-col lg:flex-row gap-4 lg:gap-8 py-6 ${styles.customScrollbar}`}
    >
      {/* Column 1: API List (Navigation) */}
      <div className="w-full lg:w-[33%] lg:sticky top-0 ">
        <Typography variant="h2" className="mb-4" align="left">
          Present APIs
        </Typography>
        <div className="space-y-1 lg:space-y-2 overflow-auto">
          {apiData.map((api) => (
            <div
              key={api.id}
              className="cursor-pointer"
              onClick={() => setActiveApiId(api.id)}
            >
              <Card
                variant={activeApiId === api.id ? "gradient" : "default"}
                isActive={activeApiId === api.id}
                className="!p-3 !py-3.5"
              >
                <div className="flex items-center justify-start gap-2 lg:gap-5">
                  <ApiMethod method={api.method} />
                  <Typography variant="body" as="span" align="left">
                    {api.name}
                  </Typography>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: API Details */}
      <div
        ref={detailsRef}
        className="w-full lg:w-[67%] lg:max-h-[600px] overflow-y-auto"
      >
        {activeApi && <ApiDetailView api={activeApi} />}
      </div>
    </div>
  );
};

export default ApiDocsPage;
