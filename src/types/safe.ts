export type SafeCreationStepStatus = "idle" | "pending" | "success" | "error";

export type EnableModuleResult =
  | {
      status: "already_enabled";
      threshold: number;
      owners: string[];
    }
  | {
      status: "executed";
      threshold: number;
      owners: string[];
      transactionHash: string;
    }
  | {
      status: "multisig";
      threshold: number;
      owners: string[];
      safeTxHash: string;
      queueUrl: string | null;
      fallbackUrl: string | null;
    };

export type SignEnableModuleResult = {
  threshold: number;
  owners: string[];
  safeTxHash: string;
};

export type CreateSafeResult = {
  success: boolean;
  safeAddress: string | null;
  error?: string;
};

export type SignResult = {
  success: boolean;
  data?: SignEnableModuleResult;
  error?: string;
};

export type SubmitResult = {
  success: boolean;
  data?: EnableModuleResult;
  error?: string;
};

export interface SafeWalletCreationDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  createStep: SafeCreationStepStatus;
  signStep: SafeCreationStepStatus;
  enableStep: SafeCreationStepStatus;
  createError?: string;
  signError?: string;
  enableError?: string;
  onRetryCreate?: () => void;
  onRetrySign?: () => void;
  onRetryEnable?: () => void;
}
