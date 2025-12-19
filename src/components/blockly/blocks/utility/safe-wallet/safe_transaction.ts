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

      // Store ABI + functions on the block for argument rendering
      (block as unknown as { abiString_?: string }).abiString_ = abiString;
      (
        block as unknown as {
          functions_?: Array<{
            name: string;
            inputs: { type: string; name: string }[];
          }>;
        }
      ).functions_ = functions;

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

          // Ensure argument inputs are reset for ETH transfer
          if (
            (
              block as unknown as {
                updateArgumentInputs?: (
                  inputs: { name: string; type: string }[],
                ) => void;
              }
            ).updateArgumentInputs
          ) {
            (
              block as unknown as {
                updateArgumentInputs: (
                  inputs: { name: string; type: string }[],
                ) => void;
              }
            ).updateArgumentInputs([]);
          }
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

const safeTransactionJson = {
  type: "safe_transaction",
  message0: "Perform safe transaction for %1",
  message1: "from Target Address %1",
  message2: "and value (in ETH) %1",
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
      type: "field_input",
      name: "VALUE",
      text: "0",
      spellcheck: false,
    },
  ],
  inputsInline: false,
  previousStatement: "SAFE_TRANSACTION",
  nextStatement: "SAFE_TRANSACTION",
  colour: 190,
  tooltip:
    "Specify the contract address and what function to be called to perform the job.",
  helpUrl: "",
};

Blockly.Blocks["safe_transaction"] = {
  init: function () {
    this.jsonInit(safeTransactionJson);

    // Internal state for dynamic argument inputs
    this.argumentInputs_ = [];
    this.lastFunctionSignature_ = "";
    this.functions_ = [];
    this.abiString_ = null;

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

    // Update argument inputs based on selected function
    this.updateArgumentInputs = function (
      functionInputs: { name: string; type: string }[],
    ) {
      try {
        // Remove any previously-added argument inputs
        if (Array.isArray(this.argumentInputs_)) {
          for (const inputName of this.argumentInputs_) {
            if (this.getInput(inputName)) {
              this.removeInput(inputName);
            }
          }
        }
        this.argumentInputs_ = [];

        // Get the VALUE field to enable/disable it
        const valueField = this.getField("VALUE");
        const hasArguments = functionInputs && functionInputs.length > 0;

        // Enable/disable VALUE field based on whether function has arguments
        if (valueField) {
          if (hasArguments) {
            // Disable VALUE field when function has arguments
            valueField.setEnabled(false);
          } else {
            // Enable VALUE field for ETH transfer or no function selected
            valueField.setEnabled(true);
          }
        }

        // Add new text inputs for each parameter
        if (hasArguments) {
          for (let i = 0; i < functionInputs.length; i++) {
            const param = functionInputs[i];
            const inputName = `ARG_${i}`;
            const paramLabel = param.name || `param${i}`;

            const input = this.appendDummyInput(inputName);
            input.appendField(`${paramLabel} (${param.type}):`);
            input.appendField(new Blockly.FieldTextInput(""), `VALUE_${i}`);
            this.argumentInputs_.push(inputName);
          }
        }
      } catch (error) {
        console.error("Error updating argument inputs:", error);
      }
    };

    this.updateArgumentInputsForFunction = function (
      functionSignature: string,
    ) {
      // ETH transfer uses no parameters - enable VALUE field
      if (!functionSignature || functionSignature === "ETH Transfer") {
        this.updateArgumentInputs([]);
        this.lastFunctionSignature_ = functionSignature;
        return;
      }

      // Skip if function hasn't changed
      if (this.lastFunctionSignature_ === functionSignature) {
        return;
      }
      this.lastFunctionSignature_ = functionSignature;

      const functions =
        (
          this as unknown as {
            functions_?: Array<{
              name: string;
              inputs: { type: string; name: string }[];
            }>;
          }
        ).functions_ || [];

      const matchedFunction = functions.find(
        (func) =>
          formatFunctionSignature(func.name, func.inputs || []) ===
          functionSignature,
      );

      if (matchedFunction) {
        // Function has arguments - disable VALUE field and show argument inputs
        this.updateArgumentInputs(matchedFunction.inputs || []);
      } else {
        // Function not found - enable VALUE field and clear arguments
        this.updateArgumentInputs([]);
      }
    };

    // Attach validator to function dropdown to refresh argument inputs
    const functionDropdown = this.getField("FUNCTION_NAME");
    if (functionDropdown) {
      const originalValidator = functionDropdown.getValidator();
      functionDropdown.setValidator((newValue: string) => {
        const result = originalValidator
          ? originalValidator.call(functionDropdown, newValue)
          : newValue;

        // Defer to allow Blockly to finish its own updates
        setTimeout(() => {
          if (!this.isDisposed() && !this.isInFlyout) {
            this.updateArgumentInputsForFunction(newValue);
          }
        }, 50);

        return result;
      });
    }
  },
  onchange: function (event: Blockly.Events.Abstract) {
    if (!this.workspace) {
      return;
    }

    // Skip if in flyout
    if (this.isInFlyout) {
      return;
    }

    // Validate that safe_transaction is connected under a valid parent
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE
    ) {
      const parent = this.getParent();

      // Allow being directly under execute_through_safe_wallet or another safe_transaction
      const allowedParents = [
        "execute_through_safe_wallet",
        "safe_transaction",
      ];

      if (parent && !allowedParents.includes(parent.type)) {
        this.setWarningText(
          "Safe Transaction can only be used under Execute Through Safe Wallet or another Safe Transaction block.",
        );

        // Detach from invalid parent while keeping stack intact
        setTimeout(() => {
          if (!this.isDisposed()) {
            this.unplug(true);
          }
        }, 0);
      } else if (!parent) {
        // Block is not connected to anything - show warning
        this.setWarningText(
          "Safe Transaction must be connected under Execute Through Safe Wallet.",
        );
      } else {
        // Connected to a valid parent - clear warning
        this.setWarningText(null);
      }
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

              // Update arguments based on the currently selected function
              const functionSignature = this.getFieldValue("FUNCTION_NAME");
              if (functionSignature) {
                setTimeout(() => {
                  if (!this.isDisposed()) {
                    this.updateArgumentInputsForFunction(functionSignature);
                  }
                }, 100);
              }
            } catch (error) {
              console.error("Error in onchange:", error);
            }
          })();
        }
      }
    }

    // Handle function change events (e.g., programmatic setValue)
    const ev = event as unknown as { blockId?: string; name?: string };
    if (
      event.type === Blockly.Events.BLOCK_CHANGE &&
      ev.blockId === this.id &&
      ev.name === "FUNCTION_NAME"
    ) {
      const functionSignature = this.getFieldValue("FUNCTION_NAME");
      setTimeout(() => {
        if (!this.isDisposed() && !this.isInFlyout) {
          this.updateArgumentInputsForFunction(functionSignature);
        }
      }, 50);
    }
  },
};

export const safeTransactionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const contractAddress = block.getFieldValue("CONTRACT_ADDRESS");
  const value = block.getFieldValue("VALUE") || "0";

  // Collect argument values from generated fields
  const argumentValues: string[] = [];
  let i = 0;
  while (block.getField(`VALUE_${i}`)) {
    argumentValues.push(block.getFieldValue(`VALUE_${i}`) || "");
    i++;
  }

  const json = JSON.stringify({
    target_function: functionName,
    target_contract_address: contractAddress,
    value,
    argument_values: argumentValues,
  });

  return [`// Safe Transaction: ${json}`, Order.NONE];
};

export default safeTransactionJson;
