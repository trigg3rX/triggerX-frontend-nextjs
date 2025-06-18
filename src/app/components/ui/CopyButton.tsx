import { CopyIcon, CheckIcon } from "lucide-react";
import { useState } from "react";
import { ActionButton } from "./ActionButton";

interface CopyButtonProps {
  text: string;
  className?: string;
  onCopy?: () => void;
}

export function CopyButton({ text, className = "", onCopy }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.();

      // Reset the copied state after 2 seconds
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
