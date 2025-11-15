import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Lightbulb } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";
import type { SafeWalletCreationDialogProps } from "@/types/safe";
import Link from "next/link";
import { SafeModuleFlowSteps } from "@/components/safe-wallet/SafeModuleFlowSteps";

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
          <SafeModuleFlowSteps
            mode="create"
            createStep={createStep}
            signStep={signStep}
            executeStep={enableStep}
            createError={createError}
            signError={signError}
            executeError={enableError}
            onRetryCreate={onRetryCreate}
            onRetrySign={onRetrySign}
            onRetryExecute={onRetryEnable}
          />

          <Typography variant="caption" color="gray" align="left">
            <Lightbulb size={16} className="inline-block mr-2 text-[#F8FF7C]" />
            Refer to the{" "}
            <Link
              href="https://triggerx.gitbook.io/triggerx-docs/create-your-first-job/triggerx-safe-automation-wallet"
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
