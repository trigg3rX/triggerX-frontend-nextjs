import React from "react";
import { Typography } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { CheckCircle2, Loader2, FilePen, BadgeCheck, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/common/Dailog";

export type SafeCreationStepStatus = "idle" | "pending" | "success" | "error";

interface SafeWalletCreationDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  createStep: SafeCreationStepStatus;
  signStep: SafeCreationStepStatus;
  enableStep: SafeCreationStepStatus;
}

type StepKind = "create" | "sign" | "enable";

const StatusIcon: React.FC<{
  status: SafeCreationStepStatus;
  kind: StepKind;
}> = ({ status, kind }) => {
  if (status === "pending")
    return <Loader2 className="animate-spin text-white/70" size={20} />;
  if (status === "success")
    return <CheckCircle2 className="text-green-400" size={20} />;
  const colorClass = status === "error" ? "text-red-400" : "text-white/70";
  if (kind === "create") return <Plus size={20} className={colorClass} />;
  if (kind === "sign") return <FilePen size={20} className={colorClass} />;
  if (kind === "enable") return <BadgeCheck size={20} className={colorClass} />;
  return null;
};

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
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SafeWalletCreationDialog;
