"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Typography } from "../ui/Typography";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import "./customToolbox";
import { validateBlocklyWorkspace } from "./validateBlocklyWorkspace";
import JobFeeModal from "../create-job/JobFeeModal";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { useAccount } from "wagmi";
import { syncBlocklyToJobForm } from "./utils/syncBlocklyToJobForm";

// Custom hooks
import { useBlocklyGenerators } from "./hooks/useBlocklyGenerators";
import { useBlocklyWorkspace } from "./hooks/useBlocklyWorkspace";

// Components
import { BlocklyHeader } from "./components/BlocklyHeader";
import { ErrorCard } from "./components/ErrorCard";
import { BalanceCard } from "./components/BalanceCard";
import { PermissionCard } from "./components/PermissionCard";
import { BlocklyWorkspaceSection } from "./components/BlocklyWorkspaceSection";

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

  // TG Balance context
  const { userBalance, fetchTGBalance } = useTGBalance();
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

  // Fetch TG balance on mount and when wallet changes
  useEffect(() => {
    if (address) {
      fetchTGBalance();
    }
  }, [address, chain, fetchTGBalance]);

  useEffect(() => {
    if (isModalOpen && address) {
      fetchTGBalance();
    }
  }, [isModalOpen, address, fetchTGBalance]);

  const handleCreateJob = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Reset all errors
      setJobTitleError(null);
      setPermissionError(null);
      setWorkspaceError(null);

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
          // Scroll to job title input
          setTimeout(() => {
            jobTitleErrorRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        } else {
          // For workspace-related errors
          setWorkspaceError(errorValue);
          // Scroll to workspace
          setTimeout(() => {
            workspaceScopeRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
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

  const handleSaveJob = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    alert("Workspace saved successfully!");
  }, []);

  return (
    <div className="flex flex-col gap-2 -mt-[10px] lg:-my-[200px] pt-[100px] pb-[400px]">
      <Typography variant="h1">Create Automation Job</Typography>

      <BlocklyHeader
        jobTitle={jobTitle}
        setJobTitle={setJobTitle}
        jobTitleError={jobTitleError}
        setJobTitleError={setJobTitleError}
        jobTitleErrorRef={jobTitleErrorRef}
        isModalOpen={isModalOpen}
        onSaveJob={handleSaveJob}
        onCreateJob={handleCreateJob}
      />

      <ErrorCard
        error={workspaceError}
        onClose={() => setWorkspaceError(null)}
      />

      <BalanceCard
        address={address}
        userBalance={userBalance}
        onRefresh={fetchTGBalance}
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
        />
      </div>

      {/* Job Fee Modal */}
      <JobFeeModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        estimatedFee={estimatedFee}
      />
    </div>
  );
}
