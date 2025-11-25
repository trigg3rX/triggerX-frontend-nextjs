"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import "./customToolbox";
import { validateBlocklyWorkspace } from "./validateBlocklyWorkspace";
import JobFeeModal from "../create-job/JobFeeModal";
import { useAccount } from "wagmi";
import { syncBlocklyToJobForm } from "./utils/syncBlocklyToJobForm";
import { setCreateSafeHandler } from "./blocks/utility/safe-wallet/create_safe_wallet";
import { setImportSafeHandler } from "./blocks/utility/safe-wallet/import_safe_wallet";
import {
  setSafeWallets,
  setLoadingWallets,
  setOnBlockAddedCallback,
} from "./blocks/utility/safe-wallet/select_safe_wallet";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import SafeCreationProgressModal from "../safe-wallet/SafeWalletCreationDialog";
import SafeWalletImportDialog from "../safe-wallet/import-wallet-modal/SafeWalletImportDialog";
import type { SafeCreationStepStatus } from "@/types/safe";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { addExtraSafe } from "@/utils/safeWalletLocal";

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

  // Safe wallet creation state
  const [showCreateFlow, setShowCreateFlow] = useState(false);
  const [createStep, setCreateStep] = useState<SafeCreationStepStatus>("idle");
  const [signStep, setSignStep] = useState<SafeCreationStepStatus>("idle");
  const [enableStep, setEnableStep] = useState<SafeCreationStepStatus>("idle");
  const [createError, setCreateError] = useState<string | undefined>(undefined);
  const [signError, setSignError] = useState<string | undefined>(undefined);
  const [enableError, setEnableError] = useState<string | undefined>(undefined);
  const [currentSafeAddress, setCurrentSafeAddress] = useState<string | null>(
    null,
  );

  // Import safe wallet state
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Safe wallet hooks
  const { safeWallets, isLoading, refetch } = useSafeWallets();
  const { createSafeWallet, signEnableModule, submitEnableModule } =
    useCreateSafeWallet();

  // Update loading state in the select block
  useEffect(() => {
    setLoadingWallets(isLoading);
  }, [isLoading]);

  // Update safe wallets in the select block whenever they change
  useEffect(() => {
    setSafeWallets(safeWallets);
  }, [safeWallets]);

  // Set up callback to refetch wallets when block is added
  useEffect(() => {
    setOnBlockAddedCallback(() => {
      refetch();
    });
  }, [refetch]);

  // Custom hooks
  useBlocklyGenerators();
  const { xml, onXmlChange } = useBlocklyWorkspace();

  // Handle enable step - can be called independently for retry
  const handleEnableStep = useCallback(async () => {
    setEnableStep("pending");
    setEnableError(undefined);

    const submitResult = await submitEnableModule();

    if (!submitResult.success) {
      setEnableStep("error");
      setEnableError(submitResult.error || "Failed to submit transaction");
    } else {
      setEnableStep("success");
      setTimeout(async () => {
        await refetch();
      }, 2000);

      setTimeout(() => {
        setShowCreateFlow(false);
      }, 500);
    }
  }, [submitEnableModule, refetch]);

  // Handle sign step - can be called independently for retry
  const handleSignStep = useCallback(
    async (safeAddress: string) => {
      setSignStep("pending");
      setSignError(undefined);

      const signResult = await signEnableModule(safeAddress);

      if (!signResult.success) {
        setSignStep("error");
        setSignError(signResult.error || "Failed to sign transaction");
        setTimeout(async () => {
          await refetch();
        }, 3000);
        return;
      }

      setSignStep("success");
      await handleEnableStep();
    },
    [signEnableModule, refetch, handleEnableStep],
  );

  // Create new Safe wallet with three-step flow
  const handleCreateNewSafe = useCallback(async () => {
    if (!address) return;

    setShowCreateFlow(true);
    setCreateStep("pending");
    setSignStep("idle");
    setEnableStep("idle");
    setCreateError(undefined);
    setSignError(undefined);
    setEnableError(undefined);
    setCurrentSafeAddress(null);

    const createResult = await createSafeWallet(address);

    if (!createResult.success || !createResult.safeAddress) {
      setCreateStep("error");
      setCreateError(createResult.error || "Failed to create Safe wallet");
      return;
    }

    const newSafe = createResult.safeAddress;
    setCurrentSafeAddress(newSafe);
    setCreateStep("success");

    await handleSignStep(newSafe);
  }, [address, createSafeWallet, handleSignStep]);

  // Retry handlers
  const handleRetryCreate = useCallback(async () => {
    if (!address) return;
    setCreateStep("pending");
    setCreateError(undefined);

    const createResult = await createSafeWallet(address);
    if (!createResult.success || !createResult.safeAddress) {
      setCreateStep("error");
      setCreateError(createResult.error || "Failed to create Safe wallet");
      return;
    }

    const newSafe = createResult.safeAddress;
    setCurrentSafeAddress(newSafe);
    setCreateStep("success");
    await handleSignStep(newSafe);
  }, [address, createSafeWallet, handleSignStep]);

  const handleRetrySign = useCallback(async () => {
    if (!currentSafeAddress) return;
    await handleSignStep(currentSafeAddress);
  }, [currentSafeAddress, handleSignStep]);

  const handleRetryEnable = useCallback(async () => {
    if (!currentSafeAddress) return;
    await handleEnableStep();
  }, [currentSafeAddress, handleEnableStep]);

  // Handle import safe wallet
  const handleImportSafe = useCallback(() => {
    console.log("Import Safe button clicked in BlocklyDemo");
    setShowImportDialog(true);
  }, []);

  // Handle imported safe wallet
  const handleImportedSafe = useCallback(
    async (
      safeAddress: string,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _moduleActive: boolean,
    ) => {
      // Add to local storage
      if (chain?.id) {
        addExtraSafe(chain.id, safeAddress);
      }

      // Refetch the safe wallets list
      await refetch();
    },
    [chain?.id, refetch],
  );

  // Set up the handlers for the Blockly block buttons
  useEffect(() => {
    console.log("Setting up create safe handler in BlocklyDemo");
    setCreateSafeHandler(handleCreateNewSafe);
    return () => {
      console.log("Cleaning up create safe handler");
    };
  }, [handleCreateNewSafe]);

  useEffect(() => {
    console.log("Setting up import safe handler in BlocklyDemo");
    setImportSafeHandler(handleImportSafe);
    return () => {
      console.log("Cleaning up import safe handler");
    };
  }, [handleImportSafe]);

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

        {/* Safe Wallet Creation Progress Dialog */}
        <SafeCreationProgressModal
          open={showCreateFlow}
          onClose={() => setShowCreateFlow(false)}
          createStep={createStep}
          signStep={signStep}
          enableStep={enableStep}
          createError={createError}
          signError={signError}
          enableError={enableError}
          onRetryCreate={handleRetryCreate}
          onRetrySign={handleRetrySign}
          onRetryEnable={handleRetryEnable}
        />

        {/* Import Safe Wallet Dialog */}
        <SafeWalletImportDialog
          open={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImported={handleImportedSafe}
          onHasOngoingProcessChange={() => {}}
        />
      </div>
    </>
  );
}
