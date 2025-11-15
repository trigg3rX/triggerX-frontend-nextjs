import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { useSafeModuleStatus } from "@/hooks/useSafeModuleStatus";
import { validateSafeWallet } from "@/utils/validateSafeWallet";
import { addExtraSafe } from "@/utils/safeWalletLocal";
import type {
  SafeCreationStepStatus,
  StepId,
  MultisigInfo,
} from "@/types/safe";

export type SafeModuleFlowMode = "create" | "import" | "enable" | "disable";

export interface SafeModuleFlowConfig {
  mode: SafeModuleFlowMode;
  safeAddress?: string; // Required for import/enable/disable
  onSuccess?: (safeAddress: string, moduleEnabled: boolean) => void;
  onHasOngoingProcessChange?: (hasOngoing: boolean) => void;
}

export interface SafeModuleFlowReturn {
  // Current state
  currentStep: StepId | null;
  completedSteps: Set<StepId>;
  hasOngoingProcess: boolean;

  // Step statuses (for creation flow)
  createStep: SafeCreationStepStatus;
  signStep: SafeCreationStepStatus;
  executeStep: SafeCreationStepStatus;

  // Errors
  createError: string;
  signError: string;
  executeError: string;
  validationError: string;

  // Loading flags
  isValidating: boolean;
  isCreating: boolean;
  isSigning: boolean;
  isExecuting: boolean;
  isProposing: boolean;

  // Multisig
  multisigInfo: MultisigInfo | null;
  moduleStatus: boolean | null;
  isCheckingModuleStatus: boolean;

  // Actions
  start: (params?: {
    address?: string;
    validationAddress?: string;
  }) => Promise<void>;
  retryCreate: () => Promise<void>;
  retrySign: () => Promise<void>;
  retryExecute: () => Promise<void>;
  refreshModuleStatus: () => Promise<void>;
  reset: () => void;

  // Created safe address (for create flow)
  createdSafeAddress: string | null;
}

/**
 * Unified hook for managing Safe wallet flows: create, import, enable, disable
 * Centralizes step tracking, error handling, and multisig state management
 */
export function useSafeModuleFlow(
  config: SafeModuleFlowConfig,
): SafeModuleFlowReturn {
  const {
    mode,
    safeAddress: configSafeAddress,
    onSuccess,
    onHasOngoingProcessChange,
  } = config;
  const { address } = useAccount();
  const chainId = useChainId();

  const {
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    signDisableModule,
    submitDisableModule,
    isCreating,
    isSigningEnableModule,
    isExecutingEnableModule,
    isProposingEnableModule,
    isSigningDisableModule,
    isExecutingDisableModule,
    isProposingDisableModule,
  } = useCreateSafeWallet();

  // State
  const [currentStep, setCurrentStep] = useState<StepId | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
  const [hasOngoingProcess, setHasOngoingProcess] = useState(false);

  // Step statuses (for creation flow compatibility)
  const [createStep, setCreateStep] = useState<SafeCreationStepStatus>("idle");
  const [signStep, setSignStep] = useState<SafeCreationStepStatus>("idle");
  const [executeStep, setExecuteStep] =
    useState<SafeCreationStepStatus>("idle");

  // Errors
  const [createError, setCreateError] = useState("");
  const [signError, setSignError] = useState("");
  const [executeError, setExecuteError] = useState("");
  const [validationError, setValidationError] = useState("");

  // For validation step (import flow)
  const [isValidating, setIsValidating] = useState(false);

  // Multisig
  const [multisigInfo, setMultisigInfo] = useState<MultisigInfo | null>(null);

  // Created safe address (for create flow)
  const [createdSafeAddress, setCreatedSafeAddress] = useState<string | null>(
    null,
  );

  // Ref to track if completion has been processed
  const completionProcessedRef = useRef(false);

  // Ref to track when we should start checking module status (after transaction delay)
  const canCheckModuleStatusRef = useRef(true);
  const checkStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which safe address to monitor for module status
  // For import mode, use multisigInfo.safeAddress if available (after validation)
  // For create mode, use createdSafeAddress
  // For enable/disable modes, use configSafeAddress
  const monitoredSafeAddress =
    mode === "create"
      ? createdSafeAddress
      : mode === "import"
        ? multisigInfo?.safeAddress || configSafeAddress
        : configSafeAddress;

  // Module status hook
  const [moduleStatus, refreshModuleStatusHook, isCheckingModuleStatus] =
    useSafeModuleStatus(monitoredSafeAddress ?? undefined);

  // Notify parent about ongoing process changes
  useEffect(() => {
    if (onHasOngoingProcessChange) {
      onHasOngoingProcessChange(hasOngoingProcess);
    }
  }, [hasOngoingProcess, onHasOngoingProcessChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
        checkStatusTimeoutRef.current = null;
      }
    };
  }, []);

  // Helper: Check if error is a user rejection
  const isUserRejection = useCallback((errorMessage: string): boolean => {
    const msg = errorMessage.toLowerCase();
    return msg.includes("rejected") || msg.includes("denied");
  }, []);

  // Helper: Reset all state
  const reset = useCallback(() => {
    setCurrentStep(null);
    setCompletedSteps(new Set());
    setHasOngoingProcess(false);
    setCreateStep("idle");
    setSignStep("idle");
    setExecuteStep("idle");
    setCreateError("");
    setSignError("");
    setExecuteError("");
    setValidationError("");
    setIsValidating(false);
    setMultisigInfo(null);
    setCreatedSafeAddress(null);
    completionProcessedRef.current = false;
    canCheckModuleStatusRef.current = true;

    // Clear any pending timeout
    if (checkStatusTimeoutRef.current) {
      clearTimeout(checkStatusTimeoutRef.current);
      checkStatusTimeoutRef.current = null;
    }
  }, []);

  // Helper: Refresh module status (force refresh from blockchain)
  const refreshModuleStatus = useCallback(async () => {
    // For import mode, prioritize multisigInfo.safeAddress if available
    const addressToRefresh =
      mode === "import" && multisigInfo?.safeAddress
        ? multisigInfo.safeAddress
        : monitoredSafeAddress;

    if (addressToRefresh) {
      // Refresh from blockchain (always fresh, no cache)
      await refreshModuleStatusHook();
    }
  }, [
    mode,
    multisigInfo?.safeAddress,
    monitoredSafeAddress,
    refreshModuleStatusHook,
  ]);

  // Watch for module status completion (for multisig scenarios)
  useEffect(() => {
    const isEnableFlow =
      mode === "create" || mode === "import" || mode === "enable";
    const isDisableFlow = mode === "disable";
    const targetStatus = isDisableFlow ? false : true;

    // Only check module status if we're allowed to (after delay has passed)
    if (
      !canCheckModuleStatusRef.current ||
      moduleStatus !== targetStatus ||
      !monitoredSafeAddress ||
      !hasOngoingProcess ||
      completionProcessedRef.current
    ) {
      return;
    }

    completionProcessedRef.current = true;

    // For import/enable/disable: persist to localStorage
    if (mode === "import" || mode === "enable") {
      addExtraSafe(chainId, monitoredSafeAddress);
    }

    // Mark as complete
    setCompletedSteps(new Set(["validate", "sign", "execute"]));
    setCurrentStep(null);
    setHasOngoingProcess(false);

    // Notify success
    if (onSuccess) {
      onSuccess(monitoredSafeAddress, isEnableFlow);
    }
  }, [
    moduleStatus,
    monitoredSafeAddress,
    hasOngoingProcess,
    mode,
    chainId,
    onSuccess,
  ]);

  // CREATE FLOW: Deploy Safe + Enable Module
  const startCreateFlow = useCallback(async () => {
    if (!address) {
      setCreateError("Please connect your wallet");
      return;
    }

    setHasOngoingProcess(true);
    setCreateStep("pending");
    setCreateError("");

    try {
      // Step 1: Deploy Safe contract
      const createResult = await createSafeWallet(address);

      if (!createResult.success || !createResult.safeAddress) {
        setCreateStep("error");
        setCreateError(createResult.error || "Failed to deploy Safe");

        if (isUserRejection(createResult.error || "")) {
          reset();
        }
        return;
      }

      const safeAddr = createResult.safeAddress;
      setCreatedSafeAddress(safeAddr);
      setCreateStep("success");

      // Step 2: Sign enable module
      setSignStep("pending");
      setSignError("");

      const signResult = await signEnableModule(safeAddr);

      if (!signResult.success) {
        setSignStep("error");
        setSignError(signResult.error || "Failed to sign");

        if (isUserRejection(signResult.error || "")) {
          reset();
        }
        return;
      }

      setSignStep("success");

      // Step 3: Submit enable module
      setExecuteStep("pending");
      setExecuteError("");

      const submitResult = await submitEnableModule();

      if (!submitResult.success) {
        setExecuteStep("error");
        setExecuteError(submitResult.error || "Failed to submit");

        if (isUserRejection(submitResult.error || "")) {
          reset();
        }
        return;
      }

      setExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        // Single-sig: complete immediately
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(safeAddr, true);
        }
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: wait for approvals
        // Delay checking module status to allow blockchain propagation
        canCheckModuleStatusRef.current = false;
        if (checkStatusTimeoutRef.current) {
          clearTimeout(checkStatusTimeoutRef.current);
        }
        checkStatusTimeoutRef.current = setTimeout(() => {
          canCheckModuleStatusRef.current = true;
          checkStatusTimeoutRef.current = null;
        }, 2000); // Wait 2 seconds before checking

        setMultisigInfo({
          safeAddress: safeAddr,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners,
        });
        setHasOngoingProcess(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setExecuteStep("error");
      setExecuteError(msg);
    }
  }, [
    address,
    createSafeWallet,
    signEnableModule,
    submitEnableModule,
    onSuccess,
    isUserRejection,
    reset,
  ]);

  // IMPORT FLOW: Validate + Enable Module
  const startImportFlow = useCallback(
    async (validationAddress: string) => {
      if (!validationAddress.trim()) {
        setValidationError("Please enter a Safe address");
        return;
      }

      setHasOngoingProcess(true);
      setIsValidating(true);
      setValidationError("");
      setCurrentStep("validate");

      try {
        // Step 1: Validate Safe wallet
        if (typeof window.ethereum === "undefined") {
          throw new Error("Please connect your wallet");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);

        const validationResult = await validateSafeWallet(
          validationAddress,
          provider,
          address,
        );

        if (!validationResult.success) {
          throw new Error(validationResult.error || "Validation failed");
        }

        const { safeAddress: safeAddr } = validationResult;

        // Validation complete
        setCompletedSteps(new Set(["validate"]));
        setIsValidating(false);
        setCurrentStep("sign");

        // Step 2: Sign enable module
        const signResult = await signEnableModule(safeAddr);

        if (!signResult.success) {
          const errorMsg = signResult.error || "Failed to sign transaction";

          if (isUserRejection(errorMsg)) {
            reset();
            throw new Error(errorMsg);
          }

          throw new Error(errorMsg);
        }

        // Check if module was already enabled
        if (signResult.data && !signResult.data.safeTxHash) {
          addExtraSafe(chainId, safeAddr);
          setCompletedSteps(new Set(["validate", "sign", "execute"]));
          setCurrentStep(null);
          setHasOngoingProcess(false);

          if (onSuccess) {
            onSuccess(safeAddr, true);
          }
          return;
        }

        // Sign complete
        setCompletedSteps(new Set(["validate", "sign"]));
        setCurrentStep("execute");

        // Step 3: Submit
        const submitResult = await submitEnableModule();

        if (!submitResult.success) {
          const errorMsg = submitResult.error || "Failed to submit transaction";

          if (isUserRejection(errorMsg)) {
            reset();
            throw new Error(errorMsg);
          }

          throw new Error(errorMsg);
        }

        // Persist to localStorage
        addExtraSafe(chainId, safeAddr);

        if (submitResult.data?.status === "executed") {
          // Single-sig: complete immediately
          setCompletedSteps(new Set(["validate", "sign", "execute"]));
          setCurrentStep(null);
          setHasOngoingProcess(false);

          if (onSuccess) {
            onSuccess(safeAddr, true);
          }
        } else if (submitResult.data?.status === "multisig") {
          // Multisig: wait for approvals
          // Delay checking module status to allow blockchain propagation
          canCheckModuleStatusRef.current = false;
          if (checkStatusTimeoutRef.current) {
            clearTimeout(checkStatusTimeoutRef.current);
          }
          checkStatusTimeoutRef.current = setTimeout(() => {
            canCheckModuleStatusRef.current = true;
            checkStatusTimeoutRef.current = null;
          }, 2000); // Wait 2 seconds before checking

          setMultisigInfo({
            safeAddress: safeAddr,
            threshold: submitResult.data.threshold,
            safeTxHash: submitResult.data.safeTxHash || "",
            queueUrl: submitResult.data.queueUrl || null,
            fallbackUrl: submitResult.data.fallbackUrl || null,
            owners: submitResult.data.owners,
          });
          setCompletedSteps(new Set(["validate", "sign"]));
          setCurrentStep("execute");
          setHasOngoingProcess(true);
        }
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to import Safe";

        setValidationError(msg);
        setCurrentStep(null);
        setCompletedSteps(new Set());
        setHasOngoingProcess(false);
        setMultisigInfo(null);
      } finally {
        setIsValidating(false);
      }
    },
    [
      address,
      chainId,
      signEnableModule,
      submitEnableModule,
      onSuccess,
      isUserRejection,
      reset,
    ],
  );

  // ENABLE FLOW: Sign + Enable Module
  const startEnableFlow = useCallback(async () => {
    if (!configSafeAddress) {
      setSignError("No Safe address provided");
      return;
    }

    setHasOngoingProcess(true);
    setSignStep("pending");
    setSignError("");

    try {
      // Step 1: Sign enable module
      const signResult = await signEnableModule(configSafeAddress);

      if (!signResult.success) {
        setSignStep("error");
        setSignError(signResult.error || "Failed to sign");

        if (isUserRejection(signResult.error || "")) {
          reset();
        }
        return;
      }

      // Check if already enabled
      if (signResult.data && !signResult.data.safeTxHash) {
        setSignStep("success");
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(configSafeAddress, true);
        }
        return;
      }

      setSignStep("success");

      // Step 2: Submit
      setExecuteStep("pending");
      setExecuteError("");

      const submitResult = await submitEnableModule();

      if (!submitResult.success) {
        setExecuteStep("error");
        setExecuteError(submitResult.error || "Failed to submit");

        if (isUserRejection(submitResult.error || "")) {
          reset();
        }
        return;
      }

      setExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        // Single-sig: complete immediately
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(configSafeAddress, true);
        }
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: wait for approvals
        // Delay checking module status to allow blockchain propagation
        canCheckModuleStatusRef.current = false;
        if (checkStatusTimeoutRef.current) {
          clearTimeout(checkStatusTimeoutRef.current);
        }
        checkStatusTimeoutRef.current = setTimeout(() => {
          canCheckModuleStatusRef.current = true;
          checkStatusTimeoutRef.current = null;
        }, 2000); // Wait 2 seconds before checking

        setMultisigInfo({
          safeAddress: configSafeAddress,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners,
        });
        setHasOngoingProcess(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setExecuteStep("error");
      setExecuteError(msg);
    }
  }, [
    configSafeAddress,
    signEnableModule,
    submitEnableModule,
    onSuccess,
    isUserRejection,
    reset,
  ]);

  // DISABLE FLOW: Sign + Disable Module
  const startDisableFlow = useCallback(async () => {
    if (!configSafeAddress) {
      setSignError("No Safe address provided");
      return;
    }

    setHasOngoingProcess(true);
    setSignStep("pending");
    setSignError("");

    try {
      // Step 1: Sign disable module
      const signResult = await signDisableModule(configSafeAddress);

      if (!signResult.success) {
        setSignStep("error");
        setSignError(signResult.error || "Failed to sign");

        if (isUserRejection(signResult.error || "")) {
          reset();
        }
        return;
      }

      // Check if already disabled
      if (signResult.data && !signResult.data.safeTxHash) {
        setSignStep("success");
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(configSafeAddress, false);
        }
        return;
      }

      setSignStep("success");

      // Step 2: Submit
      setExecuteStep("pending");
      setExecuteError("");

      const submitResult = await submitDisableModule();

      if (!submitResult.success) {
        setExecuteStep("error");
        setExecuteError(submitResult.error || "Failed to submit");

        if (isUserRejection(submitResult.error || "")) {
          reset();
        }
        return;
      }

      setExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        // Single-sig: complete immediately
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(configSafeAddress, false);
        }
      } else if (submitResult.data?.status === "multisig") {
        // Multisig: wait for approvals
        // Delay checking module status to allow blockchain propagation
        canCheckModuleStatusRef.current = false;
        if (checkStatusTimeoutRef.current) {
          clearTimeout(checkStatusTimeoutRef.current);
        }
        checkStatusTimeoutRef.current = setTimeout(() => {
          canCheckModuleStatusRef.current = true;
          checkStatusTimeoutRef.current = null;
        }, 2000); // Wait 2 seconds before checking

        setMultisigInfo({
          safeAddress: configSafeAddress,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners,
        });
        setHasOngoingProcess(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setExecuteStep("error");
      setExecuteError(msg);
    }
  }, [
    configSafeAddress,
    signDisableModule,
    submitDisableModule,
    onSuccess,
    isUserRejection,
    reset,
  ]);

  // Main start function - routes to appropriate flow
  const start = useCallback(
    async (params?: { address?: string; validationAddress?: string }) => {
      if (mode === "create") {
        await startCreateFlow();
      } else if (mode === "import") {
        const addr = params?.validationAddress || params?.address || "";
        await startImportFlow(addr);
      } else if (mode === "enable") {
        await startEnableFlow();
      } else if (mode === "disable") {
        await startDisableFlow();
      }
    },
    [mode, startCreateFlow, startImportFlow, startEnableFlow, startDisableFlow],
  );

  // Retry handlers
  const retryCreate = useCallback(async () => {
    setCreateStep("idle");
    setCreateError("");
    await startCreateFlow();
  }, [startCreateFlow]);

  const retrySign = useCallback(async () => {
    setSignStep("idle");
    setSignError("");

    if (mode === "create" && createdSafeAddress) {
      // Continue from sign step in create flow
      setSignStep("pending");
      const signResult = await signEnableModule(createdSafeAddress);

      if (!signResult.success) {
        setSignStep("error");
        setSignError(signResult.error || "Failed to sign");
        return;
      }

      setSignStep("success");
      setExecuteStep("pending");

      const submitResult = await submitEnableModule();

      if (!submitResult.success) {
        setExecuteStep("error");
        setExecuteError(submitResult.error || "Failed to submit");
        return;
      }

      setExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        setHasOngoingProcess(false);

        if (onSuccess) {
          onSuccess(createdSafeAddress, true);
        }
      } else if (submitResult.data?.status === "multisig") {
        // Delay checking module status to allow blockchain propagation
        canCheckModuleStatusRef.current = false;
        if (checkStatusTimeoutRef.current) {
          clearTimeout(checkStatusTimeoutRef.current);
        }
        checkStatusTimeoutRef.current = setTimeout(() => {
          canCheckModuleStatusRef.current = true;
          checkStatusTimeoutRef.current = null;
        }, 2000); // Wait 2 seconds before checking

        setMultisigInfo({
          safeAddress: createdSafeAddress,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners,
        });
      }
    } else if (mode === "enable" || mode === "disable") {
      // Restart enable/disable flow
      if (mode === "enable") {
        await startEnableFlow();
      } else {
        await startDisableFlow();
      }
    }
  }, [
    mode,
    createdSafeAddress,
    signEnableModule,
    submitEnableModule,
    onSuccess,
    startEnableFlow,
    startDisableFlow,
  ]);

  const retryExecute = useCallback(async () => {
    setExecuteStep("idle");
    setExecuteError("");

    setExecuteStep("pending");

    const submitResult =
      mode === "disable"
        ? await submitDisableModule()
        : await submitEnableModule();

    if (!submitResult.success) {
      setExecuteStep("error");
      setExecuteError(submitResult.error || "Failed to submit");
      return;
    }

    setExecuteStep("success");

    const targetAddress =
      mode === "create" ? createdSafeAddress : configSafeAddress;

    if (submitResult.data?.status === "executed" && targetAddress) {
      setHasOngoingProcess(false);

      if (onSuccess) {
        onSuccess(targetAddress, mode !== "disable");
      }
    } else if (submitResult.data?.status === "multisig" && targetAddress) {
      // Delay checking module status to allow blockchain propagation
      canCheckModuleStatusRef.current = false;
      if (checkStatusTimeoutRef.current) {
        clearTimeout(checkStatusTimeoutRef.current);
      }
      checkStatusTimeoutRef.current = setTimeout(() => {
        canCheckModuleStatusRef.current = true;
        checkStatusTimeoutRef.current = null;
      }, 2000); // Wait 2 seconds before checking

      setMultisigInfo({
        safeAddress: targetAddress,
        threshold: submitResult.data.threshold,
        safeTxHash: submitResult.data.safeTxHash || "",
        queueUrl: submitResult.data.queueUrl || null,
        fallbackUrl: submitResult.data.fallbackUrl || null,
        owners: submitResult.data.owners,
      });
    }
  }, [
    mode,
    createdSafeAddress,
    configSafeAddress,
    submitEnableModule,
    submitDisableModule,
    onSuccess,
  ]);

  // Compute loading flags
  const isSigning =
    mode === "disable" ? isSigningDisableModule : isSigningEnableModule;
  const isExecuting =
    mode === "disable" ? isExecutingDisableModule : isExecutingEnableModule;
  const isProposing =
    mode === "disable" ? isProposingDisableModule : isProposingEnableModule;

  return {
    currentStep,
    completedSteps,
    hasOngoingProcess,
    createStep,
    signStep,
    executeStep,
    createError,
    signError,
    executeError,
    validationError,
    isValidating,
    isCreating,
    isSigning,
    isExecuting,
    isProposing,
    multisigInfo,
    moduleStatus,
    isCheckingModuleStatus,
    start,
    retryCreate,
    retrySign,
    retryExecute,
    refreshModuleStatus,
    reset,
    createdSafeAddress,
  };
}
