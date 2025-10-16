import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { InfoIcon, XIcon } from "lucide-react";

interface IpfsScriptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (ipfsUrl: string) => void;
}

type WizardStep = 1 | 2 | 3;

const STORAGE_TOKEN_KEY = "pinata.jwt";

export const IpfsScriptWizard: React.FC<IpfsScriptWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [mode, setMode] = useState<"url" | "pinata">("url");
  const [step, setStep] = useState<WizardStep>(1);
  const [script, setScript] = useState<string>(
    "export async function main(context) {\n  // context contains request-time data\n  return []; // return array of arguments for the contract function\n}"
  );
  const [scriptError, setScriptError] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState<string>("");
  const [manualUrlError, setManualUrlError] = useState<string>("");
  const [showPinataHelp, setShowPinataHelp] = useState<boolean>(false);
  const helpPanelRef = useRef<HTMLDivElement | null>(null);
  const helpToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode("url");
      setStep(1);
      setScriptError("");
      setTokenError("");
      setManualUrl("");
      setManualUrlError("");
      const saved = localStorage.getItem(STORAGE_TOKEN_KEY) || "";
      if (saved) setToken(saved);
    }
  }, [isOpen]);

  const canContinueStep1 = useMemo(() => script.trim().length > 0, [script]);
  const canContinueStep2 = useMemo(() => token.trim().length > 0, [token]);

  const validateScript = useCallback(() => {
    try {
      // Basic syntax validation by constructing a Function
      // The script is expected to export a function named main, but here we only test syntax
      new Function(script);
      setScriptError("");
      return true;
    } catch (err) {
      setScriptError(
        err instanceof Error ? err.message : "Invalid script provided"
      );
      return false;
    }
  }, [script]);

  const handleNextFromStep1 = () => {
    if (!canContinueStep1) return;
    if (validateScript()) setStep(2);
  };

  const validateManualUrl = useCallback(() => {
    const url = manualUrl.trim();
    if (!url) {
      setManualUrlError("Please enter an IPFS URL or gateway link");
      return false;
    }
    const isIpfs = url.startsWith("ipfs://");
    const isGateway = /^https?:\/\//.test(url) && /\/ipfs\//.test(url);
    if (!isIpfs && !isGateway) {
      setManualUrlError(
        "Invalid format. Use ipfs://<cid> or https://<gateway>/ipfs/<cid>"
      );
      return false;
    }
    setManualUrlError("");
    return true;
  }, [manualUrl]);

  // Close Pinata help when clicking outside
  useEffect(() => {
    if (!showPinataHelp) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const clickedToggle = helpToggleRef.current?.contains(target as Node);
      const clickedPanel = helpPanelRef.current?.contains(target as Node);
      if (!clickedToggle && !clickedPanel) {
        setShowPinataHelp(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPinataHelp]);

  const handleSaveToken = () => {
    if (!canContinueStep2) {
      setTokenError("Please provide a valid token");
      return;
    }
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, token.trim());
      setTokenError("");
      setStep(3);
    } catch {
      setTokenError("Failed to store token locally");
    }
  };

  const uploadToPinata = useCallback(async () => {
    setIsUploading(true);
    try {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        setTokenError("Missing token");
        return;
      }
      // Build a file from the script
      const file = new File([script], "dynamic-args.js", {
        type: "application/javascript",
      });
      const form = new FormData();
      form.append("file", file);
      form.append(
        "pinataMetadata",
        JSON.stringify({ name: "triggerx-dynamic-args.js" })
      );
      form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${trimmedToken}`,
          },
          body: form,
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Upload failed (${res.status})${text ? `: ${text}` : ""}`
        );
      }
      const data = (await res.json()) as { IpfsHash?: string };
      if (!data.IpfsHash) throw new Error("CID not returned by Pinata");

      const ipfsUrl = `ipfs://${data.IpfsHash}`;
      onComplete(ipfsUrl);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTokenError(msg);
    } finally {
      setIsUploading(false);
    }
  }, [onClose, onComplete, script, token]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl w-[95%]">
      <div className="space-y-5">
        <Typography variant="h2" align="left">
          Dynamic Argument Script
        </Typography>

        {/* Mode selector */}
        <div className="flex justify-between gap-2">
          <Button
            color={mode === "url" ? "yellow" : "white"}
            onClick={() => setMode("url")}
          >
            Use IPFS URL
          </Button>
          <Button
            color={mode === "pinata" ? "yellow" : "white"}
            onClick={() => setMode("pinata")}
          >
            Create & validate
          </Button>
        </div>

        <hr className="border-white/40" />

        {mode === "url" && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              Enter an IPFS URL or IPFS gateway link.
            </Typography>
            <TextInput
              label="IPFS URL"
              value={manualUrl}
              onChange={setManualUrl}
              placeholder="ipfs://<cid> or https://gateway/ipfs/<cid>"
              type="text"
            />
            {manualUrlError && (
              <Typography variant="caption" color="error" align="left">
                {manualUrlError}
              </Typography>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={validateManualUrl}>Validate</Button>
              <Button
                onClick={() => {
                  if (validateManualUrl()) {
                    onComplete(manualUrl.trim());
                    onClose();
                  }
                }}
                disabled={!manualUrl.trim()}
              >
                Use URL
              </Button>
            </div>
          </div>
        )}

        {mode === "pinata" && (
          <div className="flex gap-2 text-xs">
            <span className={step === 1 ? "text-white" : "text-white/50"}>
              1. Create & Validate
            </span>
            <span className="text-white/30">/</span>
            <span className={step === 2 ? "text-white" : "text-white/50"}>
              2. Pinata Login
            </span>
            <span className="text-white/30">/</span>
            <span className={step === 3 ? "text-white" : "text-white/50"}>
              3. Upload & Use
            </span>
          </div>
        )}

        {mode === "pinata" && step === 1 && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              Paste your Golang script that returns an array of args for
              function call.
            </Typography>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none min-h-[220px] text-sm"
              placeholder={`export async function main(context) {\n  return [\n    // your args here\n  ];\n}`}
            />
            {scriptError && (
              <Typography variant="caption" color="error" align="left">
                {scriptError}
              </Typography>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={validateScript}>Validate</Button>
              <Button
                onClick={handleNextFromStep1}
                disabled={!canContinueStep1}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {mode === "pinata" && step === 2 && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              Log in to Pinata and create a JWT. Paste it below.
            </Typography>
            <TextInput
              label="Pinata JWT"
              value={token}
              onChange={(v) => setToken(v)}
              placeholder="Paste your token"
              type="password"
            />
            {tokenError && (
              <Typography variant="caption" color="error" align="left">
                {tokenError}
              </Typography>
            )}
            <div className="flex justify-between items-center">
              <a
                href="https://app.pinata.cloud/developers/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-xs underline text-white/70"
              >
                Create a Pinata JWT
              </a>
              {/* Expandable instructions */}
              <button
                type="button"
                className="text-xs underline text-white/70 hover:text-white"
                onClick={() => setShowPinataHelp((v) => !v)}
                ref={helpToggleRef}
              >
                {showPinataHelp ? (
                  <XIcon className="w-3 h-3" />
                ) : (
                  <InfoIcon className="w-4 h-4" />
                )}
              </button>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button onClick={handleSaveToken} disabled={!canContinueStep2}>
                  Continue
                </Button>
              </div>
            </div>
            {showPinataHelp && (
              <div
                className="mt-2 rounded-lg border border-white/10 bg-white/5 p-3"
                ref={helpPanelRef}
              >
                <Typography variant="caption" align="left" color="secondary">
                  Follow these steps to generate a Pinata JWT:
                </Typography>
                <ol className="list-decimal ml-5 mt-2 space-y-1 text-xs text-white/80">
                  <li>
                    Click on the following link: {""}
                    <a
                      href="https://app.pinata.cloud/developers/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Pinata API Keys
                    </a>
                  </li>
                  <li>Click on “+ New Key”.</li>
                  <li>Enter your preferred key name.</li>
                  <li>
                    Enable permissions: Legacy Endpoint → Pinning →
                    “pinFileToIPFS”.
                  </li>
                  <li>Click on “Create”.</li>
                  <li>
                    Copy the JWT from “API Key Information” and paste it into
                    the field above.
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        {mode === "pinata" && step === 3 && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              Click on the button below to upload your script to IPFS via Pinata
              using your account.
            </Typography>
            {tokenError && (
              <Typography variant="caption" color="error" align="left">
                {tokenError}
              </Typography>
            )}
            <div className="flex justify-between">
              <Button onClick={() => setStep(2)}>Back</Button>
              <Button onClick={uploadToPinata} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload & Use"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IpfsScriptWizard;
