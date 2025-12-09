import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Modal from "@/components/ui/Modal";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Button } from "@/components/ui/Button";
import { HoverHighlight } from "@/components/common/HoverHighlight";
import NavLink from "@/components/common/header/NavLink";
import { Dropdown, DropdownOption } from "@/components/ui/Dropdown";
import { InfoIcon, XIcon } from "lucide-react";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";
import { devLog } from "@/lib/devLog";
import { useJobFormContext } from "@/hooks/useJobFormContext";

interface IpfsScriptWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (ipfsUrl: string) => void;
  isSafeMode?: boolean;
  selectedSafeWallet?: string | null;
  targetFunction?: string;
}

type WizardStep = 1 | 2 | 3;

type SupportedLanguage = "go" | "ts";

const STORAGE_TOKEN_KEY = "pinata.jwt";

const LANGUAGE_PLACEHOLDERS: Record<SupportedLanguage, string> = {
  go: 'package main\n\nimport (\n    "encoding/json"\n    "fmt"\n)\n\nfunc main() {\n    // Build and print a JSON array of args\n    args := []interface{}{\n        "0x...", // example arg\n    }\n\n    out, _ := json.MarshalIndent(args, "", "  ")\n    fmt.Println(string(out))\n}',
  ts: `async function main() {
  // Build and return an array of args for the contract call
  const args = [
    "0x...", // example arg
  ];
  return args;
}

main()
  .then((args) => console.log(JSON.stringify(args, null, 2)))
  .catch((err) => {
    console.error("Script error:", err);
    process.exit(1);
  });`,
};
const LANGUAGE_OPTIONS: DropdownOption[] = [
  { id: "go", name: "Go" },
  { id: "ts", name: "TypeScript" },
];

export const IpfsScriptWizard: React.FC<IpfsScriptWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  isSafeMode = false,
  selectedSafeWallet = null,
  targetFunction = "",
}) => {
  const {
    language: formLanguage,
    setLanguage: setFormLanguage,
    jobType,
    contractInteractions,
    getTaskDefinitionId,
  } = useJobFormContext();
  const initialLanguage: SupportedLanguage =
    formLanguage === "ts" ? "ts" : "go";
  const [mode, setMode] = useState<"url" | "pinata">("url");
  const [step, setStep] = useState<WizardStep>(1);
  const [script, setScript] = useState<string>(
    LANGUAGE_PLACEHOLDERS[initialLanguage],
  );
  const [scriptError, setScriptError] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [token, setToken] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [manualUrl, setManualUrl] = useState<string>("");
  const [manualUrlError, setManualUrlError] = useState<string>("");
  const [showPinataHelp, setShowPinataHelp] = useState<boolean>(false);
  const [isUrlValidated, setIsUrlValidated] = useState<boolean>(false);
  const [isScriptValidated, setIsScriptValidated] = useState<boolean>(false);
  const helpPanelRef = useRef<HTMLDivElement | null>(null);
  const helpToggleRef = useRef<HTMLButtonElement | null>(null);

  const previousLanguageRef = useRef<SupportedLanguage>(initialLanguage);

  useEffect(() => {
    if (isOpen) {
      setMode("url");
      setStep(1);
      setScriptError("");
      setTokenError("");
      setManualUrl("");
      setManualUrlError("");
      setIsUrlValidated(false);
      setIsScriptValidated(false);
      const saved = localStorage.getItem(STORAGE_TOKEN_KEY) || "";
      if (saved) setToken(saved);
      if (!formLanguage) {
        setFormLanguage("go");
      }
    }
  }, [isOpen, formLanguage, setFormLanguage]);

  useEffect(() => {
    const previousLanguage = previousLanguageRef.current;
    if (previousLanguage === initialLanguage) {
      return;
    }
    const previousPlaceholder = LANGUAGE_PLACEHOLDERS[previousLanguage];
    const nextPlaceholder = LANGUAGE_PLACEHOLDERS[initialLanguage];
    if (
      script.trim() === "" ||
      script === previousPlaceholder ||
      script === nextPlaceholder
    ) {
      setScript(nextPlaceholder);
      setIsScriptValidated(false);
      setScriptError("");
    }
    previousLanguageRef.current = initialLanguage;
  }, [initialLanguage, script]);

  // Step 1 continue triggers validation on click
  const canContinueStep2 = useMemo(() => token.trim().length > 0, [token]);

  // Reset validation state when script changes
  useEffect(() => {
    setScriptError("");
    setIsScriptValidated(false);
  }, [script]);

  // Reset URL validation when URL changes
  useEffect(() => {
    setManualUrlError("");
    setIsUrlValidated(false);
  }, [manualUrl]);

  // ---- Validation helpers ----
  type ApiResponse = {
    error?: string;
    message?: string;
    executable?: boolean;
    output?: string;
    safe_match?: boolean;
  };

  const buildValidationRequestBody = useCallback(
    (code: string) => {
      // Get argumentType from contractInteractions
      const argumentType =
        contractInteractions.contract?.argumentType || "dynamic";
      // Calculate task_definition_id using the context function
      const taskDefinitionId = getTaskDefinitionId(argumentType, jobType);

      const base = {
        code,
        language: initialLanguage,
        task_definition_id: taskDefinitionId,
      } as Record<string, unknown>;
      if (isSafeMode && selectedSafeWallet && targetFunction) {
        return {
          ...base,
          is_safe: true,
          selected_safe: selectedSafeWallet,
          target_function: targetFunction,
        };
      }
      return { ...base, is_safe: false, target_function: targetFunction };
    },
    [
      isSafeMode,
      selectedSafeWallet,
      targetFunction,
      initialLanguage,
      jobType,
      contractInteractions,
      getTaskDefinitionId,
    ],
  );

  const callValidationApi = useCallback(
    async (requestBody: Record<string, unknown>) => {
      devLog(
        "Validation API URL:",
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/code/validate`,
      );
      devLog("[IpfsScriptWizard] Request body:", requestBody);
      devLog(
        "[IpfsScriptWizard] Request body stringified:",
        JSON.stringify(requestBody, null, 2),
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/code/validate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": process.env.NEXT_PUBLIC_API_KEY || "",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        devLog("[IpfsScriptWizard] Validation API error response:", text);
        throw new Error(
          text?.trim() ? text : `Validation failed (${res.status})`,
        );
      }

      let data: ApiResponse | null = null;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
        throw new Error("Invalid response format from validation API");
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    },
    [],
  );

  const assertValidationResult = useCallback(
    (data: ApiResponse) => {
      if (isSafeMode) {
        if (data.executable === false)
          throw new Error("Script is not executable");
        if (data.safe_match === false)
          throw new Error("Script does not match Safe wallet requirements");
      } else {
        if (data.executable === false)
          throw new Error("Script is not executable");
      }
    },
    [isSafeMode],
  );

  const validateScript = useCallback(async () => {
    const code = script.trim();
    if (!code) {
      setScriptError(
        `Please paste your ${
          initialLanguage === "ts" ? "TypeScript" : "Go"
        } code`,
      );
      return false;
    }
    setIsValidating(true);
    try {
      const requestBody = buildValidationRequestBody(code);
      const data = await callValidationApi(requestBody);
      assertValidationResult(data);
      if (data.output) devLog("Validation successful. Output:", data.output);

      setScriptError("");
      setIsScriptValidated(true);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setScriptError(msg || "Validation failed");
      setIsScriptValidated(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [
    script,
    assertValidationResult,
    buildValidationRequestBody,
    callValidationApi,
    initialLanguage,
  ]);

  const handleNextFromStep1 = async () => {
    if (!script.trim()) return;
    const ok = await validateScript();
    if (ok) setStep(2);
  };

  const fetchCodeFromIpfs = async (url: string): Promise<string> => {
    let gatewayUrl = url;

    // Convert ipfs:// to gateway URL
    if (url.startsWith("ipfs://")) {
      const cid = url.replace("ipfs://", "");
      gatewayUrl = `https://ipfs.io/ipfs/${cid}`;
    }

    const response = await fetch(gatewayUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch script from IPFS: ${response.status}`);
    }

    const code = await response.text();
    return code;
  };

  const validateManualUrl = useCallback(async () => {
    const url = manualUrl.trim();
    if (!url) {
      setManualUrlError("Please enter an IPFS URL or gateway link");
      return false;
    }
    const isIpfs = url.startsWith("ipfs://");
    const isGateway = /^https?:\/\//.test(url) && /\/ipfs\//.test(url);
    if (!isIpfs && !isGateway) {
      setManualUrlError(
        "Invalid format. Use ipfs://<cid> or https://<gateway>/ipfs/<cid>",
      );
      return false;
    }

    // Validate the script from IPFS
    setIsValidating(true);
    try {
      // Fetch the code from IPFS
      const code = await fetchCodeFromIpfs(url);
      const requestBody = buildValidationRequestBody(code);
      const data = await callValidationApi(requestBody);
      assertValidationResult(data);
      if (data.output) devLog("Validation successful. Output:", data.output);

      setManualUrlError("");
      setIsValidating(false);
      setIsUrlValidated(true);
      return true;
    } catch (e) {
      console.log(e);
      setIsValidating(false);
      const msg = e instanceof Error ? e.message : String(e);
      setManualUrlError(msg || "Validation failed");
      setIsUrlValidated(false);
      return false;
    }
  }, [
    manualUrl,
    assertValidationResult,
    buildValidationRequestBody,
    callValidationApi,
  ]);

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
      // Build a .go file from the script
      const file = new File([script], "dynamic-args.go", {
        type: "text/x-go",
      });
      const form = new FormData();
      form.append("file", file);
      form.append(
        "pinataMetadata",
        JSON.stringify({ name: "triggerx-dynamic-args.go" }),
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
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Upload failed (${res.status})${text ? `: ${text}` : ""}`,
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

        {/* Mode selector using theme HoverHighlight + NavLink */}
        <HoverHighlight className="px-1 py-1 w-full">
          {[
            <NavLink
              key="url"
              href="#"
              label="Use IPFS URL"
              isActive={mode === "url"}
              onClick={() => setMode("url")}
              className="text-sm flex-1 text-center"
            />,
            <NavLink
              key="pinata"
              href="#"
              label="Create & validate"
              isActive={mode === "pinata"}
              onClick={() => setMode("pinata")}
              className="text-sm flex-1 text-center"
            />,
          ]}
        </HoverHighlight>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <Dropdown
          label="Script Language"
          options={LANGUAGE_OPTIONS}
          selectedOption={
            LANGUAGE_OPTIONS.find((opt) => opt.id === initialLanguage)?.name ||
            "Go"
          }
          onChange={(option) => {
            const lang =
              (option.id as SupportedLanguage) ?? ("go" as SupportedLanguage);
            devLog("[IpfsScriptWizard] Selected language:", lang);
            setFormLanguage(lang);
            setScriptError("");
            setIsScriptValidated(false);
          }}
          className="w-full"
          color="secondary"
        />

        {mode === "url" && (
          <div className="space-y-4">
            <label className="block mb-2">
              <Typography variant="body" color="gray" align="left">
                IPFS URL / Gateway Link
              </Typography>
            </label>
            <div className="relative w-full">
              <TextInput
                value={manualUrl}
                onChange={setManualUrl}
                placeholder="ipfs://<cid> or https://gateway/ipfs/<cid>"
                type="text"
                className="rounded-xl w-full pr-16"
              />
            </div>
            {manualUrlError && (
              <Typography variant="caption" color="error" align="left">
                {manualUrlError}
              </Typography>
            )}
            <div className="flex justify-center gap-2 w-full">
              <Button
                color="white"
                onClick={validateManualUrl}
                disabled={isValidating || !manualUrl.trim()}
                className="w-full sm:w-auto flex-1"
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
              <Button
                color="yellow"
                onClick={async () => {
                  const isValid = await validateManualUrl();
                  if (isValid) {
                    onComplete(manualUrl.trim());
                    onClose();
                  }
                }}
                disabled={!manualUrl.trim() || isValidating || !isUrlValidated}
                className="w-full sm:w-auto flex-1"
              >
                Use URL
              </Button>
            </div>
          </div>
        )}

        {mode === "pinata" && (
          <div className="flex gap-2 text-xs">
            {[
              { id: 1 as WizardStep, label: "Create & Validate" },
              { id: 2 as WizardStep, label: "Pinata Login" },
              { id: 3 as WizardStep, label: "Upload & Use" },
            ].map((s, idx, arr) => (
              <Fragment key={s.id}>
                <span
                  className={step === s.id ? "text-white" : "text-white/50"}
                >
                  {s.label}
                </span>
                {idx < arr.length - 1 && (
                  <span className="text-white/30">/</span>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {mode === "pinata" && step === 1 && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              {`Paste your ${
                initialLanguage === "ts" ? "TypeScript" : "Golang"
              } script that returns an array of args for the function call.`}
            </Typography>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none min-h-[170px] text-sm overflow-auto ${scrollbarStyles.customScrollbar}`}
              placeholder={LANGUAGE_PLACEHOLDERS[initialLanguage]}
            />
            {scriptError && (
              <Typography variant="caption" color="error" align="left">
                {scriptError}
              </Typography>
            )}
            <div className="flex justify-center gap-2 w-full">
              <Button
                onClick={async () => {
                  const ok = await validateScript();
                  if (ok) setStep(2);
                }}
                className="flex-1"
                disabled={isValidating || !script.trim()}
                color="white"
              >
                {isValidating ? "Validating..." : "Validate"}
              </Button>
              <Button
                onClick={handleNextFromStep1}
                disabled={!script.trim() || isValidating || !isScriptValidated}
                className="flex-1"
                color="yellow"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {mode === "pinata" && step === 2 && (
          <div className="space-y-3">
            <Typography variant="body" align="left" color="secondary">
              Log in to Pinata and create a JWT. Paste it here.
            </Typography>
            <TextInput
              value={token}
              onChange={(v) => setToken(v)}
              placeholder="Paste your JWT"
              type="password"
            />
            {tokenError && (
              <Typography variant="caption" color="error" align="left">
                {tokenError}
              </Typography>
            )}
            <div className="flex flex-col items-start gap-2 w-full">
              <div className="flex items-center gap-2">
                <a
                  href="https://app.pinata.cloud/developers/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-white/70"
                >
                  Create a Pinata JWT
                </a>
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
              <div className="flex justify-center gap-2 w-full">
                <Button
                  onClick={() => setStep(1)}
                  className="flex-1"
                  color="white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSaveToken}
                  disabled={!canContinueStep2}
                  className="flex-1"
                  color="yellow"
                >
                  Continue
                </Button>
              </div>
            </div>
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
            <div className="flex justify-center gap-2 w-full">
              <Button
                onClick={() => setStep(2)}
                color="white"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={uploadToPinata}
                disabled={isUploading}
                color="yellow"
                className="flex-1"
              >
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
