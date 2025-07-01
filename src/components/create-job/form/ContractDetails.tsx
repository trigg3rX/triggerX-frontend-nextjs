import { useJobFormContext } from "@/hooks/useJobFormContext";
import { TextInput } from "../../ui/TextInput";
import { Typography } from "../../ui/Typography";
import { Dropdown, DropdownOption } from "../../ui/Dropdown";
import React from "react";
import { FunctionInput } from "@/types/job";
import { RadioGroup } from "../../ui/RadioGroup";
import { ErrorMessage } from "../../common/ErrorMessage";

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
}: ContractDetailsProps) => {
  const {
    jobType,
    setContractErrors,
    contractInteractions,
    handleContractAddressChange,
    handleManualABIChange,
    handleEventChange,
    handleFunctionChange,
    handleArgumentTypeChange,
    handleArgumentValueChange,
    handleIpfsCodeUrlChange,
    handleSourceTypeChange,
    handleSourceUrlChange,
    handleConditionTypeChange,
    handleLowerLimitChange,
    handleUpperLimitChange,
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
    sourceType: "API",
  };

  const isEventContract = contractKey === "eventContract";

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

  const isDisabled = contract.argumentType === "dynamic";
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
  const selectedArgumentType =
    argumentTypeOptions.find(
      (opt) => opt.id === (contract.argumentType || "static"),
    )?.name || "Static";

  const conditionTypeOptions: DropdownOption[] = [
    { id: "Equals to", name: "Equals to" },
    { id: "Not Equals to", name: "Not Equals to" },
    { id: "Less Than", name: "Less Than" },
    { id: "Greater Than", name: "Greater Than" },
    { id: "In Range", name: "In Range" },
    { id: "Less Than or Equals to", name: "Less Than or Equals to" },
    { id: "Greater Than or Equals to", name: "Greater Than or Equals to" },
  ];

  const handleChange = (value: string) => {
    handleContractAddressChange(contractKey, value);
    if (value.trim() !== "") {
      setContractErrors((prev) => ({ ...prev, [contractKey]: null }));
    }
  };

  const targetDropdownId = `${contractKey}-target-dropdown`;

  return (
    <div className="space-y-6">
      <TextInput
        label={label}
        value={contract.address}
        onChange={handleChange}
        placeholder="Contract address"
        type="text"
        id={`contract-address-input-${contractKey}`}
        error={error ?? null}
      />

      {contract.address && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <Typography variant="h4" color="secondary" className="text-nowrap">
            Contract ABI
          </Typography>
          <div className="w-[70%] text-start ml-3">
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

      {contract.address && !contract.abi && !contract.isCheckingABI && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <Typography variant="h4" color="secondary" className="text-nowrap">
            Manual ABI Input
          </Typography>
          <div className="w-full md:w-[70%]">
            <textarea
              id={`manualEventABI-${contractKey}`}
              value={contract.manualABI}
              onChange={(e) =>
                handleManualABIChange(contractKey, e.target.value)
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
            />
            <ErrorMessage error={abiError ?? null} className="mt-1" />
            <Typography
              variant="caption"
              align="left"
              color="secondary"
              className="mt-1"
            >
              Enter the contract ABI in JSON format if automatic fetch fails
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
                onChange={(option) => {
                  handleEventChange(contractKey, option.name);
                  setContractErrors((prev) => ({
                    ...prev,
                    [`${contractKey}Target`]: null,
                  }));
                }}
                className="[&_p]:break-all [&_p]:text-left [&_p]:w-[90%]"
              />
              <ErrorMessage
                error={targetError ?? null}
                className="mt-1 w-full md:w-[70%] ml-auto"
              />
            </div>
          ) : (
            <div id={targetDropdownId}>
              <Dropdown
                label="Target function"
                options={functionOptions}
                selectedOption={contract.targetFunction || "Select a function"}
                onChange={(option) => {
                  handleFunctionChange(contractKey, option.name);
                  setContractErrors((prev) => ({
                    ...prev,
                    [`${contractKey}Target`]: null,
                  }));
                }}
                className="[&_p]:break-all [&_p]:text-left [&_p]:w-[90%]"
              />
              <ErrorMessage
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
          <>
            <Dropdown
              label="Argument Type"
              options={argumentTypeOptions}
              selectedOption={selectedArgumentType}
              onChange={(option) =>
                handleArgumentTypeChange(
                  contractKey,
                  option.name.toLowerCase() as "static" | "dynamic",
                )
              }
            />

            <Typography
              variant="caption"
              align="left"
              color="secondary"
              className="w-full md:w-[70%] ml-auto mt-2"
            >
              {hasArguments
                ? "Select how function arguments should be handled during execution"
                : "No arguments required for this function"}
            </Typography>
          </>

          {/* Function Arguments Section */}
          {contract.targetFunction && functionInputs.length > 0 && (
            <div
              className="space-y-4 mt-6"
              id={`contract-args-section-${contractKey}`}
            >
              <div className="flex justify-between flex-col lg:flex-row md:flex-row">
                <Typography
                  as="label"
                  variant="h3"
                  color="primary"
                  className="text-nowrap text-left"
                >
                  Function Arguments
                </Typography>
                {isDisabled && (
                  <span className="text-sm text-yellow-400 lg:mb-6 m-3">
                    Arguments disabled for dynamic type
                  </span>
                )}
              </div>
              <ErrorMessage error={argsError ?? null} className="mb-2" />
              {!isDisabled &&
                functionInputs.map((input, index) => (
                  <div key={index}>
                    <TextInput
                      label={`${getInputName(input, index)} (${input.type})`}
                      value={contract.argumentValues?.[index] || ""}
                      onChange={(value) => {
                        handleArgumentValueChange(contractKey, index, value);
                        setContractErrors((prev) => ({
                          ...prev,
                          [`${contractKey}Args`]: null,
                        }));
                      }}
                      placeholder={`Enter ${input.type}`}
                      type="text"
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
          <TextInput
            label="IPFS Code URL"
            value={contract.ipfsCodeUrl || ""}
            onChange={(value) => {
              handleIpfsCodeUrlChange(contractKey, value);
              setContractErrors((prev) => ({
                ...prev,
                [`${contractKey}Ipfs`]: null,
              }));
            }}
            placeholder="Enter IPFS URL or CID (e.g., ipfs://... or https://ipfs.io/ipfs/...)"
            error={ipfsError ?? null}
            type="text"
            id={`contract-ipfs-code-url-${contractKey}`}
          />
          <div className="w-full md:w-[70%] ml-auto mt-3 flex flex-wrap gap-2">
            <ErrorMessage error={ipfsError ?? null} className="mb-1" />
            {contract.ipfsCodeUrlError && (
              <Typography variant="caption" color="error" align="left">
                {contract.ipfsCodeUrlError}
              </Typography>
            )}
            <Typography variant="caption" color="secondary" align="left">
              Provide an IPFS URL or CID, where your code is stored.
            </Typography>
          </div>
        </div>
      )}

      {jobType === 2 && (
        <>
          {/* Source Type Field */}
          <RadioGroup
            label="Source Type"
            options={[
              { label: "API", value: "API" },
              { label: "WebSocket", value: "WebSocket" },
              { label: "Oracle", value: "Oracle", disabled: true },
            ]}
            value={contract.sourceType || "API"}
            onChange={(value) =>
              handleSourceTypeChange(contractKey, value as string)
            }
            name={`sourceType-${contractKey}`}
          />

          {/* Source URL Field */}
          {contract.sourceType && (
            <div className="space-y-auto">
              <TextInput
                label="Source URL"
                value={contract.sourceUrl || ""}
                onChange={(value) => {
                  handleSourceUrlChange(contractKey, value);
                  setContractErrors((prev) => ({
                    ...prev,
                    [`${contractKey}SourceUrl`]: null,
                  }));
                }}
                placeholder={`Enter ${contract.sourceType.toLowerCase()} URL`}
                error={sourceUrlError ?? null}
                type="text"
                id={`contract-source-url-${contractKey}`}
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

          {/* Condition Type Field */}
          <div id={`contract-condition-type-${contractKey}`}>
            <Dropdown
              label="Condition Type"
              options={conditionTypeOptions}
              selectedOption={
                contract.conditionType || "Select a condition type"
              }
              onChange={(option) => {
                handleConditionTypeChange(contractKey, option.name);
                if (option.name !== "In Range") {
                  handleLowerLimitChange(contractKey, "0");
                }
                setContractErrors((prev) => ({
                  ...prev,
                  [`${contractKey}ConditionType`]: null,
                }));
              }}
            />
            <ErrorMessage error={conditionTypeError ?? null} className="mb-1" />
          </div>

          {/* Limits/Value Fields */}
          {contract.conditionType && (
            <>
              {contract.conditionType === "In Range" ? (
                <div className="space-y-auto">
                  <div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-8"
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
                          onChange={(value) => {
                            handleUpperLimitChange(contractKey, value);
                            setContractErrors((prev) => ({
                              ...prev,
                              [`${contractKey}Limits`]: null,
                            }));
                          }}
                          placeholder="Enter upper limit"
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
                          onChange={(value) => {
                            handleLowerLimitChange(contractKey, value);
                            setContractErrors((prev) => ({
                              ...prev,
                              [`${contractKey}Limits`]: null,
                            }));
                          }}
                          placeholder="Enter lower limit"
                        />
                      </div>
                    </div>
                  </div>
                  <ErrorMessage
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
                    onChange={(value) => {
                      handleUpperLimitChange(contractKey, value);
                      setContractErrors((prev) => ({
                        ...prev,
                        [`${contractKey}Limits`]: null,
                      }));
                    }}
                    placeholder="Enter value"
                    error={limitsError ?? null}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
