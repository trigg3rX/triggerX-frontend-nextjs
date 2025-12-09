"use client";

import React, { useState, useCallback, useEffect } from "react";
import { SafeTransaction } from "@/types/job";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import DeleteDialog from "@/components/common/DeleteDialog";
import { FormErrorMessage } from "@/components/common/FormErrorMessage";
import { ethers } from "ethers";
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { devLog } from "@/lib/devLog";
import { fetchContractABI } from "@/utils/fetchContractABI";
import networksData from "@/utils/networks.json";
import { detectAddressTypeHelper } from "@/utils/addressDetection";
import {
  extractFunctions,
  getFunctionSignature,
  findFunctionBySignature,
  type ParsedFunction,
} from "@/utils/abiUtils";
import {
  formatAaveInputForDisplay,
  parseAaveInputForEncoding,
  isAaveParameterDisabled,
  getAaveParameterPlaceholder,
} from "@/utils/aaveTransactionHelpers";

interface SafeTransactionBuilderProps {
  transactions: SafeTransaction[];
  onChange: (transactions: SafeTransaction[]) => void;
  selectedNetwork: string;
  error?: string | null;
  selectedSafeWallet?: string | null;
}

type AddressType = "contract" | "eoa" | "detecting";

interface TransactionState {
  expanded: boolean;
  addressType: AddressType;
  detectedType: AddressType | null;
  abi: string | null;
  manualABI: string;
  isCheckingABI: boolean;
  functions: ParsedFunction[];
  selectedFunction: string;
  functionInputs: string[];
  valueInput: string;
  defaultApplied: boolean;
}

export const SafeTransactionBuilder: React.FC<SafeTransactionBuilderProps> = ({
  transactions,
  onChange,
  selectedNetwork,
  error,
  selectedSafeWallet, // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const [transactionStates, setTransactionStates] = useState<
    Record<number, TransactionState>
  >({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({ open: false, index: null });

  const resolveDefaultValue = useCallback((value: string) => {
    return value;
  }, []);

  const computePrefilledInputs = useCallback(
    (
      index: number,
      selectedFunc: ParsedFunction,
      providedDefaults?: (string | undefined)[],
    ) => {
      const nextInputs = new Array(selectedFunc.inputs.length).fill("");

      if (providedDefaults && providedDefaults.length > 0) {
        providedDefaults.forEach((value, idx) => {
          if (value !== undefined && value !== null && value !== "") {
            const resolvedValue = resolveDefaultValue(value);
            const input = selectedFunc.inputs[idx];

            if (
              input?.type.startsWith("uint") ||
              input?.type.startsWith("int")
            ) {
              try {
                nextInputs[idx] = formatAaveInputForDisplay(
                  selectedFunc.name,
                  idx,
                  input.type,
                  resolvedValue,
                );
              } catch {
                nextInputs[idx] = resolvedValue;
              }
            } else {
              nextInputs[idx] = resolvedValue;
            }
          }
        });
      }
      return nextInputs;
    },
    [resolveDefaultValue],
  );
  useEffect(() => {
    const newStates: Record<number, TransactionState> = {};
    transactions.forEach((transaction, index) => {
      if (!transactionStates[index]) {
        newStates[index] = {
          expanded: index === 0,
          addressType: "eoa",
          detectedType: null,
          abi: null,
          manualABI: "",
          isCheckingABI: false,
          functions: [],
          selectedFunction: "",
          functionInputs: [],
          valueInput:
            transaction.value && transaction.value !== "0"
              ? ethers.formatEther(transaction.value)
              : "0",
          defaultApplied: false,
        };
      }
    });
    if (Object.keys(newStates).length > 0) {
      setTransactionStates((prev) => ({ ...prev, ...newStates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  useEffect(() => {
    transactions.forEach((transaction, index) => {
      const state = transactionStates[index];
      if (
        transaction.to &&
        ethers.isAddress(transaction.to) &&
        state &&
        !state.isCheckingABI &&
        state.addressType === "eoa" &&
        state.detectedType === null
      ) {
        detectAddressType(transaction.to, index);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, selectedNetwork, transactionStates]);

  const addTransaction = () => {
    const newTransaction: SafeTransaction = {
      to: "",
      value: "0",
      data: "0x",
    };
    const newTransactions = [...transactions, newTransaction];
    onChange(newTransactions);

    setTransactionStates((prev) => ({
      ...prev,
      [newTransactions.length - 1]: {
        expanded: true,
        addressType: "eoa",
        detectedType: null,
        abi: null,
        manualABI: "",
        isCheckingABI: false,
        functions: [],
        selectedFunction: "",
        functionInputs: [],
        valueInput: "0",
        defaultApplied: false,
      },
    }));
  };

  const removeTransaction = (index: number) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    onChange(newTransactions);

    const newStates = { ...transactionStates };
    delete newStates[index];
    const reindexedStates: Record<number, TransactionState> = {};
    Object.keys(newStates)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((oldIndex, newIndex) => {
        if (oldIndex > index) {
          reindexedStates[newIndex] = newStates[oldIndex];
        } else {
          reindexedStates[oldIndex] = newStates[oldIndex];
        }
      });
    setTransactionStates(reindexedStates);
  };

  const openDeleteDialog = (index: number) => {
    setDeleteDialog({ open: true, index });
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.index !== null) {
      removeTransaction(deleteDialog.index);
    }
    setDeleteDialog({ open: false, index: null });
  };

  const handleCancelDelete = () => {
    setDeleteDialog({ open: false, index: null });
  };

  const updateTransaction = useCallback(
    (index: number, updates: Partial<SafeTransaction>) => {
      const newTransactions = [...transactions];
      newTransactions[index] = { ...newTransactions[index], ...updates };
      onChange(newTransactions);
    },
    [transactions, onChange],
  );

  const handleAddressChange = (index: number, value: string) => {
    const previousAddress = transactions[index]?.to;

    updateTransaction(index, { to: value });

    if (value !== previousAddress) {
      if (value && ethers.isAddress(value)) {
        updateState(index, {
          addressType: "detecting",
          detectedType: null,
          abi: null,
          manualABI: "",
          isCheckingABI: false,
          functions: [],
          selectedFunction: "",
          functionInputs: [],
          defaultApplied: false,
        });
        detectAddressType(value, index);
      } else if (value === "") {
        updateState(index, {
          addressType: "eoa",
          detectedType: null,
          abi: null,
          manualABI: "",
          isCheckingABI: false,
          functions: [],
          selectedFunction: "",
          functionInputs: [],
          defaultApplied: false,
        });
      }
    }
  };

  const toggleExpanded = (index: number) => {
    setTransactionStates((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        expanded: !prev[index]?.expanded,
      },
    }));
  };

  const updateState = useCallback(
    (index: number, updates: Partial<TransactionState>) => {
      setTransactionStates((prev) => {
        const currentState = prev[index] || {
          expanded: false,
          addressType: "eoa" as AddressType,
          detectedType: null,
          abi: null,
          manualABI: "",
          isCheckingABI: false,
          functions: [],
          selectedFunction: "",
          functionInputs: [],
          valueInput: "0",
          defaultApplied: false,
        };

        return {
          ...prev,
          [index]: {
            ...currentState,
            ...updates,
          },
        };
      });
    },
    [],
  );

  const encodeContractCallWithArgs = useCallback(
    (index: number, parsedFunction: ParsedFunction, inputs: string[]) => {
      const state = transactionStates[index];

      let abiSource = state?.abi || state?.manualABI;
      if (!abiSource) {
        const abiItem = {
          type: "function",
          name: parsedFunction.name,
          inputs: parsedFunction.inputs.map((input) => ({
            name: input.name || "",
            type: input.type,
            internalType: input.internalType,
            components: input.components,
          })),
          outputs:
            parsedFunction.outputs?.map((output) => ({
              name: output.name || "",
              type: output.type,
              internalType: output.internalType,
              components: output.components,
            })) || [],
          stateMutability: parsedFunction.stateMutability || "nonpayable",
        };
        abiSource = JSON.stringify([abiItem]);
      }

      try {
        const parsedABI =
          typeof abiSource === "string" ? JSON.parse(abiSource) : abiSource;
        const contractInterface = new ethers.Interface(parsedABI);

        const parsedArgs: unknown[] = [];
        for (let i = 0; i < parsedFunction.inputs.length; i++) {
          const input = parsedFunction.inputs[i];
          const argValue = inputs[i];
          if (!argValue) {
            return;
          }

          let parsedValue: unknown = argValue;
          if (input.type.startsWith("uint") || input.type.startsWith("int")) {
            const trimmedValue = argValue.trim().toLowerCase();
            if (trimmedValue === "max") {
              parsedValue = ethers.MaxUint256;
            } else {
              try {
                parsedValue = parseAaveInputForEncoding(
                  parsedFunction.name,
                  i,
                  input.type,
                  argValue,
                );
              } catch (err) {
                try {
                  parsedValue = BigInt(argValue);
                } catch {
                  devLog(
                    `[encodeContractCallWithArgs] Failed to parse uint/int parameter ${i}:`,
                    err,
                  );
                  return;
                }
              }
            }
          } else if (input.type === "bool") {
            parsedValue = argValue.toLowerCase() === "true";
          } else if (input.type === "address") {
            parsedValue = argValue;
          } else if (input.type.startsWith("bytes")) {
            parsedValue = argValue;
          } else if (input.type === "string") {
            parsedValue = argValue;
          }

          parsedArgs.push(parsedValue);
        }

        const functionSignature = getFunctionSignature(
          parsedFunction.name,
          parsedFunction.inputs,
        );
        const functionFragment =
          contractInterface.getFunction(functionSignature);
        if (!functionFragment) {
          devLog(
            "[encodeContractCallWithArgs] Function not found:",
            functionSignature,
          );
          return;
        }
        const encodedData = contractInterface.encodeFunctionData(
          functionFragment,
          parsedArgs,
        );

        if (!encodedData || typeof encodedData !== "string") {
          devLog(
            "[encodeContractCallWithArgs] Invalid encoded data:",
            encodedData,
          );
          return;
        }

        const normalizedData = encodedData.startsWith("0x")
          ? encodedData
          : `0x${encodedData}`;

        devLog(
          `[encodeContractCallWithArgs] Encoded data for tx ${index}:`,
          normalizedData.substring(0, 66) +
            (normalizedData.length > 66 ? "..." : ""),
        );

        updateTransaction(index, { data: normalizedData });
      } catch (err) {
        devLog("[encodeContractCallWithArgs] Error encoding:", err);
        updateTransaction(index, { data: "0x" });
      }
    },
    [transactionStates, updateTransaction],
  );

  const handleFunctionSelect = useCallback(
    (
      index: number,
      functionSig: string,
      preselectedFunc?: ParsedFunction,
      providedInputs?: string[],
      markDefaultApplied = false,
    ) => {
      const state = transactionStates[index];
      if (!state && !preselectedFunc) return;

      const selectedFunc =
        preselectedFunc ||
        (state ? findFunctionBySignature(state.functions, functionSig) : null);

      if (!selectedFunc) return;

      const nextFunctionInputs = computePrefilledInputs(
        index,
        selectedFunc,
        providedInputs,
      );

      const shouldEncodeImmediately = selectedFunc.inputs.every(
        (_, idx) => !!nextFunctionInputs[idx],
      );

      const defaultAppliedValue = markDefaultApplied
        ? true
        : (state?.defaultApplied ?? false);

      updateState(index, {
        selectedFunction: functionSig,
        functionInputs: nextFunctionInputs,
        valueInput: "0",
        defaultApplied: defaultAppliedValue,
      });
      updateTransaction(index, { value: "0" });

      if (shouldEncodeImmediately) {
        encodeContractCallWithArgs(index, selectedFunc, nextFunctionInputs);
      } else {
        updateTransaction(index, { data: "0x" });
      }
    },
    [
      transactionStates,
      computePrefilledInputs,
      updateState,
      updateTransaction,
      encodeContractCallWithArgs,
    ],
  );

  const maybeApplyDefaultFunction = useCallback(
    (index: number, availableFunctions: ParsedFunction[]) => {
      const tx = transactions[index];
      if (!tx) return;

      const state = transactionStates[index];
      if (state?.defaultApplied) return;

      let targetFunc: ParsedFunction | undefined;
      const signature: string | undefined = tx.defaultFunctionSignature;

      if (signature) {
        targetFunc = findFunctionBySignature(availableFunctions, signature);
      }

      if (!targetFunc || !signature) return;

      const prefilledInputs = computePrefilledInputs(
        index,
        targetFunc,
        tx.defaultArgumentValues,
      );

      handleFunctionSelect(index, signature, targetFunc, prefilledInputs, true);
    },
    [
      transactions,
      transactionStates,
      computePrefilledInputs,
      handleFunctionSelect,
    ],
  );

  const loadDefaultAbi = useCallback(
    (index: number) => {
      const tx = transactions[index];
      const state = transactionStates[index];

      if (!tx?.defaultAbi) return false;
      if (state?.abi && state.functions.length > 0) return false;

      try {
        const abiString =
          typeof tx.defaultAbi === "string"
            ? tx.defaultAbi
            : JSON.stringify(tx.defaultAbi);
        const functions = extractFunctions(abiString);

        updateState(index, {
          abi: abiString,
          functions,
          isCheckingABI: false,
          addressType: "contract",
        });

        maybeApplyDefaultFunction(index, functions);
        return true;
      } catch (err) {
        devLog("[loadDefaultAbi] Failed to load default ABI", err);
        return false;
      }
    },
    [transactions, transactionStates, updateState, maybeApplyDefaultFunction],
  );

  useEffect(() => {
    transactions.forEach((_, index) => {
      loadDefaultAbi(index);
    });
  }, [transactions, loadDefaultAbi]);

  const fetchABI = useCallback(
    async (address: string, index: number) => {
      if (!address || !ethers.isAddress(address)) {
        return;
      }

      if (loadDefaultAbi(index)) {
        return;
      }

      updateState(index, { isCheckingABI: true });

      try {
        const network = networksData.supportedNetworks.find(
          (n) => n.name === selectedNetwork,
        );
        if (!network) {
          throw new Error("Network not found");
        }

        const chainId = network.id;
        devLog("[fetchABI] Fetching ABI for", address, "on chain", chainId);
        const abiResult = await fetchContractABI(address, chainId);

        if (abiResult && typeof abiResult === "string") {
          const functions = extractFunctions(abiResult);

          updateState(index, {
            abi: abiResult,
            functions,
            isCheckingABI: false,
          });

          maybeApplyDefaultFunction(index, functions);
        } else {
          updateState(index, {
            abi: null,
            functions: [],
            isCheckingABI: false,
          });
        }
      } catch (err) {
        devLog("[fetchABI] Error fetching ABI:", err);
        updateState(index, {
          abi: null,
          functions: [],
          isCheckingABI: false,
        });
      }
    },
    [selectedNetwork, updateState, maybeApplyDefaultFunction, loadDefaultAbi],
  );

  const detectAddressType = useCallback(
    async (address: string, index: number) => {
      if (!address || !ethers.isAddress(address)) {
        devLog("[detectAddressType] Invalid address:", address);
        return;
      }

      updateState(index, { addressType: "detecting" });

      try {
        const { addressType, detectedType, shouldFetchABI } =
          await detectAddressTypeHelper(address, selectedNetwork);

        updateState(index, {
          addressType,
          detectedType,
        });

        if (shouldFetchABI) {
          devLog("[detectAddressType] Fetching ABI for contract...");
          await fetchABI(address, index);
        }
      } catch (err) {
        devLog("[detectAddressType] Error detecting address type:", err);
        updateState(index, {
          addressType: "eoa",
          detectedType: null,
        });
      }
    },
    [selectedNetwork, fetchABI, updateState],
  );

  const handleManualABI = (index: number, abiString: string) => {
    try {
      const functions = extractFunctions(abiString);

      updateState(index, {
        abi: abiString,
        manualABI: abiString,
        functions,
      });

      maybeApplyDefaultFunction(index, functions);
    } catch {
      updateState(index, {
        manualABI: abiString,
      });
    }
  };

  const handleParameterChange = (
    index: number,
    paramIndex: number,
    value: string,
  ) => {
    const state = transactionStates[index];
    if (!state) return;

    const selectedFunc = state.selectedFunction
      ? findFunctionBySignature(state.functions, state.selectedFunction)
      : null;

    const newInputs = [...state.functionInputs];
    newInputs[paramIndex] = value;
    updateState(index, { functionInputs: newInputs });

    // Encode immediately using the latest inputs to avoid state update lag
    if (state.selectedFunction && selectedFunc) {
      encodeContractCallWithArgs(index, selectedFunc, newInputs);
    }
  };

  const handleValueChange = (index: number, valueInEth: string) => {
    updateState(index, { valueInput: valueInEth });

    const sanitizedValue = valueInEth.trim();

    if (sanitizedValue === "" || sanitizedValue === ".") {
      updateTransaction(index, { value: "0" });
      return;
    }

    try {
      const valueInWei = ethers.parseEther(sanitizedValue).toString();
      updateTransaction(index, { value: valueInWei });
    } catch (err) {
      devLog("[handleValueChange] Error parsing value:", err);
    }
  };

  const getTransactionSummary = (
    tx: SafeTransaction,
    state: TransactionState,
  ) => {
    if (!tx.to) return "No address set";

    if (state.addressType === "detecting") return "Detecting...";

    if (state.addressType === "contract") {
      if (state.selectedFunction) return "Contract Interaction";
      return "Contract ETH Transfer";
    }

    if (state.addressType === "eoa") {
      return "EOA Transfer";
    }

    return "Unknown";
  };

  return (
    <div className="space-y-6" id="safe-transactions-section">
      <div className="flex flex-col md:flex-row items-start justify-between gap-2 md:gap-6">
        <Typography variant="h3" color="primary">
          Safe Transactions
        </Typography>
        <div className="w-full md:w-[70%] ml-auto">
          <FormErrorMessage error={error ?? null} className="mb-1" />

          <div className="w-full">
            {transactions.map((tx, index) => {
              const state = transactionStates[index] || {
                expanded: false,
                addressType: "eoa" as AddressType,
                detectedType: null,
                abi: null,
                manualABI: "",
                isCheckingABI: false,
                functions: [],
                selectedFunction: "",
                functionInputs: [],
                valueInput:
                  transactions[index]?.value &&
                  transactions[index]?.value !== "0"
                    ? ethers.formatEther(transactions[index]?.value as string)
                    : "0",
              };

              return (
                <div
                  key={index}
                  className="border border-white/10 rounded-lg bg-white/5 mb-4"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 flex-1">
                      <Typography
                        variant="body"
                        color="primary"
                        className="font-medium"
                      >
                        Transaction {index + 1}
                      </Typography>
                      <Typography variant="caption" color="secondary">
                        {getTransactionSummary(tx, state)}
                      </Typography>
                    </div>
                    <div className="flex items-center gap-2">
                      {transactions.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openDeleteDialog(index);
                          }}
                          className="p-1 hover:bg-red-500/10 rounded transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                      {state.expanded ? (
                        <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />
                      )}
                    </div>
                  </div>

                  {state.expanded && (
                    <div className="p-4 border-t border-white/10 space-y-4">
                      <div>
                        <label className="block mb-2">
                          <Typography variant="body" color="gray" align="left">
                            Target Address
                          </Typography>
                        </label>
                        <TextInput
                          label=""
                          value={tx.to}
                          onChange={(value) =>
                            handleAddressChange(index, value)
                          }
                          placeholder="0x..."
                          type="text"
                          className="w-full"
                        />
                      </div>

                      {state.addressType === "contract" && (
                        <>
                          <div>
                            <label className="block mb-2">
                              <Typography
                                variant="body"
                                color="gray"
                                align="left"
                              >
                                Contract ABI
                              </Typography>
                            </label>
                            <div className="flex items-center min-h-[50px]">
                              {state.isCheckingABI ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
                                  <Typography
                                    variant="caption"
                                    color="secondary"
                                    className="pl-2"
                                  >
                                    Validating Contract...
                                  </Typography>
                                </div>
                              ) : state.abi ? (
                                <div className="flex items-center">
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
                                  <Typography
                                    variant="caption"
                                    color="secondary"
                                    className="pl-2"
                                  >
                                    ABI Verified
                                  </Typography>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <Typography
                                    variant="caption"
                                    color="error"
                                    className="pr-2"
                                  >
                                    ✕
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="secondary"
                                  >
                                    Not Available
                                  </Typography>
                                </div>
                              )}
                            </div>
                          </div>

                          {!state.isCheckingABI &&
                            (!state.abi || state.functions.length === 0) && (
                              <div>
                                <label className="block mb-2">
                                  <Typography
                                    variant="body"
                                    color="gray"
                                    align="left"
                                  >
                                    Manual ABI Input
                                  </Typography>
                                </label>
                                <textarea
                                  value={state.manualABI}
                                  onChange={(e) =>
                                    handleManualABI(index, e.target.value)
                                  }
                                  placeholder={`[
  {
    "inputs": [],
    "name": "functionName",
    "type": "function",
    "stateMutability": "nonpayable"
  }
]`}
                                  className="text-xs w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none min-h-[170px]"
                                />
                                <Typography
                                  variant="caption"
                                  align="left"
                                  color="secondary"
                                  className="mt-1"
                                >
                                  Automatic fetch failed. To continue, please
                                  enter the contract ABI in JSON format.
                                </Typography>
                              </div>
                            )}

                          {state.abi && state.functions.length > 0 && (
                            <>
                              <div>
                                <label className="block mb-2">
                                  <Typography
                                    variant="body"
                                    color="gray"
                                    align="left"
                                  >
                                    Target function
                                  </Typography>
                                </label>
                                <Dropdown
                                  label=""
                                  color="secondary"
                                  options={[
                                    {
                                      id: "",
                                      name: "ETH Transfer to Contract",
                                    },
                                    ...state.functions.map((f) => ({
                                      id: getFunctionSignature(
                                        f.name,
                                        f.inputs,
                                      ),
                                      name: f.name,
                                    })),
                                  ]}
                                  selectedOption={
                                    state.selectedFunction
                                      ? state.selectedFunction.split("(")[0]
                                      : "ETH Transfer to Contract"
                                  }
                                  className="!w-full"
                                  onChange={(option) => {
                                    if (option.id === "") {
                                      updateState(index, {
                                        selectedFunction: "",
                                        functionInputs: [],
                                      });
                                      updateTransaction(index, {
                                        data: "0x",
                                      });
                                    } else {
                                      handleFunctionSelect(
                                        index,
                                        String(option.id),
                                      );
                                    }
                                  }}
                                />
                              </div>

                              {state.selectedFunction &&
                                (() => {
                                  const selectedFunc = findFunctionBySignature(
                                    state.functions,
                                    state.selectedFunction,
                                  );
                                  return selectedFunc?.inputs.map(
                                    (input, paramIndex) => {
                                      const isDisabled =
                                        isAaveParameterDisabled(
                                          selectedFunc.name,
                                          paramIndex,
                                          input.type,
                                        );
                                      const displayValue =
                                        formatAaveInputForDisplay(
                                          selectedFunc.name,
                                          paramIndex,
                                          input.type,
                                          state.functionInputs[paramIndex] ||
                                            "",
                                        );

                                      return (
                                        <div key={paramIndex}>
                                          <TextInput
                                            label={`${
                                              input.name ||
                                              `Param ${paramIndex + 1}`
                                            } (${input.type})`}
                                            value={displayValue}
                                            onChange={(value) =>
                                              handleParameterChange(
                                                index,
                                                paramIndex,
                                                value,
                                              )
                                            }
                                            placeholder={getAaveParameterPlaceholder(
                                              selectedFunc.name,
                                              paramIndex,
                                              input.type,
                                            )}
                                            type="text"
                                            disabled={isDisabled}
                                          />
                                        </div>
                                      );
                                    },
                                  );
                                })()}
                            </>
                          )}
                        </>
                      )}

                      <div>
                        <label className="block mb-2">
                          <Typography variant="body" color="gray" align="left">
                            Value
                          </Typography>
                        </label>
                        <TextInput
                          label=""
                          value={
                            state.valueInput ??
                            (tx.value === "0"
                              ? "0"
                              : ethers.formatEther(tx.value || "0"))
                          }
                          onChange={(value) => handleValueChange(index, value)}
                          placeholder="0.0"
                          type="text"
                          className="w-full"
                          disabled={Boolean(state.selectedFunction)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="w-full">
            <button
              onClick={(e) => {
                e.preventDefault();
                addTransaction();
              }}
              className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/10 rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors"
            >
              <Plus className="w-5 h-5 text-[var(--color-primary)]" />
              <Typography
                variant="body"
                color="primary"
                className="font-medium"
              >
                Add Transaction
              </Typography>
            </button>
          </div>
        </div>
      </div>

      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({
            open,
            index: open ? prev.index : null,
          }))
        }
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
