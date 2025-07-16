import React, { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

const defaultModalClass =
  "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#141414] p-4 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-xl w-[95%] sm:w-full max-w-md z-[10000]";
const defaultOverlayClass =
  "fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]";

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  overlayClassName = "",
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Use portal to render modal at root level
  return createPortal(
    <div
      className={`${defaultOverlayClass} ${overlayClassName}`}
      onClick={handleOverlayClick}
    >
      <div className={`${defaultModalClass} ${className}`}>{children}</div>
    </div>,
    document.getElementById("modal-root") as HTMLElement,
  );
};

export default Modal;
