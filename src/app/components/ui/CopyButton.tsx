import React, { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import toast from "react-hot-toast";

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
