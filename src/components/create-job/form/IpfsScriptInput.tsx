import React, { useState } from "react";
import { Typography } from "../../ui/Typography";
import { TextInput } from "../../ui/TextInput";
import { IpfsScriptWizard } from "./IpfsScriptWizard";
import { FormErrorMessage } from "@/components/common/FormErrorMessage";
import { ExternalLinkIcon, LucideCircleArrowOutUpLeft } from "lucide-react";
import Link from "next/link";

interface IpfsScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  urlError?: string | null;
  onClearError?: () => void;
  readOnly?: boolean;
  isSafeMode?: boolean;
  selectedSafeWallet?: string | null;
  targetFunction?: string;
  label?: string;
  inputId?: string;
}

export const IpfsScriptInput: React.FC<IpfsScriptInputProps> = ({
  value,
  onChange,
  error = null,
  urlError = null,
  onClearError,
  readOnly = false,
  isSafeMode = false,
  selectedSafeWallet = null,
  targetFunction = "",
  label = "IPFS Code URL",
  inputId = "ipfs-code-url",
}) => {
  const [isIpfsWizardOpen, setIsIpfsWizardOpen] = useState(false);

  return (
    <div className="space-y-auto">
      {value ? (
        <TextInput
          label={label}
          value={value}
          onChange={() => {}}
          placeholder="IPFS URL"
          error={error}
          type="text"
          id={inputId}
          disabled
          endAdornment={
            <Link
              href={(() => {
                const url = value;
                if (url.startsWith("ipfs://")) {
                  const cid = url.replace("ipfs://", "");
                  return `https://ipfs.io/ipfs/${cid}`;
                }
                return url;
              })()}
              target="_blank"
              rel="noreferrer"
              className="text-white/70 hover:text-white"
              aria-label="Open IPFS URL"
            >
              <ExternalLinkIcon className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
          <Typography variant="h4" color="secondary" className="text-nowrap">
            {label}
          </Typography>
          <div className="w-full md:w-[70%]">
            <button
              type="button"
              onClick={() => !readOnly && setIsIpfsWizardOpen(true)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={readOnly}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base">
                  Upload or Validate Script
                </span>
                <LucideCircleArrowOutUpLeft className="w-4 h-4 text-white/50" />
              </div>
            </button>
          </div>
        </div>
      )}
      <div className="w-full md:w-[70%] ml-auto pl-3 mt-3 flex flex-wrap gap-2">
        <FormErrorMessage error={error} className="mb-1" />
        {urlError && (
          <Typography variant="caption" color="error" align="left">
            {urlError}
          </Typography>
        )}
      </div>

      {/* IPFS Script Wizard */}
      <IpfsScriptWizard
        isOpen={isIpfsWizardOpen}
        onClose={() => setIsIpfsWizardOpen(false)}
        onComplete={(url) => {
          onChange(url);
          if (onClearError) {
            onClearError();
          }
          setIsIpfsWizardOpen(false);
        }}
        isSafeMode={isSafeMode}
        selectedSafeWallet={selectedSafeWallet}
        targetFunction={targetFunction}
      />
    </div>
  );
};
