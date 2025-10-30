import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Loader2,
  FilePen,
  BadgeCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";
import type {
  SafeCreationStepStatus,
  SafeWalletCreationDialogProps,
} from "@/types/safe";

type StepKind = "create" | "sign" | "enable";

const StatusIcon: React.FC<{
  status: SafeCreationStepStatus;
  kind: StepKind;
}> = ({ status, kind }) => {
  if (status === "pending")
    return <Loader2 className="animate-spin text-white/70" size={20} />;
  if (status === "success")
    return <CheckCircle2 className="text-green-400" size={20} />;
  const colorClass = status === "error" ? "text-red-600" : "text-white/70";
  if (kind === "create") return <Plus size={20} className={colorClass} />;
  if (kind === "sign") return <FilePen size={20} className={colorClass} />;
  if (kind === "enable") return <BadgeCheck size={20} className={colorClass} />;
  return null;
};

/**
 * SafeWalletCreationDialog is a dialog that displays the creation process of a Safe wallet.
 * It displays the current step and the status of the step.
 * It also displays the error message if the step fails.
 * It also displays the button to retry the step if it fails.
 * @note We are not using the Button component here because we want to use the button as a link.
 */

export const SafeWalletCreationDialog: React.FC<
  SafeWalletCreationDialogProps
> = ({
  open,
  onClose,
  title = "Creating Safe Wallet",
  subtitle = "Please follow the instructions below to complete the safe wallet creation process.",
  createStep,
  signStep,
  enableStep,
  createError,
  signError,
  enableError,
  onRetryCreate,
  onRetrySign,
  onRetryEnable,
}) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={createStep} kind="create" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Deploy Safe contract
              </Typography>
              <Typography variant="caption" color="secondary" align="left">
                This creates your Safe wallet. You will confirm a transaction.
              </Typography>
              {createStep === "error" && createError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    Error: {createError}
                  </Typography>
                  {onRetryCreate && (
                    <button
                      onClick={onRetryCreate}
                      className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                      title="Retry Deploy"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={signStep} kind="sign" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Sign module enable message
              </Typography>
              <Typography variant="caption" color="secondary" align="left">
                We request your signature to authorize enabling the TriggerX
                module for seamless automation.
              </Typography>
              {signStep === "error" && signError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    Error: {signError}
                  </Typography>
                  {onRetrySign && (
                    <button
                      onClick={onRetrySign}
                      className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                      title="Retry Sign"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={enableStep} kind="enable" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Enable module
              </Typography>
              <Typography variant="caption" color="secondary" align="left">
                Executes a Safe transaction to enable the TriggerX module.
              </Typography>
              {enableStep === "error" && enableError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    Error: {enableError}
                  </Typography>
                  {onRetryEnable && (
                    <button
                      onClick={onRetryEnable}
                      className="text-[#F8FF7C] transition-colors cursor-pointer shrink-0"
                      title="Retry Enable"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafeWalletCreationDialog;
