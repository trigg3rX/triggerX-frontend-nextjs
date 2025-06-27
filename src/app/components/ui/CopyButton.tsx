import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";
import { CopyIcon, CheckIcon } from "lucide-react";
import { ActionButton } from "./ActionButton";

// --- VARIANT 1: Original CopyButton with toast and react-icons/fi ---
interface CopyButtonProps {
  value?: string | null;
  className?: string;
  title?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  value,
  className = "",
  title = "Copy",
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast.success("Address copied to clipboard!");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy address"));
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-white bg-[#303030] hover:bg-[#404040] p-1 rounded-md ${className}`}
      title={title}
      disabled={!value}
    >
      {copied ? (
        <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
      ) : (
        <FiCopy className="h-3 w-3 sm:h-4 sm:w-4" />
      )}
    </button>
  );
};

export default CopyButton;

// --- VARIANT 2: LucideCopyButton with lucide-react icons and ActionButton ---
interface LucideCopyButtonProps {
  text: string;
  className?: string;
  onCopy?: () => void;
}

export function LucideCopyButton({
  text,
  className = "",
  onCopy,
}: LucideCopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <ActionButton
      onClick={handleCopy}
      variant="ghost"
      size="sm"
      className={className}
      icon={
        copied ? (
          <CheckIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <CopyIcon className="h-4 w-4" />
        )
      }
      text=""
    />
  );
}
