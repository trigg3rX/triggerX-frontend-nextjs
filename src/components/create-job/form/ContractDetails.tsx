import { useJobFormContext } from "@/hooks/useJobFormContext";
import { TextInput } from "../../ui/TextInput";
import { Typography } from "../../ui/Typography";
import { Dropdown, DropdownOption } from "../../ui/Dropdown";
import React, { useState } from "react";
import { IpfsScriptWizard } from "./IpfsScriptWizard";
import { FunctionInput } from "@/types/job";
import { RadioGroup } from "../../ui/RadioGroup";
import { FormErrorMessage } from "@/components/common/FormErrorMessage";
import { ExternalLinkIcon, LucideCircleArrowOutUpLeft } from "lucide-react";
import Link from "next/link";

interface ContractDetailsProps {
  contractKey: string;
  label: string;
  error?: string | null;
  abiError?: string | null;
  targetError?: string | null;
  ipfsError?: string | null;
  argsError?: string | null;
  sourceUrlError?: string | null;
  conditionTypeError?: string | null;
  limitsError?: string | null;
  readOnly?: boolean;
}

export const ContractDetails = ({
  contractKey,
  label,
  error = null,
  abiError = null,
  targetError = null,
  ipfsError = null,
  argsError = null,
  sourceUrlError = null,
  conditionTypeError = null,
  limitsError = null,
  readOnly = false,
}: ContractDetailsProps) => {
  const {
    jobType,
    setContractErrors,
    contractInteractions,
    setContractInteractions,
    handleContractAddressChange,
    handleManualABIChange,
    handleEventChange,
    handleFunctionChange,
    handleArgumentTypeChange,
    handleArgumentValueChange,
    handleIpfsCodeUrlChange,
    handleSourceTypeChange,
    handleSourceUrlChange,
    handleApiKeySelection,
    handleConditionTypeChange,
    handleLowerLimitChange,
    handleUpperLimitChange,
    executionMode,
    selectedSafeWallet,
  } = useJobFormContext();

  const contract = contractInteractions[contractKey] || {
    address: "",
    abi: null,
    isCheckingABI: false,
    manualABI: "",
    events: [],
    targetEvent: "",
    functions: [],
    targetFunction: "",
    argumentType: "",
    ipfsCodeUrl: "",
    ipfsCodeUrlError: "",
    sourceType: "api",
  };

  const isEventContract = contractKey === "eventContract";
  const isSafeMode = executionMode === "safe" && contractKey === "contract";

  // Auto-set argument type to dynamic when in Safe mode
  React.useEffect(() => {
    if (isSafeMode && contract.argumentType !== "dynamic") {
      handleArgumentTypeChange(contractKey, "dynamic");
    }
  }, [
    isSafeMode,
    contract.argumentType,
    contractKey,
    handleArgumentTypeChange,
  ]);

  // Auto-select execJobFromHub function in Safe mode
  React.useEffect(() => {
    if (isSafeMode && contract.functions.length > 0) {
      const execJobFromHub = contract.functions.find(
        (func) => func.name === "execJobFromHub",
      );
      if (execJobFromHub && !contract.targetFunction) {
        const signature = formatSignature(
          execJobFromHub.name,
          execJobFromHub.inputs,
        );
        handleFunctionChange(contractKey, signature);
      }
    }
  }, [
    isSafeMode,
    contract.functions,
    contract.targetFunction,
    contractKey,
    handleFunctionChange,
  ]);

  const formatSignature = (name: string, inputs: { type: string }[]) =>
    `${name}(${inputs.map((input) => input.type).join(",")})`;

  const eventOptions: DropdownOption[] = (contract.events || []).map(
    (event, index) => ({
      id: index,
      name: formatSignature(event.name, event.inputs),
    }),
  );

  const functionOptions: DropdownOption[] = (contract.functions || []).map(
    (func, index) => ({
      id: index,
      name: formatSignature(func.name, func.inputs),
    }),
  );

  const selectedFunction = contract.functions.find(
    (func) =>
      formatSignature(func.name, func.inputs) === contract.targetFunction,
  );
  const hasArguments =
    selectedFunction &&
    selectedFunction.inputs &&
    selectedFunction.inputs.length > 0;

  const isDisabled = contract.argumentType === "dynamic" || isSafeMode;
  const functionInputs = (selectedFunction?.inputs || []) as FunctionInput[];

  const argumentTypeOptions: DropdownOption[] = [
    { id: "static", name: "Static" },
    { id: "dynamic", name: "Dynamic" },
  ];

  const getInputName = (input: FunctionInput, index: number) => {
    return typeof input.name === "string" && input.name.length > 0
      ? input.name
      : `Argument ${index + 1}`;
  };

  // Ensure 'Static' is selected by default if argumentType is empty
  // Force 'Dynamic' if Safe mode
  const selectedArgumentType =
    argumentTypeOptions.find(
      (opt) =>
        opt.id === (isSafeMode ? "dynamic" : contract.argumentType || "static"),
    )?.name || "Static";

  const conditionTypeOptions: DropdownOption[] = [
    { id: "equals", name: "Equals to" },
    { id: "not_equals", name: "Not Equals to" },
    { id: "less_than", name: "Less Than" },
    { id: "greater_than", name: "Greater Than" },
    { id: "between", name: "In Range" },
    { id: "less_equal", name: "Less Than or Equals to" },
    { id: "greater_equal", name: "Greater Than or Equals to" },
  ];

  const handleChange = (value: string) => {
    if (readOnly || isSafeMode) return;
    handleContractAddressChange(contractKey, value);
    if (value.trim() !== "") {
      setContractErrors((prev) => ({ ...prev, [contractKey]: null }));
    }
  };

  const targetDropdownId = `${contractKey}-target-dropdown`;
  const [isIpfsWizardOpen, setIsIpfsWizardOpen] = useState(false);

  return (
    <div className="space-y-6">
      <TextInput
        label={isSafeMode ? "Safe Module Address" : label}
        value={contract.address}
        onChange={handleChange}
        placeholder={isSafeMode ? "Safe Module Address" : "Contract address"}
        type="text"
        id={`contract-address-input-${contractKey}`}
        error={error ?? null}
        readOnly={readOnly || isSafeMode}
      />

      {contract.address && !isSafeMode && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
          <Typography variant="h4" color="secondary" className="text-nowrap">
            Contract ABI
          </Typography>
          <div className="w-[70%] h-[38px] sm:h-[50px] text-start ml-3 flex items-center">
            {contract.isCheckingABI ? (
              <div className="flex items-center ml-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                <Typography variant="body" color="secondary" className="pl-2">
                  Validating Contract...
                </Typography>
              </div>
            ) : contract.abi ? (
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <div className="flex items-center ml-3">
                <Typography variant="body" color="secondary" className="pr-2">
                  Not Available
                </Typography>
                <Typography variant="body" color="error" className="mt-[2px]">
                  ✕
                </Typography>
              </div>
            )}
          </div>
        </div>
      )}

      {contract.address &&
        !contract.abi &&
        !contract.isCheckingABI &&
        !isSafeMode && (
          <div className="flex flex-col md:flex-row items-start justify-between gap-2 md:gap-6">
            <Typography
              variant="h4"
              color="secondary"
              className="text-nowrap h-[50px] flex items-center"
            >
              Manual ABI Input
            </Typography>
            <div className="w-full md:w-[70%]">
              <textarea
                id={`manualEventABI-${contractKey}`}
                value={contract.manualABI}
                onChange={
                  readOnly
                    ? undefined
                    : (e) => handleManualABIChange(contractKey, e.target.value)
                }
                placeholder={`[
{
    "inputs": [],
    "name": "functionName",
    "type": "function",
    "stateMutability": "nonpayable"
  }
]`}
                className="text-xs xs:text-sm sm:text-base w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none min-h-[230px]"
                readOnly={readOnly}
                disabled={readOnly}
              />
              <FormErrorMessage error={abiError ?? null} className="mt-1" />
              <Typography
                variant="caption"
                align="left"
                color="secondary"
                className="mt-1"
              >
                Automatic fetch failed. To continue, please enter the contract
                ABI in JSON format.
              </Typography>
            </div>
          </div>
        )}

      {contract.address && contract.abi && (
        <div className="space-y-auto">
          {isEventContract ? (
            <div id={targetDropdownId}>
              <Dropdown
                label="Target event"
                options={eventOptions}
                selectedOption={contract.targetEvent || "Select an event"}
                onChange={
                  readOnly
                    ? () => {}
                    : (option) => {
                        handleEventChange(contractKey, option.name);
                        setContractErrors((prev) => ({
                          ...prev,
                          [`${contractKey}Target`]: null,
                        }));
                      }
                }
                className="[&_p]:break-all [&_p]:text-left [&_p]:w-[90%]"
                disabled={readOnly}
              />
              <FormErrorMessage
                error={targetError ?? null}
                className="mt-1 w-full md:w-[70%] ml-auto"
              />

              {/* Event Arguments Radio Buttons */}
              {contract.targetEvent && (
                <div className="my-6">
                  <RadioGroup
                    label="Filter Parameters"
                    options={(() => {
                      const selectedEvent = contract.events.find(
                        (event) =>
                          formatSignature(event.name, event.inputs) ===
                          contract.targetEvent,
                      );
                      if (
                        !selectedEvent ||
                        !selectedEvent.inputs ||
                        selectedEvent.inputs.length === 0
                      ) {
                        return [
                          {
                            label: "No arguments available",
                            value: "none",
                            disabled: true,
                          },
                        ];
                      }
                      return [
                        { label: "No filter", value: "" },
                        ...selectedEvent.inputs.map((input, index) => ({
                          label: input.name || `Argument ${index + 1}`,
                          value: input.name || `arg${index}`,
                        })),
                      ];
                    })()}
                    value={contract.selectedEventArgument || ""}
                    onChange={
                      readOnly
                        ? () => {}
                        : (value) => {
                            // Handle event argument selection
                            setContractInteractions((prev) => ({
                              ...prev,
                              [contractKey]: {
                                ...prev[contractKey],
                                selectedEventArgument: String(value),
                                // Clear value when no filter is selected
                                eventArgumentValue:
                                  String(value) === ""
                                    ? ""
                                    : prev[contractKey].eventArgumentValue,
                              },
                            }));
                          }
                    }
                    name={`event-args-${contractKey}`}
                    disabled={readOnly}
                  />

                  {/* Value input for selected argument */}
                  {contract.selectedEventArgument &&
                    contract.selectedEventArgument !== "" &&
                    contract.selectedEventArgument !== "none" && (
                      <div className="mt-4">
                        <TextInput
                          label={`Parameter Value`}
                          value={contract.eventArgumentValue || ""}
                          onChange={
                            readOnly
                              ? () => {}
                              : (value) => {
                                  setContractInteractions((prev) => ({
                                    ...prev,
                                    [contractKey]: {
                                      ...prev[contractKey],
                                      eventArgumentValue: value,
                                    },
                                  }));
                                }
                          }
                          placeholder={`Enter value for ${contract.selectedEventArgument}`}
                          type="text"
                          disabled={readOnly}
                        />
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div id={targetDropdownId}>
              <Dropdown
                label="Target function"
                options={functionOptions}
                selectedOption={contract.targetFunction || "Select a function"}
                onChange={
                  readOnly
                    ? () => {}
                    : (option) => {
                        handleFunctionChange(contractKey, option.name);
                        setContractErrors((prev) => ({
                          ...prev,
                          [`${contractKey}Target`]: null,
                        }));
                      }
                }
                className="[&_p]:break-all [&_p]:text-left [&_p]:w-[90%]"
                disabled={readOnly}
              />
              <FormErrorMessage
                error={targetError ?? null}
                className="mt-1 w-full md:w-[70%] ml-auto"
              />
            </div>
          )}

          {((isEventContract && contract.events.length === 0) ||
            (!isEventContract && contract.functions.length === 0)) && (
            <Typography
              variant="caption"
              color="secondary"
              align="left"
              className="w-full md:w-[70%] ml-auto mt-2"
            >
              {isEventContract
                ? "No writable events found. Make sure the contract is verified on Blockscout / Etherscan."
                : "No writable functions found. Make sure the contract is verified on Blockscout / Etherscan or the ABI is valid."}
            </Typography>
          )}
        </div>
      )}

      {!isEventContract && contract.targetFunction && hasArguments && (
        <>
          <div className="space-y-auto">
            <Dropdown
              label="Argument Type"
              options={argumentTypeOptions}
              selectedOption={selectedArgumentType}
              onChange={
                readOnly || isSafeMode
                  ? () => {}
                  : (option) => {
                      const type = option.name.toLowerCase() as
                        | "static"
                        | "dynamic";
                      handleArgumentTypeChange(contractKey, type);
                    }
              }
              disabled={readOnly || isSafeMode}
            />

            <Typography
              variant="caption"
              align="left"
              color="secondary"
              className="w-full md:w-[70%] ml-auto mt-2 pl-3"
            >
              {isSafeMode
                ? "Safe wallet execution requires dynamic arguments from IPFS"
                : hasArguments
                  ? "Select how function arguments should be handled during execution"
                  : "No arguments required for this function"}
            </Typography>
          </div>

          {/* Function Arguments Section */}
          {contract.targetFunction &&
            functionInputs.length > 0 &&
            !isDisabled && (
              <div
                className="space-y-6 sm:space-y-6"
                id={`contract-args-section-${contractKey}`}
              >
                <div className="flex justify-between flex-col lg:flex-row md:flex-row">
                  <Typography
                    as="label"
                    variant="h3"
                    color="primary"
                    className="text-nowrap text-center"
                  >
                    Function Arguments
                  </Typography>
                </div>
                <FormErrorMessage error={argsError ?? null} className="mb-2" />
                {!isDisabled &&
                  functionInputs.map((input, index) => (
                    <div key={index}>
                      <TextInput
                        label={`${getInputName(input, index)} (${input.type})`}
                        value={contract.argumentValues?.[index] || ""}
                        onChange={
                          readOnly
                            ? () => {}
                            : (value) => {
                                handleArgumentValueChange(
                                  contractKey,
                                  index,
                                  value,
                                );
                                setContractErrors((prev) => ({
                                  ...prev,
                                  [`${contractKey}Args`]: null,
                                }));
                              }
                        }
                        placeholder={`Enter ${input.type}`}
                        type="text"
                        disabled={readOnly}
                      />
                    </div>
                  ))}
              </div>
            )}
        </>
      )}

      {/* IPFS Code URL Field */}
      {contract.argumentType === "dynamic" && (
        <div className="space-y-auto">
          {contract.ipfsCodeUrl ? (
            <TextInput
              label="IPFS Code URL"
              value={contract.ipfsCodeUrl || ""}
              onChange={() => {}}
              placeholder="IPFS URL"
              error={ipfsError ?? null}
              type="text"
              id={`contract-ipfs-code-url-${contractKey}`}
              disabled
              endAdornment={
                <Link
                  href={(() => {
                    const url = contract.ipfsCodeUrl;
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
              <Typography
                variant="h4"
                color="secondary"
                className="text-nowrap"
              >
                IPFS Code URL
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
            <FormErrorMessage error={ipfsError ?? null} className="mb-1" />
            {contract.ipfsCodeUrlError && (
              <Typography variant="caption" color="error" align="left">
                {contract.ipfsCodeUrlError}
              </Typography>
            )}
          </div>
        </div>
      )}

      {jobType === 2 && (
        <>
          {/* Source Type Field */}
          <RadioGroup
            label="Source Type"
            options={[
              { label: "API", value: "api" },
              { label: "WebSocket", value: "static", disabled: true },
              { label: "Oracle", value: "oracle", disabled: true },
            ]}
            value={contract.sourceType || "api"}
            onChange={
              readOnly
                ? () => {}
                : (value) =>
                    handleSourceTypeChange(contractKey, value as string)
            }
            name={`sourceType-${contractKey}`}
            disabled={readOnly}
          />

          {/* Source URL Field */}
          {contract.sourceType && (
            <div className="space-y-auto">
              <TextInput
                label="Source URL"
                value={contract.sourceUrl || ""}
                onChange={
                  readOnly
                    ? () => {}
                    : (value) => {
                        handleSourceUrlChange(contractKey, value);
                        setContractErrors((prev) => ({
                          ...prev,
                          [`${contractKey}SourceUrl`]: null,
                        }));
                      }
                }
                placeholder={`Enter ${contract.sourceType.toLowerCase()} URL`}
                error={sourceUrlError ?? null}
                type="text"
                id={`contract-source-url-${contractKey}`}
                disabled={readOnly}
              />
              {contract.sourceUrlError && (
                <Typography
                  variant="caption"
                  color="error"
                  align="left"
                  className="w-full md:w-[70%] mt-2 ml-auto"
                >
                  {contract.sourceUrlError}
                </Typography>
              )}
            </div>
          )}

          {contract.sourceUrl && !contract.sourceUrlError && (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
              <Typography
                variant="h4"
                color="secondary"
                className="text-nowrap"
              >
                Keys
              </Typography>

              <div className="w-[70%] h-[38px] sm:h-[50px] text-start ml-3 flex items-center">
                {contract.isFetchingApiKeys ? (
                  <div className="flex items-center ml-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                    <Typography
                      variant="body"
                      color="secondary"
                      className="pl-2"
                    >
                      Fetching key : value pairs...
                    </Typography>
                  </div>
                ) : contract.apiKeys && contract.apiKeys.length > 0 ? (
                  <RadioGroup
                    options={contract.apiKeys.map((apiKey) => {
                      return {
                        label: apiKey.name,
                        value: String(apiKey.value),
                      };
                    })}
                    value={
                      contract.selectedApiKey ||
                      (contract.apiKeys && contract.apiKeys.length > 0
                        ? String(contract.apiKeys[0].value)
                        : "")
                    }
                    onChange={
                      readOnly
                        ? () => {}
                        : (value) => {
                            handleApiKeySelection(contractKey, value as string);
                          }
                    }
                    name={`apiKey-${contractKey}`}
                    disabled={readOnly}
                  />
                ) : contract.sourceUrl && !contract.isFetchingApiKeys ? (
                  <Typography variant="body" color="error" align="left">
                    No key : value pair found from the provided API, Please
                    enter valid API.
                  </Typography>
                ) : null}
              </div>
            </div>
          )}

          {/* API Keys Selection */}
          {/* {contract.sourceUrl && !contract.sourceUrlError && (
            <div className="space-y-auto mt-4">
              {contract.isFetchingApiKeys ? (
                <div className="flex items-center ml-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                  <Typography variant="body" color="secondary" className="pl-2">
                    Fetching API keys...
                  </Typography>
                </div>
              ) : contract.apiKeysError ? (
                <Typography variant="caption" color="error" align="left">
                  {contract.apiKeysError}
                </Typography>
              ) : contract.apiKeys && contract.apiKeys.length > 0 ? (
                <div className="space-y-2">
                  <RadioGroup
                    label="API Key"
                    options={contract.apiKeys.map((apiKey) => ({
                      label: apiKey.name,
                      value: String(apiKey.value),
                    }))}
                    value={contract.selectedApiKey || ""}
                    onChange={
                      readOnly
                        ? () => {}
                        : (value) =>
                            handleApiKeySelection(contractKey, String(value))
                    }
                    name={`apiKey-${contractKey}`}
                    disabled={readOnly}
                  />
                </div>
              ) : contract.sourceUrl && !contract.isFetchingApiKeys ? (
                <Typography variant="caption" color="secondary" align="left">
                  No API keys found from the provided URL.
                </Typography>
              ) : null}
            </div>
          )} */}

          {/* Condition Type Field */}
          <div id={`contract-condition-type-${contractKey}`}>
            <Dropdown
              label="Condition Type"
              options={conditionTypeOptions}
              selectedOption={
                contract.conditionType
                  ? conditionTypeOptions.find(
                      (opt) => opt.id === contract.conditionType,
                    )?.name || "Select a condition type"
                  : "Select a condition type"
              }
              onChange={
                readOnly
                  ? () => {}
                  : (option) => {
                      handleConditionTypeChange(
                        contractKey,
                        option.id as string,
                      );
                      if (option.id !== "between") {
                        handleLowerLimitChange(contractKey, "0");
                      }
                      setContractErrors((prev) => ({
                        ...prev,
                        [`${contractKey}ConditionType`]: null,
                      }));
                    }
              }
              disabled={readOnly}
            />
            <FormErrorMessage
              error={conditionTypeError ?? null}
              className="mb-1"
            />
          </div>

          {/* Limits/Value Fields */}
          {contract.conditionType && (
            <>
              {contract.conditionType === "between" ? (
                <div className="space-y-auto">
                  <div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6"
                    id={`contract-limits-section-${contractKey}`}
                  >
                    <label className="block text-sm sm:text-base font-medium text-gray-300 text-nowrap">
                      Limits
                    </label>
                    <div className="flex gap-4 w-full md:w-[70%]">
                      <div className="flex-1 flex-col">
                        <label
                          htmlFor="upperLimit"
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Upper Limit
                        </label>
                        <TextInput
                          type="number"
                          value={contract.upperLimit || ""}
                          onChange={
                            readOnly
                              ? () => {}
                              : (value) => {
                                  handleUpperLimitChange(contractKey, value);
                                  setContractErrors((prev) => ({
                                    ...prev,
                                    [`${contractKey}Limits`]: null,
                                  }));
                                }
                          }
                          placeholder="Enter upper limit"
                          disabled={readOnly}
                        />
                      </div>
                      <div className="flex-1 flex-col">
                        <label
                          htmlFor="lowerLimit"
                          className="block text-xs text-gray-400 mb-1"
                        >
                          Lower Limit
                        </label>
                        <TextInput
                          type="number"
                          value={contract.lowerLimit || ""}
                          onChange={
                            readOnly
                              ? () => {}
                              : (value) => {
                                  handleLowerLimitChange(contractKey, value);
                                  setContractErrors((prev) => ({
                                    ...prev,
                                    [`${contractKey}Limits`]: null,
                                  }));
                                }
                          }
                          placeholder="Enter lower limit"
                          disabled={readOnly}
                        />
                      </div>
                    </div>
                  </div>
                  <FormErrorMessage
                    error={limitsError ?? null}
                    className="w-full md:w-[70%] ml-auto mt-2"
                  />
                </div>
              ) : (
                <div id={`contract-limits-section-${contractKey}`}>
                  <div id={`contract-limits-section-${contractKey}`}></div>
                  <TextInput
                    label="Value"
                    type="number"
                    value={contract.upperLimit || ""}
                    onChange={
                      readOnly
                        ? () => {}
                        : (value) => {
                            handleUpperLimitChange(contractKey, value);
                            setContractErrors((prev) => ({
                              ...prev,
                              [`${contractKey}Limits`]: null,
                            }));
                          }
                    }
                    placeholder="Enter value"
                    error={limitsError ?? null}
                    disabled={readOnly}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* IPFS Script Wizard */}
      {contract.argumentType === "dynamic" && (
        <IpfsScriptWizard
          isOpen={isIpfsWizardOpen}
          onClose={() => setIsIpfsWizardOpen(false)}
          onComplete={(url) => {
            handleIpfsCodeUrlChange(contractKey, url);
            setContractErrors((prev) => ({
              ...prev,
              [`${contractKey}Ipfs`]: null,
            }));
            setIsIpfsWizardOpen(false);
          }}
          isSafeMode={isSafeMode}
          selectedSafeWallet={selectedSafeWallet}
          targetFunction={contract.targetFunction || ""}
        />
      )}
    </div>
  );
};
