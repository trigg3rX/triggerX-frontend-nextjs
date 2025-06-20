import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dailog";
import { ActionButton } from "../ui/ActionButton";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  open,
  onOpenChange,
  title = "Delete",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onCancel,
  onConfirm,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <ActionButton
            onClick={onCancel}
            type="button"
            text={cancelText}
            variant="cancel"
          />
          <ActionButton
            onClick={onConfirm}
            type="button"
            text={confirmText}
            variant="delete"
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
