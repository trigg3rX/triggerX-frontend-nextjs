"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import * as Blockly from "blockly/core";
import { useJobFormContext } from "@/hooks/useJobFormContext";
import "./customToolbox";
import { validateBlocklyWorkspace } from "./validateBlocklyWorkspace";
import JobFeeModal from "../create-job/JobFeeModal";
import { IpfsScriptWizard } from "../create-job/form/IpfsScriptWizard";
import { useAccount } from "wagmi";
import {
  setCreateSafeHandler,
  updateCreatedWalletAddress,
} from "./blocks/utility/safe-wallet/create_safe_wallet";
import {
  setImportSafeHandler,
  updateImportedWalletAddress,
} from "./blocks/utility/safe-wallet/import_safe_wallet";
import {
  setSafeWallets,
  setLoadingWallets,
  setOnBlockAddedCallback,
  setWalletConnected,
} from "./blocks/utility/safe-wallet/select_safe_wallet";
import {
  setOpenDynamicArgsWizardHandler,
  updateDynamicArgsIpfsUrl,
} from "./blocks/utility/contract/dynamic_arguments";
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
import {
  BlocklyWorkspaceSection,
  WorkspaceStepSnapshot,
} from "./components/BlocklyWorkspaceSection";
import { StepFlowPanel } from "./components/StepFlowPanel";
import { MobileWarning } from "./MobileWarning";
import { VisualBuilderTour } from "./components/VisualBuilderTour";
import { StepFlowProvider, useStepFlow } from "./contexts/StepFlowContext";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.svg";
import BalanceDisplay from "../ui/BalanceDisplay";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface BlocklyDemoContentProps {
  jobTitleInputRef: React.RefObject<HTMLInputElement | null>;
}

function BlocklyDemoContent({ jobTitleInputRef }: BlocklyDemoContentProps) {
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

  // Contract validation state (before opening fee modal)
  const [isValidatingContractData, setIsValidatingContractData] =
    useState<boolean>(false);

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

  // IPFS Script Wizard (for dynamic_arguments block)
  const [isIpfsWizardOpen, setIsIpfsWizardOpen] = useState(false);
  const [wizardTargetFunction, setWizardTargetFunction] = useState("");

  // Update loading state in the select block
  useEffect(() => {
    setLoadingWallets(isLoading);
  }, [isLoading]);

  // Update wallet connection state for the select block
  useEffect(() => {
    setWalletConnected(!!address);
  }, [address]);

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
  const { updateJobTitle, updateWorkspaceSteps } = useStepFlow();

  const handleWorkspaceStepChange = useCallback(
    (snapshot: WorkspaceStepSnapshot) => {
      updateWorkspaceSteps(snapshot);
    },
    [updateWorkspaceSteps],
  );

  // Update job title in context when it changes
  useEffect(() => {
    updateJobTitle(jobTitle);
  }, [jobTitle, updateJobTitle]);

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

    // Update the block with the created wallet address
    updateCreatedWalletAddress(newSafe);

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

    // Update the block with the created wallet address
    updateCreatedWalletAddress(newSafe);

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

      // Update the import_safe_wallet block with the imported address
      updateImportedWalletAddress(safeAddress);

      // Refetch the safe wallets list
      await refetch();
    },
    [chain?.id, refetch],
  );

  // Set up the handlers for the Blockly block buttons
  useEffect(() => {
    setCreateSafeHandler(handleCreateNewSafe);
  }, [handleCreateNewSafe]);

  useEffect(() => {
    setImportSafeHandler(handleImportSafe);
  }, [handleImportSafe]);

  // Set up handler for opening the IPFS Script Wizard from the dynamic_arguments block
  useEffect(() => {
    setOpenDynamicArgsWizardHandler(() => {
      try {
        const workspace = Blockly.getMainWorkspace();
        const allBlocks = workspace?.getAllBlocks(false) || [];
        const execBlock = allBlocks.find(
          (b) =>
            b.type === "execute_function" ||
            b.type === "execute_through_safe_wallet",
        );
        const func = execBlock?.getFieldValue("FUNCTION_NAME") || "";
        setWizardTargetFunction(func);
      } catch (err) {
        console.error("Failed to read target function from Blockly", err);
        setWizardTargetFunction("");
      }

      setIsIpfsWizardOpen(true);
    });
  }, []);

  const handleCreateJob = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Reset all errors
      setJobTitleError(null);
      setPermissionError(null);
      setWorkspaceError(null);

      // Start validation state
      setIsValidatingContractData(true);

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
        setIsValidatingContractData(false);
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
        setIsValidatingContractData(false);
        return;
      }

      // All validation passed - data is already synced automatically on block changes
      // Blur any active input fields before opening the modal
      // Use setTimeout to ensure blur happens before modal renders
      setTimeout(() => {
        if (document.activeElement instanceof HTMLElement) {
          const activeElement = document.activeElement;
          if (
            activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.isContentEditable
          ) {
            activeElement.blur();
          }
        }
        // Also blur all focused inputs
        const allInputs = document.querySelectorAll(
          "input:focus, textarea:focus",
        );
        allInputs.forEach((input) => {
          if (input instanceof HTMLElement) {
            input.blur();
          }
        });
      }, 0);

      // Open fee modal - JobFeeModal will handle fee estimation and job creation
      setEstimatedFee(0);
      setIsModalOpen(true);
      setIsValidatingContractData(false);
    },
    [
      setJobTitleError,
      hasConfirmedPermission,
      xml,
      jobTitle,
      address,
      setEstimatedFee,
      setIsModalOpen,
      setPermissionError,
      setWorkspaceError,
    ],
  );

  // Clear workspace errors automatically when wallet connects
  useEffect(() => {
    if (address) {
      setWorkspaceError(null);
    }
  }, [address, setWorkspaceError]);

  return (
    <>
      <div className="my-6 md:my-8 header flex items-center justify-between">
        <Link href="/">
          <Image
            src={logo}
            alt="TriggerX"
            width={180}
            height={40}
            className="w-[130px] xl:w-[160px] h-auto mb-4 cursor-pointer"
          />
        </Link>
        <div className="flex items-center lg:gap-[5px]">
          <ConnectButton
            chainStatus="icon"
            accountStatus="address"
            showBalance={false}
          />
          <BalanceDisplay />
        </div>
      </div>

      {/* Mobile/Tablet Warning - Show below 768px */}
      <MobileWarning />

      {/* On-page guided tour */}
      <VisualBuilderTour />

      {/* Desktop View - Show 768px and above */}
      <div className="hidden md:flex flex-col gap-2">
        <PermissionCard
          hasConfirmedPermission={hasConfirmedPermission}
          setHasConfirmedPermission={setHasConfirmedPermission}
          permissionError={permissionError}
          setPermissionError={setPermissionError}
          permissionCheckboxRef={permissionCheckboxRef}
          selectedNetwork={selectedNetwork}
        />

        <ErrorCard
          error={workspaceError}
          onClose={() => setWorkspaceError(null)}
        />

        <BlocklyHeader
          jobTitle={jobTitle}
          setJobTitle={setJobTitle}
          jobTitleError={jobTitleError}
          setJobTitleError={setJobTitleError}
          jobTitleErrorRef={jobTitleErrorRef}
          isModalOpen={isModalOpen}
          isValidating={isValidatingContractData}
          onCreateJob={handleCreateJob}
          jobTitleInputRef={jobTitleInputRef}
        />

        <div
          className="w-full flex flex-col-reverse xl:flex-row gap-2"
          data-tour-id="workspace-area"
        >
          <div className="w-full xl:w-[calc(100%-240px)] h-[80vh]">
            <BlocklyWorkspaceSection
              xml={xml}
              onXmlChange={onXmlChange}
              workspaceScopeRef={workspaceScopeRef}
              connectedAddress={address}
              connectedChainId={chain?.id}
              jobFormContext={jobFormContext}
              onWorkspaceStepChange={handleWorkspaceStepChange}
            />
          </div>
          <div className="w-full xl:w-[240px]">
            <StepFlowPanel />
          </div>
        </div>

        {/* Job Fee Modal */}
        <JobFeeModal
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          estimatedFee={estimatedFee}
        />

        {/* IPFS Script Wizard for dynamic arguments block */}
        <IpfsScriptWizard
          isOpen={isIpfsWizardOpen}
          onClose={() => setIsIpfsWizardOpen(false)}
          onComplete={(url) => {
            updateDynamicArgsIpfsUrl(url);
            setIsIpfsWizardOpen(false);
          }}
          targetFunction={
            wizardTargetFunction ||
            jobFormContext.contractInteractions.contract?.targetFunction ||
            ""
          }
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

export default function BlocklyDemo() {
  const jobTitleInputRef = useRef<HTMLInputElement | null>(null);

  const focusToolboxCategory = useCallback((dataId?: string | null) => {
    if (!dataId || typeof document === "undefined") return;

    // Find the toolbox category element
    const el = document.querySelector(
      `[data-tour-id="${dataId}"]`,
    ) as HTMLElement | null;
    if (!el) return;

    // 1. Scroll the category into view within the toolbox
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // 2. Use a timeout to ensure the scroll has settled before triggering Blockly logic
    setTimeout(() => {
      const eventConfig = { bubbles: true, cancelable: true, view: window };

      // Dispatch events to simulate a real user click
      el.dispatchEvent(new MouseEvent("mousedown", eventConfig));
      el.dispatchEvent(new MouseEvent("mouseup", eventConfig));
      el.dispatchEvent(new MouseEvent("click", eventConfig));

      // 3. IMPORTANT: Prevent the browser from jumping to the hidden Blockly input
      const hiddenInput = document.querySelector(
        ".blocklyHtmlInput",
      ) as HTMLElement;
      if (hiddenInput) {
        // Focus the input but EXPLICITLY tell the browser not to scroll to it
        hiddenInput.focus({ preventScroll: true });
      }
    }, 100);
  }, []);

  const scrollToSelector = useCallback((selector: string) => {
    if (typeof document === "undefined") return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus?.({ preventScroll: true });
    } catch {
      // ignore focus errors
    }
  }, []);

  return (
    <StepFlowProvider
      jobTitleInputRef={jobTitleInputRef}
      onFocusToolboxCategory={focusToolboxCategory}
      onScrollToSelector={scrollToSelector}
    >
      <BlocklyDemoContent jobTitleInputRef={jobTitleInputRef} />
    </StepFlowProvider>
  );
}
