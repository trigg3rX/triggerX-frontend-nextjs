import React, { useState, useRef, useEffect } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";

interface BlocklyHeaderProps {
  jobTitle: string;
  setJobTitle: (title: string) => void;
  jobTitleError: string | null;
  setJobTitleError: (error: string | null) => void;
  jobTitleErrorRef: React.RefObject<HTMLDivElement | null>;
  isModalOpen: boolean;
  isValidating: boolean;
  onCreateJob: (e: React.FormEvent) => void;
  jobTitleInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function BlocklyHeader({
  jobTitle,
  setJobTitle,
  jobTitleError,
  setJobTitleError,
  jobTitleErrorRef,
  isModalOpen,
  isValidating,
  onCreateJob,
  jobTitleInputRef,
}: BlocklyHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(jobTitle);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = jobTitleInputRef ?? internalInputRef;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end of text
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length,
      );
    }
  }, [isEditing, inputRef]);

  const handleEditClick = () => {
    if (isEditing) {
      // Save mode
      handleSave();
    } else {
      // Edit mode
      setTempTitle(jobTitle);
      setIsEditing(true);
    }
  };

  const handleInputClick = () => {
    if (!isEditing) {
      setTempTitle(jobTitle);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (tempTitle.trim() !== "") {
      setJobTitle(tempTitle);
      setJobTitleError(null);
      setIsEditing(false);
    } else {
      setJobTitleError("Job title cannot be empty");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isEditing) {
      e.preventDefault();
      handleSave();
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      handleSave();
    }
  };

  return (
    <Card className="flex items-center justify-between gap-4 !border-0 !p-3">
      <div
        className="flex items-center gap-6 w-full md:w-auto"
        ref={jobTitleErrorRef}
      >
        <div className="flex items-center w-full md:w-[300px]">
          <input
            ref={inputRef}
            type="text"
            placeholder="Untitled Job"
            value={isEditing ? tempTitle : jobTitle}
            data-tour-id="job-title-input"
            onChange={(e) => {
              const value = e.target.value;
              if (isEditing) {
                setTempTitle(value);
              } else {
                setJobTitle(value);
              }
              if (value.trim() !== "") setJobTitleError(null);
            }}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            readOnly={!isEditing}
            className={`bg-[#181818] text-[#EDEDED] border border-[#A2A2A2] placeholder-[#A2A2A2] rounded-l-full px-6 py-2.5 focus:outline-none text-sm sm:text-base shadow-none w-full ${!isEditing ? "cursor-pointer" : ""}`}
          />
          <button
            type="button"
            onClick={handleEditClick}
            className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors w-12 h-12 aspect-square flex items-center justify-center -ml-8 z-10 rounded-full"
            aria-label={
              isEditing && tempTitle.trim()
                ? "Save job title"
                : "Edit job title"
            }
          >
            {isEditing && tempTitle.trim() ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#fff"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
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
            )}
          </button>
        </div>
        {jobTitleError && (
          <div className="text-red-500 text-xs sm:text-sm mt-2">
            {jobTitleError}
          </div>
        )}
      </div>

      <div className="flex gap-3 justify-center items-center relative z-10">
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new Event("blockly-quick-tour-open"));
            } catch {
              // no-op in non-browser environments
            }
          }}
          className="text-xs sm:text-sm text-gray-300 hover:text-white underline underline-offset-4"
        >
          Visual guide
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              window.dispatchEvent(new Event("blockly-job-tour-open"));
            } catch {
              // no-op in non-browser environments
            }
          }}
          className="text-xs sm:text-sm text-gray-300 hover:text-white underline underline-offset-4"
        >
          Job guide
        </button>
        <Button
          type="button"
          color="yellow"
          className="min-w-[120px] md:min-w-[170px]"
          onClick={onCreateJob}
          disabled={isModalOpen || isValidating}
          data-tour-id="create-job-button"
        >
          {isValidating
            ? "Validating data..."
            : isModalOpen
              ? "Estimating fees..."
              : "Create Job"}
        </Button>
      </div>
    </Card>
  );
}
