import React, { useState } from "react";
import { Tooltip } from "antd";
import { FiCopy, FiCheck } from "react-icons/fi";

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Tooltip title={copied ? "Copied!" : "Copy address"} color="#2A2A2A">
      <button
        onClick={handleCopy}
        className={`ml-2 p-1 hover:bg-[#252525] rounded-md transition-all ${className || ""}`}
        title="Copy address"
      >
        {copied ? (
          <FiCheck className="w-4 h-4 text-[#82FBD0]" />
        ) : (
          <FiCopy className="w-4 h-4 text-[#A2A2A2]" />
        )}
      </button>
    </Tooltip>
  );
};

export default CopyButton;
