"use client";

import React, { useState, useCallback, useEffect } from "react";
import { SafeTransaction } from "@/types/job";
import { Typography } from "@/components/ui/Typography";
import { TextInput } from "@/components/ui/TextInput";
import { Dropdown } from "@/components/ui/Dropdown";
import DeleteDialog from "@/components/common/DeleteDialog";
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

interface SafeTransactionBuilderProps {
  transactions: SafeTransaction[];
  onChange: (transactions: SafeTransaction[]) => void;
  selectedNetwork: string;
  error?: string | null;
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
}

export const SafeTransactionBuilder: React.FC<SafeTransactionBuilderProps> = ({
  transactions,
  onChange,
  selectedNetwork,
  error,
}) => {
  // Track state for each transaction
  const [transactionStates, setTransactionStates] = useState<
    Record<number, TransactionState>
  >({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({ open: false, index: null });

  // Initialize states for existing transactions
  useEffect(() => {
    const newStates: Record<number, TransactionState> = {};
    transactions.forEach((transaction, index) => {
      if (!transactionStates[index]) {
        newStates[index] = {
          expanded: index === 0, // First one expanded by default
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
        };
      }
    });
    if (Object.keys(newStates).length > 0) {
      setTransactionStates((prev) => ({ ...prev, ...newStates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  // Add a new transaction
  const addTransaction = () => {
    const newTransaction: SafeTransaction = {
      to: "",
      value: "0",
      data: "0x",
    };
    const newTransactions = [...transactions, newTransaction];
    onChange(newTransactions);

    // Initialize state for new transaction
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
      },
    }));
  };

  // Remove the transaction
  const removeTransaction = (index: number) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    onChange(newTransactions);

    // Clean up state
    const newStates = { ...transactionStates };
    delete newStates[index];
    // Reindex remaining states
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

  // Update the transaction
  const updateTransaction = (
    index: number,
    updates: Partial<SafeTransaction>,
  ) => {
    const newTransactions = [...transactions];
    newTransactions[index] = { ...newTransactions[index], ...updates };
    onChange(newTransactions);
  };

  // Toggle the expanded state for the transaction
  const toggleExpanded = (index: number) => {
    setTransactionStates((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        expanded: !prev[index]?.expanded,
      },
    }));
  };

  // Update the state for the transaction
  const updateState = (index: number, updates: Partial<TransactionState>) => {
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
      };

      return {
        ...prev,
        [index]: {
          ...currentState,
          ...updates,
        },
      };
    });
  };

  // Fetch the ABI for the contract
  const fetchABI = useCallback(
    async (address: string, index: number) => {
      if (!address || !ethers.isAddress(address)) {
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
          // Use the common utility to extract functions
          const functions = extractFunctions(abiResult);

          updateState(index, {
            abi: abiResult,
            functions,
            isCheckingABI: false,
          });
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
    [selectedNetwork],
  );

  // Detect the address type (contract or eoa)
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
        // On error, default to EOA but mark detection as failed
        updateState(index, {
          addressType: "eoa",
          detectedType: null, // null means detection failed
        });
      }
    },
    [selectedNetwork, fetchABI],
  );

  // Handle the manual ABI change
  const handleManualABI = (index: number, abiString: string) => {
    try {
      // Use the common utility to extract functions
      const functions = extractFunctions(abiString);

      updateState(index, {
        abi: abiString,
        manualABI: abiString,
        functions,
      });
    } catch {
      updateState(index, {
        manualABI: abiString,
      });
    }
  };

  const handleFunctionSelect = (index: number, functionSig: string) => {
    const state = transactionStates[index];
    if (!state) return;

    // Use the utility function to find the selected function
    const selectedFunc = findFunctionBySignature(state.functions, functionSig);

    if (selectedFunc) {
      updateState(index, {
        selectedFunction: functionSig,
        functionInputs: new Array(selectedFunc.inputs.length).fill(""),
        valueInput: "0",
      });
      updateTransaction(index, { value: "0" });
    }
  };

  // Handle the parameter change
  const handleParameterChange = (
    index: number,
    paramIndex: number,
    value: string,
  ) => {
    const state = transactionStates[index];
    if (!state) return;

    const newInputs = [...state.functionInputs];
    newInputs[paramIndex] = value;
    updateState(index, { functionInputs: newInputs });

    // Try to encode
    encodeContractCall(index);
  };

  // Encode the contract call
  const encodeContractCall = (index: number) => {
    const state = transactionStates[index];
    if (!state || !state.abi || !state.selectedFunction) return;

    try {
      const parsedABI =
        typeof state.abi === "string" ? JSON.parse(state.abi) : state.abi;
      const contractInterface = new ethers.Interface(parsedABI);

      // Use the utility function to find the selected function
      const selectedFunc = findFunctionBySignature(
        state.functions,
        state.selectedFunction,
      );

      if (!selectedFunc) return;

      // Parse arguments
      const parsedArgs: unknown[] = [];
      for (let i = 0; i < selectedFunc.inputs.length; i++) {
        const input = selectedFunc.inputs[i];
        const argValue = state.functionInputs[i] || "";

        if (!argValue) {
          // Don't update data if args are incomplete
          return;
        }

        let parsedValue: unknown = argValue;
        if (input.type.startsWith("uint") || input.type.startsWith("int")) {
          parsedValue = BigInt(argValue);
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

      const encodedData = contractInterface.encodeFunctionData(
        selectedFunc.name,
        parsedArgs,
      );

      updateTransaction(index, { data: encodedData });
    } catch (err) {
      devLog("[encodeContractCall] Error encoding:", err);
    }
  };

  // Handle the value change
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

  // Get the transaction summary
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
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex justify-between items-center">
        <Typography variant="h3" color="primary">
          Safe Transactions
        </Typography>
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
        <div className="w-full md:w-[30%]"></div>
        <div className="w-full md:w-[70%] space-y-4">
          {transactions.length === 0 && (
            <Typography variant="body" color="secondary" align="center">
              Click &quot;Add Transaction&quot; to begin.
            </Typography>
          )}

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
                transactions[index]?.value && transactions[index]?.value !== "0"
                  ? ethers.formatEther(transactions[index]?.value as string)
                  : "0",
            };

            return (
              <div
                key={index}
                className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
              >
                {/* Transaction Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors"
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
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

                {/* Transaction Fields */}
                {state.expanded && (
                  <div className="p-4 border-t border-white/10 space-y-4">
                    {/* Target Address */}
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
                          updateTransaction(index, { to: value })
                        }
                        onBlur={() => detectAddressType(tx.to, index)}
                        placeholder="0x..."
                        type="text"
                        className="w-full"
                      />
                    </div>

                    {/* EOA Mode */}
                    {state.addressType === "eoa" && (
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
                        />
                      </div>
                    )}

                    {/* Contract Mode */}
                    {state.addressType === "contract" && (
                      <>
                        {/* ABI Section */}
                        {state.isCheckingABI && (
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
                            <Typography variant="caption" color="secondary">
                              Fetching ABI...
                            </Typography>
                          </div>
                        )}

                        {/* Manual ABI / fallback */}
                        {!state.isCheckingABI &&
                          (!state.abi || state.functions.length === 0) && (
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
                                <textarea
                                  value={state.manualABI}
                                  onChange={(e) =>
                                    handleManualABI(index, e.target.value)
                                  }
                                  placeholder="Insert contract ABI here..."
                                  className="w-full h-32 p-2 border border-white/10 rounded-md bg-[var(--color-background)] text-[var(--color-text-primary)] font-mono text-sm"
                                />
                              </div>

                              <div>
                                <label className="block mb-2">
                                  <Typography
                                    variant="body"
                                    color="gray"
                                    align="left"
                                  >
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
                                  onChange={(value) =>
                                    handleValueChange(index, value)
                                  }
                                  placeholder="0.0"
                                  type="text"
                                  className="w-full "
                                  disabled={Boolean(state.selectedFunction)}
                                />
                              </div>
                            </>
                          )}

                        {/* ABI with functions available */}
                        {state.abi && state.functions.length > 0 && (
                          <>
                            {/* Function Selector */}
                            <div>
                              <label className="block mb-2">
                                <Typography
                                  variant="body"
                                  color="gray"
                                  align="left"
                                >
                                  Function
                                </Typography>
                              </label>
                              <Dropdown
                                label=""
                                color="secondary"
                                options={[
                                  { id: "", name: "ETH Transfer to Contract" },
                                  ...state.functions.map((f) => ({
                                    id: getFunctionSignature(f.name, f.inputs),
                                    name: f.name,
                                  })),
                                ]}
                                selectedOption={
                                  state.selectedFunction
                                    ? state.selectedFunction.split("(")[0]
                                    : "ETH Transfer to Contract"
                                }
                                className="w-full md:w-full"
                                onChange={(option) => {
                                  if (option.id === "") {
                                    // Clear function selection
                                    updateState(index, {
                                      selectedFunction: "",
                                      functionInputs: [],
                                    });
                                    updateTransaction(index, { data: "0x" });
                                  } else {
                                    handleFunctionSelect(
                                      index,
                                      String(option.id),
                                    );
                                  }
                                }}
                              />
                            </div>

                            {/* Function Parameters */}
                            {state.selectedFunction &&
                              (() => {
                                const selectedFunc = findFunctionBySignature(
                                  state.functions,
                                  state.selectedFunction,
                                );
                                return selectedFunc?.inputs.map(
                                  (input, paramIndex) => (
                                    <div key={paramIndex}>
                                      <label className="block mb-2">
                                        <Typography
                                          variant="body"
                                          color="gray"
                                          align="left"
                                        >
                                          {input.name ||
                                            `Param ${paramIndex + 1}`}{" "}
                                          ({input.type})
                                        </Typography>
                                      </label>
                                      <TextInput
                                        label=""
                                        value={
                                          state.functionInputs[paramIndex] || ""
                                        }
                                        onChange={(value) =>
                                          handleParameterChange(
                                            index,
                                            paramIndex,
                                            value,
                                          )
                                        }
                                        placeholder={`Enter ${input.type}`}
                                        type="text"
                                        className="w-full"
                                      />
                                    </div>
                                  ),
                                );
                              })()}

                            {/* Value input - always visible */}
                            <div>
                              <label className="block mb-2">
                                <Typography
                                  variant="body"
                                  color="gray"
                                  align="left"
                                >
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
                                onChange={(value) =>
                                  handleValueChange(index, value)
                                }
                                placeholder="0.0"
                                type="text"
                                className="w-full"
                                disabled={Boolean(state.selectedFunction)}
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Transaction Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-6">
        <div className="w-full md:w-[30%]"></div>
        <div className="w-full md:w-[70%]">
          <button
            onClick={addTransaction}
            className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/10 rounded-lg hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors"
          >
            <Plus className="w-5 h-5 text-[var(--color-primary)]" />
            <Typography variant="body" color="primary" className="font-medium">
              Add Transaction
            </Typography>
          </button>
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
