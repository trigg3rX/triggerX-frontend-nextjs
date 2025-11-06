import React from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

interface BlocklyHeaderProps {
  jobTitle: string;
  setJobTitle: (title: string) => void;
  jobTitleError: string | null;
  setJobTitleError: (error: string | null) => void;
  jobTitleErrorRef: React.RefObject<HTMLDivElement | null>;
  isModalOpen: boolean;
  onSaveJob: (e: React.FormEvent) => void;
  onCreateJob: (e: React.FormEvent) => void;
}

export function BlocklyHeader({
  jobTitle,
  setJobTitle,
  jobTitleError,
  setJobTitleError,
  jobTitleErrorRef,
  isModalOpen,
  onSaveJob,
  onCreateJob,
}: BlocklyHeaderProps) {
  return (
    <Card className="flex items-center justify-between gap-4 !border-0 !p-3 mt-10">
      <div
        className="flex items-center gap-6 w-full md:w-auto"
        ref={jobTitleErrorRef}
      >
        <div className="flex items-center w-full md:w-[300px]">
          <input
            type="text"
            placeholder="Untitled Job"
            value={jobTitle}
            onChange={(e) => {
              const value = e.target.value;
              setJobTitle(value);
              if (value.trim() !== "") setJobTitleError(null);
            }}
            className="bg-[#181818] text-[#EDEDED] border border-[#A2A2A2] placeholder-[#A2A2A2] rounded-l-full px-6 py-2.5 focus:outline-none text-sm sm:text-base shadow-none w-full"
          />
          <button
            type="button"
            className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors w-12 h-12 aspect-square flex items-center justify-center -ml-8 z-10 rounded-full"
            aria-label="Set job title"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#fff"
              strokeWidth="2"
            >
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
              <path d="M20.71 7.04a1.004 1.004 0 0 0 0-1.42l-2.34-2.34a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
            </svg>
          </button>
        </div>
        {jobTitleError && (
          <div className="text-red-500 text-xs sm:text-sm mt-2">
            {jobTitleError}
          </div>
        )}
      </div>

      <div className="flex gap-4 justify-center items-center relative z-10">
        <Button
          type="button"
          color="white"
          className="min-w-[120px] md:min-w-[170px]"
          onClick={onSaveJob}
        >
          Save Job
        </Button>

        <Button
          type="button"
          color="yellow"
          className="min-w-[120px] md:min-w-[170px]"
          onClick={onCreateJob}
          disabled={isModalOpen}
        >
          {isModalOpen ? "Estimating fees..." : "Create Job"}
        </Button>
      </div>
    </Card>
  );
}
