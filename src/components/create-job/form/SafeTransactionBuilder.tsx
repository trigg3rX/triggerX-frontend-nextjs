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
import { useAccount, useChainId } from "wagmi";
import { getRpcUrl } from "@/utils/contractAddresses";

interface SafeTransactionBuilderProps {
  transactions: SafeTransaction[];
  onChange: (transactions: SafeTransaction[]) => void;
  selectedNetwork: string;
  error?: string | null;
  selectedSafeWallet?: string | null;
}

type AddressType = "contract" | "eoa" | "detecting";

const AAVE_POOL_PROXY_ADDRESSES = new Set(
  [
    "0xb50201558b00496a145fe76f7424749556e326d8", // OP Sepolia Pool proxy
  ].map((addr) => addr.toLowerCase()),
);

const MAX_UINT256_STRING = ethers.MaxUint256.toString();
const PLACEHOLDER_TX2_TOKEN_ADDRESS = "__TOKEN_TX2_ADDRESS__";
const PLACEHOLDER_CONNECTED_EOA = "__CONNECTED_EOA__";
// const PLACEHOLDER_SAFE_WETH_BALANCE = "__SAFE_WETH_BALANCE__";
// WETH address on OP Sepolia (and other chains)
const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

// Helper to check if a parameter is likely an amount (should be converted from ETH to wei)
const isAmountParameter = (input: { name?: string; type: string }): boolean => {
  const name = (input.name || "").toLowerCase();
  const type = input.type.toLowerCase();
  // Check if it's a uint256/uint128/etc and has amount-related names
  return (
    (type.startsWith("uint") || type.startsWith("int")) &&
    (name.includes("amount") ||
      name.includes("value") ||
      name.includes("quantity") ||
      name.includes("supply") ||
      name.includes("deposit"))
  );
};

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
  selectedSafeWallet,
}) => {
  const { address: connectedEOA } = useAccount();
  const chainId = useChainId();
  // Track state for each transaction
  const [transactionStates, setTransactionStates] = useState<
    Record<number, TransactionState>
  >({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    index: number | null;
  }>({ open: false, index: null });

  const getTxIndexBySignature = useCallback(
    (signaturePrefix: string) => {
      const lowerPrefix = signaturePrefix.toLowerCase();
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        const state = transactionStates[i];
        const signature = (
          state?.selectedFunction ||
          tx.defaultFunctionSignature ||
          ""
        ).toLowerCase();
        if (signature.startsWith(lowerPrefix)) {
          return i;
        }
      }
      return -1;
    },
    [transactions, transactionStates],
  );

  const getApprovalAddress = useCallback(() => {
    const idx = getTxIndexBySignature("approve(");
    if (idx === -1) return "";
    return transactions[idx]?.to || "";
  }, [getTxIndexBySignature, transactions]);

  const getSupplyAddress = useCallback(() => {
    const idx = getTxIndexBySignature("supply(");
    if (idx === -1) return "";
    return transactions[idx]?.to || "";
  }, [getTxIndexBySignature, transactions]);

  const resolveDefaultValue = useCallback(
    (value: string) => {
      if (value === PLACEHOLDER_TX2_TOKEN_ADDRESS) {
        return getApprovalAddress();
      }
      if (value === PLACEHOLDER_CONNECTED_EOA) {
        return connectedEOA || "";
      }
      return value;
    },
    [getApprovalAddress, connectedEOA],
  );

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

            // If it's an amount parameter and the value is in wei, convert to ETH for display
            if (input && isAmountParameter(input)) {
              try {
                // Check if it's a valid wei value (large number)
                const weiValue = BigInt(resolvedValue);
                // If it's a reasonable wei value (not a placeholder), convert to ETH
                if (weiValue > BigInt(0) && weiValue < ethers.MaxUint256) {
                  nextInputs[idx] = ethers.formatEther(weiValue);
                } else {
                  nextInputs[idx] = resolvedValue;
                }
              } catch {
                // If parsing fails, use as-is
                nextInputs[idx] = resolvedValue;
              }
            } else {
              nextInputs[idx] = resolvedValue;
            }
          }
        });
      }

      if (
        selectedFunc.name.toLowerCase() === "approve" &&
        selectedFunc.inputs.length >= 2
      ) {
        if (!nextInputs[0]) {
          nextInputs[0] = getSupplyAddress();
        }
        // For approve amount, keep MAX_UINT256 as is (not an amount in ETH sense)
        nextInputs[1] = MAX_UINT256_STRING;
      }

      if (
        selectedFunc.name.toLowerCase() === "supply" &&
        selectedFunc.inputs.length >= 1
      ) {
        if (!nextInputs[0]) {
          nextInputs[0] = getApprovalAddress();
        }
      }

      return nextInputs;
    },
    [resolveDefaultValue, getSupplyAddress, getApprovalAddress],
  );
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
          defaultApplied: false,
        };
      }
    });
    if (Object.keys(newStates).length > 0) {
      setTransactionStates((prev) => ({ ...prev, ...newStates }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]);

  // Re-detect address types for existing transactions when component mounts or transactions change
  useEffect(() => {
    transactions.forEach((transaction, index) => {
      const state = transactionStates[index];
      // Re-detect if we have an address but state hasn't been initialized properly
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
        defaultApplied: false,
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
  const updateTransaction = useCallback(
    (index: number, updates: Partial<SafeTransaction>) => {
      const newTransactions = [...transactions];
      newTransactions[index] = { ...newTransactions[index], ...updates };
      onChange(newTransactions);
    },
    [transactions, onChange],
  );

  // Handle address change with auto-detection
  const handleAddressChange = (index: number, value: string) => {
    const previousAddress = transactions[index]?.to;

    updateTransaction(index, { to: value });

    // Only reset and re-detect if the address actually changed
    if (value !== previousAddress) {
      if (value && ethers.isAddress(value)) {
        // Reset state and trigger new detection
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
        // Reset state when address is cleared
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

      // Convert ParsedFunction to proper ABI format if needed
      let abiSource = state?.abi || state?.manualABI;
      if (!abiSource) {
        // Create a proper ABI item from ParsedFunction
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
            // If it's an amount parameter, convert ETH to wei
            if (isAmountParameter(input)) {
              try {
                const ethValue = argValue.trim();
                if (ethValue === "" || ethValue === ".") {
                  return; // Invalid input
                }
                // Check if the value looks like ETH (has decimal point or is small number)
                // vs wei (very large number without decimal)
                const hasDecimal = ethValue.includes(".");
                const numValue = parseFloat(ethValue);

                // If it has a decimal point or is a reasonable ETH amount (< 1e12), treat as ETH
                if (
                  hasDecimal ||
                  (!isNaN(numValue) && numValue < 1e12 && numValue > 0)
                ) {
                  parsedValue = ethers.parseEther(ethValue);
                } else {
                  // Otherwise, treat as wei (for backwards compatibility with large numbers)
                  parsedValue = BigInt(argValue);
                }
              } catch (err) {
                // If parsing fails, try as wei (for backwards compatibility)
                try {
                  parsedValue = BigInt(argValue);
                } catch {
                  devLog(
                    `[encodeContractCallWithArgs] Failed to parse amount parameter ${i}:`,
                    err,
                  );
                  return;
                }
              }
            } else {
              // Not an amount parameter, parse as regular number
              parsedValue = BigInt(argValue);
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

        // Use full function signature to avoid ambiguity with overloaded functions
        const functionSignature = getFunctionSignature(
          parsedFunction.name,
          parsedFunction.inputs,
        );
        // Get the function fragment first, then encode it
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

        // Ensure data is properly formatted (should already have 0x prefix from ethers)
        if (!encodedData || typeof encodedData !== "string") {
          devLog(
            "[encodeContractCallWithArgs] Invalid encoded data:",
            encodedData,
          );
          return;
        }

        // Normalize data to ensure it has 0x prefix
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
        // On error, set data to empty to prevent invalid state
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
      let signature: string | undefined = tx.defaultFunctionSignature;

      if (signature) {
        targetFunc = findFunctionBySignature(availableFunctions, signature);
      }

      if (!targetFunc) {
        const normalizedTo = tx.to?.toLowerCase() || "";
        if (normalizedTo && AAVE_POOL_PROXY_ADDRESSES.has(normalizedTo)) {
          targetFunc = availableFunctions.find(
            (func) =>
              func.name === "supply" &&
              func.inputs.length >= 4 &&
              func.inputs[0].type === "address",
          );
          if (targetFunc) {
            signature = getFunctionSignature(
              targetFunc.name,
              targetFunc.inputs,
            );
          }
        }
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

  useEffect(() => {
    const approvalAddress = getApprovalAddress();
    const supplyIndex = getTxIndexBySignature("supply(");

    if (supplyIndex === -1) return;

    const supplyState = transactionStates[supplyIndex];
    if (
      !approvalAddress ||
      !supplyState ||
      !supplyState.defaultApplied ||
      !supplyState.selectedFunction ||
      !supplyState.functions ||
      !supplyState.selectedFunction.startsWith("supply(")
    ) {
      return;
    }

    if (supplyState.functionInputs[0] === approvalAddress) {
      return;
    }

    const selectedFunc = findFunctionBySignature(
      supplyState.functions,
      supplyState.selectedFunction,
    );

    if (!selectedFunc) return;

    const updatedInputs = [...supplyState.functionInputs];
    updatedInputs[0] = approvalAddress;

    updateState(supplyIndex, { functionInputs: updatedInputs });
    encodeContractCallWithArgs(supplyIndex, selectedFunc, updatedInputs);
  }, [
    getApprovalAddress,
    getTxIndexBySignature,
    transactionStates,
    updateState,
    encodeContractCallWithArgs,
  ]);

  // Fetch the ABI for the contract
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
          // Use the common utility to extract functions
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
    [selectedNetwork, fetchABI, updateState],
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

      maybeApplyDefaultFunction(index, functions);
    } catch {
      updateState(index, {
        manualABI: abiString,
      });
    }
  };

  // Fetch WETH balance when Safe wallet is selected and update approve transaction
  useEffect(() => {
    const fetchAndUpdateWETHBalance = async () => {
      if (!selectedSafeWallet) return;

      // Find the approve transaction for WETH
      const approveTxIndex = transactions.findIndex(
        (tx) =>
          tx.to?.toLowerCase() === WETH_ADDRESS.toLowerCase() &&
          (tx.defaultFunctionSignature?.toLowerCase().includes("approve") ||
            transactionStates[transactions.indexOf(tx)]?.selectedFunction
              ?.toLowerCase()
              .includes("approve")),
      );

      if (approveTxIndex === -1) return;

      const approveTx = transactions[approveTxIndex];
      const state = transactionStates[approveTxIndex];

      // Check if this is an approve transaction
      const isApprove =
        approveTx.defaultFunctionSignature?.toLowerCase().includes("approve") ||
        state?.selectedFunction?.toLowerCase().includes("approve");

      if (!isApprove) return;

      try {
        const rpcUrl = getRpcUrl(chainId);
        if (!rpcUrl) {
          devLog("[SafeTransactionBuilder] No RPC URL for chain", chainId);
          return;
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wethContract = new ethers.Contract(
          WETH_ADDRESS,
          [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)",
          ],
          provider,
        );

        // Fetch balance and decimals
        const [balance, decimals] = await Promise.all([
          wethContract.balanceOf(selectedSafeWallet),
          wethContract.decimals().catch(() => 18), // Default to 18 if decimals() fails
        ]);

        // Convert balance to human-readable format (ETH or token units)
        const balanceFormatted = ethers.formatUnits(balance, decimals);
        const balanceString = balance.toString(); // Keep wei for defaultArgumentValues

        devLog(
          "[SafeTransactionBuilder] Fetched WETH balance:",
          balanceString,
          "wei =",
          balanceFormatted,
          "ETH for Safe:",
          selectedSafeWallet,
        );

        // Update the transaction's defaultArgumentValues if it exists
        // Store in ETH format so it displays correctly
        if (
          approveTx.defaultArgumentValues &&
          approveTx.defaultArgumentValues.length >= 2
        ) {
          const updatedTransactions = [...transactions];
          updatedTransactions[approveTxIndex] = {
            ...approveTx,
            defaultArgumentValues: [
              approveTx.defaultArgumentValues[0],
              balanceFormatted, // Store in ETH format
            ],
          };

          // Also update the function input if the transaction is already initialized
          if (state?.selectedFunction && state.functionInputs.length >= 2) {
            const updatedInputs = [...state.functionInputs];
            updatedInputs[1] = balanceFormatted; // Display in ETH format
            updateState(approveTxIndex, { functionInputs: updatedInputs });

            // Re-encode the transaction with the new balance
            // The encoding function will convert ETH to wei automatically
            const selectedFunc = findFunctionBySignature(
              state.functions,
              state.selectedFunction,
            );
            if (selectedFunc) {
              encodeContractCallWithArgs(
                approveTxIndex,
                selectedFunc,
                updatedInputs,
              );
            }
          }

          onChange(updatedTransactions);
        }
      } catch (error) {
        devLog("[SafeTransactionBuilder] Failed to fetch WETH balance:", error);
      }
    };

    fetchAndUpdateWETHBalance();
  }, [
    selectedSafeWallet,
    chainId,
    transactions,
    transactionStates,
    onChange,
    updateState,
    encodeContractCallWithArgs,
  ]);

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

    // Encode immediately using the latest inputs to avoid state update lag
    if (state.selectedFunction) {
      const selectedFunc = findFunctionBySignature(
        state.functions,
        state.selectedFunction,
      );

      if (selectedFunc) {
        encodeContractCallWithArgs(index, selectedFunc, newInputs);
      }
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
    <div className="space-y-6" id="safe-transactions-section">
      {/* Title Section */}
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
                  {/* Transaction Header */}
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
                            handleAddressChange(index, value)
                          }
                          placeholder="0x..."
                          type="text"
                          className="w-full"
                        />
                      </div>

                      {/* Contract Mode */}
                      {state.addressType === "contract" && (
                        <>
                          {/* ABI Status Display */}
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

                          {/* Manual ABI Input */}
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
                                      // Clear function selection
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

                              {/* Function Arguments is kept in grid of 2 columns, does not like other inputs in the form*/}
                              {/* Function Parameters */}
                              {state.selectedFunction &&
                                (() => {
                                  const selectedFunc = findFunctionBySignature(
                                    state.functions,
                                    state.selectedFunction,
                                  );
                                  return selectedFunc?.inputs.map(
                                    (input, paramIndex) => {
                                      const isAmount = isAmountParameter(input);
                                      return (
                                        <div key={paramIndex}>
                                          <TextInput
                                            label={`${
                                              input.name ||
                                              `Param ${paramIndex + 1}`
                                            } (${input.type})`}
                                            value={
                                              state.functionInputs[
                                                paramIndex
                                              ] || ""
                                            }
                                            onChange={(value) =>
                                              handleParameterChange(
                                                index,
                                                paramIndex,
                                                value,
                                              )
                                            }
                                            placeholder={
                                              isAmount
                                                ? "Enter amount"
                                                : `Enter ${input.type}`
                                            }
                                            type="text"
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

                      {/* Value - Common for both EOA and Contract */}
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

          {/* Add Transaction Button */}
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
