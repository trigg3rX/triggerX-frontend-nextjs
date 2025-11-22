"use client";

import React, { useCallback, useRef, useState } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import "./customToolbox";
import { validateBlocklyWorkspace } from "./validateBlocklyWorkspace";
import JobFeeModal from "../create-job/JobFeeModal";
import { useAccount } from "wagmi";
import { syncBlocklyToJobForm } from "./utils/syncBlocklyToJobForm";

// Custom hooks
import { useBlocklyGenerators } from "./hooks/useBlocklyGenerators";
import { useBlocklyWorkspace } from "./hooks/useBlocklyWorkspace";

// Components
import { BlocklyHeader } from "./components/BlocklyHeader";
import { ErrorCard } from "./components/ErrorCard";
import { PermissionCard } from "./components/PermissionCard";
import { BlocklyWorkspaceSection } from "./components/BlocklyWorkspaceSection";
import { MobileWarning } from "./MobileWarning";

export default function BlocklyDemo() {
  const workspaceScopeRef = useRef<HTMLDivElement | null>(null);

  // Get full job form context
  const jobFormContext = useJobFormContext();
  const {
    jobTitle,
    setJobTitle,
    setJobTitleError,
    jobTitleError,
    jobTitleErrorRef,
    selectedNetwork,
    estimatedFee,
    setEstimatedFee,
    isModalOpen,
    setIsModalOpen,
  } = jobFormContext;

  // Account info
  const { address, chain } = useAccount();

  // Permission and validation state
  const [hasConfirmedPermission, setHasConfirmedPermission] =
    useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const permissionCheckboxRef = useRef<HTMLDivElement | null>(null);

  // Custom hooks
  useBlocklyGenerators();
  const { xml, onXmlChange } = useBlocklyWorkspace();

  const handleCreateJob = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Reset all errors
      setJobTitleError(null);
      setPermissionError(null);
      setWorkspaceError(null);

      // Check job title first
      if (!jobTitle || jobTitle.trim() === "") {
        setJobTitleError("Job title is required.");
        // Scroll to job title input
        setTimeout(() => {
          jobTitleErrorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
        return;
      }

      // Validate workspace blocks
      const validationResult = validateBlocklyWorkspace({
        xml,
        jobTitle,
        connectedAddress: address, // Pass connected wallet address for validation
      });

      if (validationResult) {
        const { errorKey, errorValue } = validationResult;

        // Set appropriate error state
        if (errorKey === "jobTitle") {
          setJobTitleError(errorValue);
        } else {
          // For workspace-related errors
          setWorkspaceError(errorValue);
        }
        return;
      }

      // Check permission checkbox
      if (!hasConfirmedPermission) {
        const errorMsg =
          "Please confirm that the address has the required role/permission.";
        setPermissionError(errorMsg);
        // Scroll to permission checkbox
        setTimeout(() => {
          permissionCheckboxRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
        return;
      }

      // All validation passed - sync Blockly blocks to JobFormContext
      const syncSuccess = syncBlocklyToJobForm(xml, jobFormContext);

      if (!syncSuccess) {
        setWorkspaceError("Failed to sync workspace data. Please try again.");
        return;
      }

      // Open fee modal - JobFeeModal will handle fee estimation and job creation
      setEstimatedFee(0);
      setIsModalOpen(true);
    },
    [
      setJobTitleError,
      hasConfirmedPermission,
      xml,
      jobTitle,
      address,
      jobTitleErrorRef,
      setEstimatedFee,
      setIsModalOpen,
      setPermissionError,
      setWorkspaceError,
      jobFormContext,
    ],
  );

  return (
    <>
      {/* Mobile/Tablet Warning - Show below 768px */}
      <MobileWarning />

      {/* Desktop View - Show 768px and above */}
      <div className="hidden md:flex flex-col gap-2">
        <BlocklyHeader
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          jobTitleError={jobTitleError}
          setJobTitleError={setJobTitleError}
          jobTitleErrorRef={jobTitleErrorRef}
          isModalOpen={isModalOpen}
          onCreateJob={handleCreateJob}
        />

        <ErrorCard
          error={workspaceError}
          onClose={() => setWorkspaceError(null)}
        />

        <PermissionCard
          hasConfirmedPermission={hasConfirmedPermission}
          setHasConfirmedPermission={setHasConfirmedPermission}
          permissionError={permissionError}
          setPermissionError={setPermissionError}
          permissionCheckboxRef={permissionCheckboxRef}
          selectedNetwork={selectedNetwork}
        />

        <div className="flex gap-2 h-[80vh]">
          <BlocklyWorkspaceSection
            xml={xml}
            onXmlChange={onXmlChange}
            workspaceScopeRef={workspaceScopeRef}
            connectedAddress={address}
            connectedChainId={chain?.id}
          />
        </div>

        {/* Job Fee Modal */}
        <JobFeeModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          estimatedFee={estimatedFee}
        />
      </div>
    </>
  );
}
