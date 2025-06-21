import React, { useState } from "react";
import clsx from "clsx";
import { apiData } from "@/data/apiData"; // Import our data
import ApiMethod from "../api/ApiMethod";
import ApiDetailView from "./ApiDetailView";
import styles from "@/app/styles/scrollbar.module.css";

const ApiDocsPage: React.FC = () => {
  // Set the first API as the default active one
  const [activeApiId, setActiveApiId] = useState<string>(apiData[0].id);

  const activeApi = apiData.find((api) => api.id === activeApiId);

  return (
    <div
      className={`flex flex-col lg:flex-row gap-4 py-2 lg:py-4 lg:gap-8 max-h-[500px] overflow-y-scroll m ${styles.customScrollbar}`}
    >
      {/* Column 1: API List (Navigation) */}
      <div className="w-full lg:w-[30%]  lg:sticky top-0 ">
        <h3 className="text-xl font-bold mb-4">Present APIs</h3>
        <div className="space-y-1 lg:space-y-2">
          {apiData.map((api) => (
            <button
              key={api.id}
              className={clsx(
                "w-full text-left p-2 lg:p-3 rounded-lg transition-colors",
                {
                  "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-[#4B4A4A] rounded-xl":
                    activeApiId === api.id,
                  "hover:bg-gradient-to-r from-[#D9D9D924] to-[#14131324] hover:border border-[#4B4A4A] rounded-xl":
                    activeApiId !== api.id,
                },
              )}
              onClick={() => setActiveApiId(api.id)}
            >
              <div className="flex items-center justify-start gap-2 lg:gap-5">
                <ApiMethod method={api.method} />
                <span className="text-xs lg:text-sm">{api.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Column 2: API Details */}
      {activeApi && <ApiDetailView api={activeApi} />}
    </div>
  );
};

export default ApiDocsPage;
