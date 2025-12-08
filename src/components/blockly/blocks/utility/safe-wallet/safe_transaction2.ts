import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";
import { getRpcUrl } from "@/utils/contractAddresses";

// Helper function to extract functions from ABI
const extractFunctions = (abi: string) => {
  try {
    const parsedABI = JSON.parse(abi);
    return parsedABI.filter(
      (item: { type: string; stateMutability?: string }) =>
        item.type === "function" &&
        (item.stateMutability === "nonpayable" ||
          item.stateMutability === "payable"),
    );
  } catch (error) {
    console.error("Error parsing ABI:", error);
    return [];
  }
};

// Helper function to format function signature
const formatFunctionSignature = (
  name: string,
  inputs: { type: string; name: string }[],
) => `${name}(${inputs.map((input) => input.type).join(",")})`;

// Helper function to force dropdown field to update its display
const forceDropdownUpdate = (field: Blockly.Field, block: Blockly.Block) => {
  if (!block.workspace || block.isDisposed() || !block.rendered) {
    return;
  }

  // Force update by temporarily changing and restoring the value
  // This triggers Blockly's internal update mechanism
  const oldGroup = Blockly.Events.getGroup();
  Blockly.Events.setGroup(true);

  const currentValue = field.getValue();
  const fieldAsAny = field as unknown as {
    textElement_?: SVGTextElement;
    textContent_?: string;
    forceRerender?: () => void;
    updateText_?: () => void;
    setValue?: (value: string) => void;
  };

  // Try Blockly's internal methods first
  if (fieldAsAny.forceRerender) {
    fieldAsAny.forceRerender();
  } else if (fieldAsAny.updateText_) {
    fieldAsAny.updateText_();
  } else {
    // Fallback: force update by setting value to empty then back
    // Use requestAnimationFrame to ensure it happens in next render cycle
    requestAnimationFrame(() => {
      if (!block.isDisposed() && block.rendered) {
        field.setValue("");
        requestAnimationFrame(() => {
          if (!block.isDisposed() && block.rendered) {
            field.setValue(currentValue || "");
            Blockly.Events.setGroup(oldGroup);
          }
        });
      }
    });
  }
};

// Helper function to fetch and update ABI for a block
const fetchAndUpdateABI = async (
  block: Blockly.Block,
  contractAddress: string,
  chainId: number,
) => {
  try {
    const abiString = await fetchContractABI(contractAddress, chainId, false);

    if (abiString) {
      const functions = extractFunctions(abiString);
      const functionDropdown = block.getField("FUNCTION_NAME");

      if (functionDropdown) {
        if (functions.length > 0) {
          // Create dropdown options from functions
          const functionOptions = functions.map(
            (func: {
              name: string;
              inputs: { type: string; name: string }[];
            }) => [
              formatFunctionSignature(func.name, func.inputs || []),
              formatFunctionSignature(func.name, func.inputs || []),
            ],
          );

          // Add ETH Transfer as the first option
          const options = [
            ["ETH Transfer", "ETH Transfer"],
            ...functionOptions,
          ];

          // Update dropdown options
          (
            functionDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = options;

          // Set ETH Transfer as default
          functionDropdown.setValue("ETH Transfer");

          // Force the field to update its display immediately
          forceDropdownUpdate(functionDropdown, block);
        } else {
          // No functions found in ABI
          (
            functionDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["No functions found", ""]];
          functionDropdown.setValue("");
          forceDropdownUpdate(functionDropdown, block);
        }
      }
    } else {
      // ABI not found
      const functionDropdown = block.getField("FUNCTION_NAME");
      if (functionDropdown) {
        (
          functionDropdown as unknown as { menuGenerator_: string[][] }
        ).menuGenerator_ = [["ABI not found", ""]];
        functionDropdown.setValue("");
        forceDropdownUpdate(functionDropdown, block);
      }
    }
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    const functionDropdown = block.getField("FUNCTION_NAME");
    if (functionDropdown) {
      (
        functionDropdown as unknown as { menuGenerator_: string[][] }
      ).menuGenerator_ = [["Error fetching ABI", ""]];
      functionDropdown.setValue("");
      forceDropdownUpdate(functionDropdown, block);
    }
  }
};

const safeTransaction2Json = {
  type: "safe_transaction2",
  message0: "Execute %1 function",
  message1: "from the contract %1",
  message2: "and value %1",
  args0: [
    {
      type: "field_dropdown",
      name: "FUNCTION_NAME",
      options: [["select a function", ""]],
    },
  ],
  args1: [
    {
      type: "field_input",
      name: "CONTRACT_ADDRESS",
      text: "0x...",
      spellcheck: false,
    },
  ],
  args2: [
    {
      type: "input_statement",
      name: "ARGUMENTS",
    },
  ],
  inputsInline: false,
  previousStatement: "ACTION",
  nextStatement: "execute_end",
  colour: 190,
  tooltip:
    "Specify the contract address and what function to be called to perform the job.",
  helpUrl: "",
};

Blockly.Blocks["safe_transaction2"] = {
  init: function () {
    this.jsonInit(safeTransaction2Json);

    // Store the last fetched address to track changes
    let lastFetchedAddress = "";

    // Add validator to CONTRACT_ADDRESS field to fetch functions when address changes
    const contractAddressField = this.getField("CONTRACT_ADDRESS");
    if (contractAddressField) {
      contractAddressField.setValidator((newValue: string) => {
        // Normalize the value
        const normalizedValue = newValue?.trim() || "";

        // Check if address was removed or cleared
        if (!normalizedValue || normalizedValue === "0x...") {
          const functionDropdown = this.getField("FUNCTION_NAME");
          if (functionDropdown) {
            (
              functionDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Enter contract address", ""]];
            functionDropdown.setValue("");
          }
          lastFetchedAddress = "";
          return newValue;
        }

        // Check if address actually changed
        if (normalizedValue === lastFetchedAddress) {
          return newValue;
        }

        // Validate address format first
        if (ethers.isAddress(normalizedValue)) {
          lastFetchedAddress = normalizedValue;
          const functionDropdown = this.getField("FUNCTION_NAME");

          // Show "Fetching ABI..." immediately
          if (functionDropdown) {
            (
              functionDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Fetching ABI...", ""]];
            functionDropdown.setValue("");
            forceDropdownUpdate(functionDropdown, this);
          }

          // Fetch ABI asynchronously (non-blocking)
          (async () => {
            try {
              let chainId: number | null = null;

              // Search the entire workspace for any chain_selection block
              if (this.workspace) {
                const allBlocks = this.workspace.getAllBlocks(false);
                for (const block of allBlocks) {
                  if (block.type === "chain_selection" && !block.isInFlyout) {
                    const chainIdValue = block.getFieldValue("CHAIN_ID");
                    chainId = parseInt(chainIdValue, 10);
                    break;
                  }
                }
              }

              // If no chain is found, show error message
              if (chainId === null) {
                const functionDropdown = this.getField("FUNCTION_NAME");
                if (functionDropdown) {
                  (
                    functionDropdown as unknown as {
                      menuGenerator_: string[][];
                    }
                  ).menuGenerator_ = [["Select a chain first", ""]];
                  functionDropdown.setValue("");
                  forceDropdownUpdate(functionDropdown, this);
                }
                return;
              }

              // Check if address is an EOA (Externally Owned Account)
              const rpcUrl = getRpcUrl(chainId);
              if (rpcUrl) {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const code = await provider.getCode(normalizedValue);
                const isEOA = !code || code === "0x" || code.length <= 2;

                if (isEOA) {
                  const functionDropdown = this.getField("FUNCTION_NAME");
                  if (functionDropdown) {
                    (
                      functionDropdown as unknown as {
                        menuGenerator_: string[][];
                      }
                    ).menuGenerator_ = [
                      ["Address is an EOA, not a contract", ""],
                    ];
                    functionDropdown.setValue("");
                    forceDropdownUpdate(functionDropdown, this);
                  }
                  return;
                }
              }

              await fetchAndUpdateABI(this, normalizedValue, chainId);
            } catch (error) {
              console.error("Error in validator:", error);
            }
          })();
        } else {
          // Invalid address format
          const functionDropdown = this.getField("FUNCTION_NAME");
          if (functionDropdown) {
            (
              functionDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Invalid address format", ""]];
            functionDropdown.setValue("");
          }
          lastFetchedAddress = "";
        }

        // Always return the new value to allow editing
        return newValue;
      });
    }
  },
  onchange: function (event: Blockly.Events.Abstract) {
    if (!this.workspace) {
      return;
    }

    // When block is moved from flyout to workspace or created
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE
    ) {
      const contractAddress = this.getFieldValue("CONTRACT_ADDRESS");
      const functionDropdown = this.getField("FUNCTION_NAME");

      // If not in flyout and contract address is empty or default
      if (
        !this.isInFlyout &&
        functionDropdown &&
        (!contractAddress || contractAddress === "0x...")
      ) {
        (
          functionDropdown as unknown as { menuGenerator_: string[][] }
        ).menuGenerator_ = [["Enter contract address", ""]];
        functionDropdown.setValue("");
      }

      // Auto-fetch ABI when chain becomes available
      if (!this.isInFlyout && contractAddress && contractAddress !== "0x...") {
        let chainId: number | null = null;

        // Search the entire workspace for any chain_selection block
        if (this.workspace) {
          const allBlocks = this.workspace.getAllBlocks(false);
          for (const block of allBlocks) {
            if (block.type === "chain_selection" && !block.isInFlyout) {
              const chainIdValue = block.getFieldValue("CHAIN_ID");
              chainId = parseInt(chainIdValue, 10);
              break;
            }
          }
        }

        // If we found a chain and have a valid contract address, trigger fetch
        if (chainId !== null && ethers.isAddress(contractAddress)) {
          const functionDropdown = this.getField("FUNCTION_NAME");

          // Show "Fetching ABI..." immediately
          if (functionDropdown) {
            (
              functionDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Fetching ABI...", ""]];
            functionDropdown.setValue("");
            forceDropdownUpdate(functionDropdown, this);
          }

          // Fetch ABI asynchronously
          (async () => {
            try {
              // Check if address is an EOA (Externally Owned Account)
              const rpcUrl = getRpcUrl(chainId);
              if (rpcUrl) {
                const provider = new ethers.JsonRpcProvider(rpcUrl);
                const code = await provider.getCode(contractAddress);
                const isEOA = !code || code === "0x" || code.length <= 2;

                if (isEOA) {
                  const functionDropdown = this.getField("FUNCTION_NAME");
                  if (functionDropdown) {
                    (
                      functionDropdown as unknown as {
                        menuGenerator_: string[][];
                      }
                    ).menuGenerator_ = [
                      ["Address is an EOA, not a contract", ""],
                    ];
                    functionDropdown.setValue("");
                    forceDropdownUpdate(functionDropdown, this);
                  }
                  return;
                }
              }

              await fetchAndUpdateABI(this, contractAddress, chainId);
            } catch (error) {
              console.error("Error in onchange:", error);
            }
          })();
        }
      }
    }
  },
};

export const safeTransaction2Generator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const contractAddress = block.getFieldValue("CONTRACT_ADDRESS");

  const json = JSON.stringify({
    target_function: functionName,
    target_contract_address: contractAddress,
  });

  return [`// Safe Transaction2: ${json}`, Order.NONE];
};

export default safeTransaction2Json;
