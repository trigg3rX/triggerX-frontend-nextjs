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
  Ban,
  ExternalLink,
  Lightbulb,
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
import { useChainId } from "wagmi";
import {
  getSafeModuleAddress,
  getExplorerUrl,
} from "@/utils/contractAddresses";
import Link from "next/link";

type StepKind = "create" | "sign" | "enable";

// StatusIcon is a component that displays the status of the step.
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
 * @note We want to prevent the dialog from closing when clicking outside the dialog as important to see the steps.
 */

export const SafeWalletCreationDialog: React.FC<
  SafeWalletCreationDialogProps
> = ({
  open,
  onClose,
  title = "Creating Safe Wallet",
  subtitle = "Follow the steps below to set up your Safe Wallet.",
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
  const chainId = useChainId();
  const safeModuleAddress = getSafeModuleAddress(chainId);
  const explorerUrl = getExplorerUrl(chainId);

  // To view the code of the TriggerX module on the explorer
  const safeModuleExplorerUrl = safeModuleAddress
    ? `${explorerUrl}${safeModuleAddress}#code`
    : "#";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Only allow closing dialog via the X button
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside the dialog
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent any interaction outside from closing the dialog
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {/* Steps */}
        <div className="space-y-6">
          {/* Deploy Safe contract */}
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={createStep} kind="create" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Deploy Safe Contract
              </Typography>
              <Typography variant="caption" color="secondary" align="justify">
                This step creates your Safe Wallet. You&apos;ll need to confirm
                a transaction in your connected wallet.
              </Typography>
              {createStep === "error" && createError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    <Ban size={12} className="inline-block mr-1" />{" "}
                    {createError}
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

          {/* Sign module enable message */}
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={signStep} kind="sign" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Sign Message
              </Typography>
              <Typography variant="caption" color="secondary" align="left">
                Sign a simple, gasless authorization message to approve the{" "}
                <Link
                  href={safeModuleExplorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C07AF6] underline inline-flex items-center gap-1 transition-colors"
                >
                  TriggerX module
                  <ExternalLink size={12} className="inline-block" />
                </Link>
              </Typography>
              {signStep === "error" && signError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    <Ban size={12} className="inline-block mr-1" /> {signError}
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

          {/* Enable module */}
          <Card className="flex items-start gap-2 p-4 sm:px-5">
            <div className="mt-0.5 shrink-0">
              <StatusIcon status={enableStep} kind="enable" />
            </div>
            <div className="min-w-0 text-left px-2">
              <Typography variant="body" align="left">
                Enable Module
              </Typography>
              <Typography variant="caption" color="secondary" align="justify">
                Execute the transaction to activate the module. You&apos;ll need
                to confirm the transaction in your connected wallet.
              </Typography>
              {enableStep === "error" && enableError && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  <Typography variant="caption" color="error" align="left">
                    <Ban size={12} className="inline-block mr-1" />{" "}
                    {enableError}
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
          <Typography variant="caption" color="gray" align="left">
            <Lightbulb size={16} className="inline-block mr-2 text-[#F8FF7C]" />
            Refer to the{" "}
            <Link
              href="https://triggerx.gitbook.io/triggerx-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C07AF6] underline inline-flex items-center gap-1 transition-colors"
            >
              documentation
            </Link>{" "}
            to learn more about the TriggerX Module.
          </Typography>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafeWalletCreationDialog;
