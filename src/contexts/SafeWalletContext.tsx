"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useAccount, useChainId } from "wagmi";
import { useSafeWallets } from "@/hooks/useSafeWallets";
import { useCreateSafeWallet } from "@/hooks/useCreateSafeWallet";
import { useSafeModuleStatus } from "@/hooks/useSafeModuleStatus";
import type { SafeCreationStepStatus, MultisigInfo } from "@/types/safe";

// ===========================
// Type Definitions
// ===========================

export interface SafeWalletSelection {
  selectedSafe: string | null;
  safeWallets: string[];
  isLoading: boolean;
  error: string | null;
  selectSafe: (safe: string | null) => void;
  refreshSafeList: () => Promise<void>;
  moduleEnabled: boolean | null;
  checkingModule: boolean;
  refreshModuleStatus: () => Promise<void>;
}

export interface SafeWalletCreation {
  showCreateFlow: boolean;
  createStep: SafeCreationStepStatus;
  signStep: SafeCreationStepStatus;
  enableStep: SafeCreationStepStatus;
  createError?: string;
  signError?: string;
  enableError?: string;
  currentSafeAddress: string | null;
  isCreating: boolean;
  isSigningEnableModule: boolean;
  isExecutingEnableModule: boolean;
  isProposingEnableModule: boolean;
  handleCreateNewSafe: () => Promise<void>;
  handleRetryCreate: () => Promise<void>;
  handleRetrySign: () => Promise<void>;
  handleRetryEnable: () => Promise<void>;
  closeCreateFlow: () => void;
}

export interface SafeWalletImportFlow {
  showImportDialog: boolean;
  hasImportOngoingProcess: boolean;
  openImportDialog: () => void;
  closeImportDialog: () => void;
  handleImportedSafe: (safeAddress: string) => Promise<void>;
  setHasImportOngoingProcess: (hasOngoing: boolean) => void;
}

export interface SafeWalletModuleControl {
  showModuleActionDialog: boolean;
  moduleAction: "enable" | "disable";
  moduleSignStep: SafeCreationStepStatus;
  moduleExecuteStep: SafeCreationStepStatus;
  moduleSignError?: string;
  moduleExecuteError?: string;
  moduleMultisigInfo: MultisigInfo | null;
  hasOngoingModuleProcess: boolean;
  isCheckingModuleStatus: boolean;
  isSigningDisableModule: boolean;
  isExecutingDisableModule: boolean;
  isProposingDisableModule: boolean;
  handleShowEnableDialog: () => void;
  handleShowDisableDialog: () => void;
  handleEnableModule: () => Promise<void>;
  handleDisableModule: () => Promise<void>;
  handleRetryModuleSign: () => Promise<void>;
  handleRetryModuleExecute: () => Promise<void>;
  handleManualModuleRefresh: () => Promise<void>;
  closeModuleActionDialog: () => void;
}

export interface SafeWalletContextType {
  selection: SafeWalletSelection;
  creation: SafeWalletCreation;
  importFlow: SafeWalletImportFlow;
  moduleControl: SafeWalletModuleControl;
}

// ===========================
// Context Creation
// ===========================

const SafeWalletContext = createContext<SafeWalletContextType | undefined>(
  undefined,
);

export const useSafeWalletContext = () => {
  const context = useContext(SafeWalletContext);
  if (!context) {
    throw new Error(
      "useSafeWalletContext must be used within SafeWalletProvider",
    );
  }
  return context;
};

// ===========================
// Provider Implementation
// ===========================

export const SafeWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { address } = useAccount();
  const chainId = useChainId();

  // Core hooks
  const { safeWallets, isLoading, error, refetch } = useSafeWallets();
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

  // ===========================
  // Selection State
  // ===========================
  const [selectedSafe, setSelectedSafe] = useState<string | null>(null);
  const [moduleEnabled, refreshModuleStatus, checkingModule] =
    useSafeModuleStatus(selectedSafe || undefined);

  // ===========================
  // Creation State
  // ===========================
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

  // ===========================
  // Import State
  // ===========================
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [hasImportOngoingProcess, setHasImportOngoingProcess] = useState(false);

  // ===========================
  // Module Control State
  // ===========================
  const [showModuleActionDialog, setShowModuleActionDialog] = useState(false);
  const [moduleAction, setModuleAction] = useState<"enable" | "disable">(
    "enable",
  );
  const [moduleSignStep, setModuleSignStep] =
    useState<SafeCreationStepStatus>("idle");
  const [moduleExecuteStep, setModuleExecuteStep] =
    useState<SafeCreationStepStatus>("idle");
  const [moduleSignError, setModuleSignError] = useState<string | undefined>(
    undefined,
  );
  const [moduleExecuteError, setModuleExecuteError] = useState<
    string | undefined
  >(undefined);
  const [moduleMultisigInfo, setModuleMultisigInfo] =
    useState<MultisigInfo | null>(null);
  const [isCheckingModuleStatus, setIsCheckingModuleStatus] = useState(false);
  const [hasOngoingModuleProcess, setHasOngoingModuleProcess] = useState(false);
  const moduleCompletionProcessedRef = useRef(false);

  // ===========================
  // Side Effects
  // ===========================

  // Clear selection when chain switches
  useEffect(() => {
    setSelectedSafe(null);
  }, [chainId]);

  // Refresh module status after selection
  const selectSafe = useCallback(
    async (safe: string | null) => {
      setSelectedSafe(safe);
      if (safe) {
        setTimeout(async () => {
          await refreshModuleStatus();
        }, 100);
      }
    },
    [refreshModuleStatus],
  );

  // ===========================
  // Creation Handlers
  // ===========================

  const handleEnableStep = useCallback(
    async (safeAddress: string) => {
      setEnableStep("pending");
      setEnableError(undefined);

      const submitResult = await submitEnableModule();

      if (!submitResult.success) {
        setEnableStep("error");
        setEnableError(submitResult.error || "Failed to submit transaction");
      } else {
        setEnableStep("success");

        setTimeout(async () => {
          setSelectedSafe(safeAddress);
          await refetch();

          setTimeout(async () => {
            await refreshModuleStatus();
          }, 200);

          setTimeout(() => {
            setShowCreateFlow(false);
          }, 500);
        }, 2000);
      }
    },
    [submitEnableModule, refetch, refreshModuleStatus],
  );

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
          setSelectedSafe(safeAddress);
        }, 3000);
        return;
      }

      setSignStep("success");
      await handleEnableStep(safeAddress);
    },
    [signEnableModule, refetch, handleEnableStep],
  );

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
    await handleEnableStep(currentSafeAddress);
  }, [currentSafeAddress, handleEnableStep]);

  const closeCreateFlow = useCallback(() => {
    setShowCreateFlow(false);
    if (selectedSafe) {
      setTimeout(async () => {
        await refreshModuleStatus();
      }, 1000);
    }
  }, [selectedSafe, refreshModuleStatus]);

  // ===========================
  // Import Handlers
  // ===========================

  const openImportDialog = useCallback(() => {
    setShowImportDialog(true);
  }, []);

  const closeImportDialog = useCallback(() => {
    setShowImportDialog(false);
    if (selectedSafe) {
      setTimeout(async () => {
        await refreshModuleStatus();
      }, 1000);
    }
  }, [selectedSafe, refreshModuleStatus]);

  const handleImportedSafe = useCallback(
    async (safeAddress: string) => {
      setSelectedSafe(safeAddress);
      await refetch();

      setTimeout(async () => {
        await refreshModuleStatus();
      }, 200);
    },
    [refetch, refreshModuleStatus],
  );

  // ===========================
  // Module Control Handlers
  // ===========================

  const resetModuleActionState = useCallback(() => {
    setModuleSignStep("idle");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setModuleMultisigInfo(null);
    setHasOngoingModuleProcess(false);
    moduleCompletionProcessedRef.current = false;
  }, []);

  const closeModuleActionDialog = useCallback(() => {
    if (!hasOngoingModuleProcess) {
      resetModuleActionState();
    }
    setShowModuleActionDialog(false);

    if (selectedSafe) {
      setTimeout(async () => {
        await refreshModuleStatus();
      }, 1500);
    }
  }, [
    selectedSafe,
    hasOngoingModuleProcess,
    resetModuleActionState,
    refreshModuleStatus,
  ]);

  const handleShowEnableDialog = useCallback(() => {
    setModuleAction("enable");
    setShowModuleActionDialog(true);
    resetModuleActionState();
  }, [resetModuleActionState]);

  const handleShowDisableDialog = useCallback(() => {
    setModuleAction("disable");
    setShowModuleActionDialog(true);
    resetModuleActionState();
  }, [resetModuleActionState]);

  const handleEnableModule = useCallback(async () => {
    if (!selectedSafe) return;

    setModuleSignStep("pending");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const signResult = await signEnableModule(selectedSafe);
      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      if (signResult.data && !signResult.data.safeTxHash) {
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 1000);
        return;
      }

      setModuleExecuteStep("pending");
      const submitResult = await submitEnableModule();
      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(submitResult.error || "Failed to enable module");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  }, [
    selectedSafe,
    signEnableModule,
    submitEnableModule,
    closeModuleActionDialog,
  ]);

  const handleDisableModule = useCallback(async () => {
    if (!selectedSafe) return;

    setModuleSignStep("pending");
    setModuleExecuteStep("idle");
    setModuleSignError(undefined);
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const signResult = await signDisableModule(selectedSafe);
      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      setModuleExecuteStep("pending");
      const submitResult = await submitDisableModule();
      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(submitResult.error || "Failed to disable module");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  }, [
    selectedSafe,
    signDisableModule,
    submitDisableModule,
    closeModuleActionDialog,
  ]);

  const handleRetryModuleSign = useCallback(async () => {
    if (!selectedSafe) return;

    setModuleSignStep("pending");
    setModuleSignError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const signResult =
        moduleAction === "enable"
          ? await signEnableModule(selectedSafe)
          : await signDisableModule(selectedSafe);

      if (!signResult.success) {
        setModuleSignStep("error");
        setModuleSignError(signResult.error || "Failed to sign transaction");
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleSignStep("success");

      if (
        moduleAction === "enable" &&
        signResult.data &&
        !signResult.data.safeTxHash
      ) {
        setModuleExecuteStep("success");
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 1000);
        return;
      }

      setModuleExecuteStep("pending");
      const submitResult =
        moduleAction === "enable"
          ? await submitEnableModule()
          : await submitDisableModule();

      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(
          submitResult.error ||
            `Failed to ${moduleAction === "enable" ? "enable" : "disable"} module`,
        );
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  }, [
    selectedSafe,
    moduleAction,
    signEnableModule,
    signDisableModule,
    submitEnableModule,
    submitDisableModule,
    closeModuleActionDialog,
  ]);

  const handleRetryModuleExecute = useCallback(async () => {
    if (!selectedSafe) return;

    setModuleExecuteStep("pending");
    setModuleExecuteError(undefined);
    setHasOngoingModuleProcess(true);

    try {
      const submitResult =
        moduleAction === "enable"
          ? await submitEnableModule()
          : await submitDisableModule();

      if (!submitResult.success) {
        setModuleExecuteStep("error");
        setModuleExecuteError(
          submitResult.error ||
            `Failed to ${moduleAction === "enable" ? "enable" : "disable"} module`,
        );
        setHasOngoingModuleProcess(false);
        return;
      }

      setModuleExecuteStep("success");

      if (submitResult.data?.status === "executed") {
        setHasOngoingModuleProcess(false);
        setTimeout(() => {
          closeModuleActionDialog();
        }, 2000);
      } else if (submitResult.data?.status === "multisig") {
        setModuleMultisigInfo({
          safeAddress: selectedSafe,
          threshold: submitResult.data.threshold,
          safeTxHash: submitResult.data.safeTxHash || "",
          queueUrl: submitResult.data.queueUrl || null,
          fallbackUrl: submitResult.data.fallbackUrl || null,
          owners: submitResult.data.owners || [],
        });
      }
    } catch (err) {
      setHasOngoingModuleProcess(false);
      throw err;
    }
  }, [
    selectedSafe,
    moduleAction,
    submitEnableModule,
    submitDisableModule,
    closeModuleActionDialog,
  ]);

  const handleManualModuleRefresh = useCallback(async () => {
    if (!selectedSafe) return;

    setIsCheckingModuleStatus(true);
    try {
      await refreshModuleStatus();
    } finally {
      setIsCheckingModuleStatus(false);
    }
  }, [selectedSafe, refreshModuleStatus]);

  // Watch for module status completion (for multisig scenarios)
  useEffect(() => {
    if (
      !hasOngoingModuleProcess ||
      !moduleMultisigInfo?.safeAddress ||
      !selectedSafe ||
      moduleExecuteStep !== "success" ||
      moduleCompletionProcessedRef.current
    ) {
      return;
    }

    const isCompleted =
      (moduleAction === "enable" && moduleEnabled === true) ||
      (moduleAction === "disable" && moduleEnabled === false);

    if (isCompleted) {
      moduleCompletionProcessedRef.current = true;

      setTimeout(() => {
        closeModuleActionDialog();
      }, 1500);
    }
  }, [
    hasOngoingModuleProcess,
    moduleMultisigInfo?.safeAddress,
    selectedSafe,
    moduleEnabled,
    moduleAction,
    moduleExecuteStep,
    closeModuleActionDialog,
  ]);

  // ===========================
  // Memoized Context Value
  // ===========================

  const selection = useMemo<SafeWalletSelection>(
    () => ({
      selectedSafe,
      safeWallets,
      isLoading,
      error,
      selectSafe,
      refreshSafeList: refetch,
      moduleEnabled,
      checkingModule,
      refreshModuleStatus,
    }),
    [
      selectedSafe,
      safeWallets,
      isLoading,
      error,
      selectSafe,
      refetch,
      moduleEnabled,
      checkingModule,
      refreshModuleStatus,
    ],
  );

  const creation = useMemo<SafeWalletCreation>(
    () => ({
      showCreateFlow,
      createStep,
      signStep,
      enableStep,
      createError,
      signError,
      enableError,
      currentSafeAddress,
      isCreating,
      isSigningEnableModule,
      isExecutingEnableModule,
      isProposingEnableModule,
      handleCreateNewSafe,
      handleRetryCreate,
      handleRetrySign,
      handleRetryEnable,
      closeCreateFlow,
    }),
    [
      showCreateFlow,
      createStep,
      signStep,
      enableStep,
      createError,
      signError,
      enableError,
      currentSafeAddress,
      isCreating,
      isSigningEnableModule,
      isExecutingEnableModule,
      isProposingEnableModule,
      handleCreateNewSafe,
      handleRetryCreate,
      handleRetrySign,
      handleRetryEnable,
      closeCreateFlow,
    ],
  );

  const importFlowSlice = useMemo<SafeWalletImportFlow>(
    () => ({
      showImportDialog,
      hasImportOngoingProcess,
      openImportDialog,
      closeImportDialog,
      handleImportedSafe,
      setHasImportOngoingProcess,
    }),
    [
      showImportDialog,
      hasImportOngoingProcess,
      openImportDialog,
      closeImportDialog,
      handleImportedSafe,
    ],
  );

  const moduleControlSlice = useMemo<SafeWalletModuleControl>(
    () => ({
      showModuleActionDialog,
      moduleAction,
      moduleSignStep,
      moduleExecuteStep,
      moduleSignError,
      moduleExecuteError,
      moduleMultisigInfo,
      hasOngoingModuleProcess,
      isCheckingModuleStatus,
      isSigningDisableModule,
      isExecutingDisableModule,
      isProposingDisableModule,
      handleShowEnableDialog,
      handleShowDisableDialog,
      handleEnableModule,
      handleDisableModule,
      handleRetryModuleSign,
      handleRetryModuleExecute,
      handleManualModuleRefresh,
      closeModuleActionDialog,
    }),
    [
      showModuleActionDialog,
      moduleAction,
      moduleSignStep,
      moduleExecuteStep,
      moduleSignError,
      moduleExecuteError,
      moduleMultisigInfo,
      hasOngoingModuleProcess,
      isCheckingModuleStatus,
      isSigningDisableModule,
      isExecutingDisableModule,
      isProposingDisableModule,
      handleShowEnableDialog,
      handleShowDisableDialog,
      handleEnableModule,
      handleDisableModule,
      handleRetryModuleSign,
      handleRetryModuleExecute,
      handleManualModuleRefresh,
      closeModuleActionDialog,
    ],
  );

  const contextValue = useMemo<SafeWalletContextType>(
    () => ({
      selection,
      creation,
      importFlow: importFlowSlice,
      moduleControl: moduleControlSlice,
    }),
    [selection, creation, importFlowSlice, moduleControlSlice],
  );

  return (
    <SafeWalletContext.Provider value={contextValue}>
      {children}
    </SafeWalletContext.Provider>
  );
};
