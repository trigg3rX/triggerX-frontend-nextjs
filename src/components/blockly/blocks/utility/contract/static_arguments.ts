import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";

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

const staticArgumentsJson = {
  type: "static_arguments",
  message0: "static values for the arguments",
  previousStatement: null,
  nextStatement: null,
  colour: 190,
  tooltip: "Specify the values that will be passed as arguments.",
  helpUrl: "",
};

Blockly.Blocks["static_arguments"] = {
  init: function () {
    this.jsonInit(staticArgumentsJson);
    this.argumentInputs_ = [];
    this.hasDynamicFields_ = false;
    this.lastFunctionSignature_ = "";
  },

  // Method to update argument inputs based on function signature
  updateArgumentInputs: function (
    functionInputs: { name: string; type: string }[],
  ) {
    try {
      // Remove inputs from the end, keeping only the first input (index 0 - message0)
      // We need to remove from the end to avoid index shifting issues
      const inputsToRemove = [];
      for (let i = 1; i < this.inputList.length; i++) {
        inputsToRemove.push(this.inputList[i].name);
      }

      for (const inputName of inputsToRemove) {
        this.removeInput(inputName);
      }

      this.argumentInputs_ = [];
      this.hasDynamicFields_ = true;

      // Add new inputs for each parameter
      if (functionInputs && functionInputs.length > 0) {
        for (let i = 0; i < functionInputs.length; i++) {
          const param = functionInputs[i];
          const inputName = `ARG_${i}`;
          const paramLabel = param.name || `param${i}`;

          const input = this.appendDummyInput(inputName);
          input.appendField(paramLabel + " (" + param.type + "):");
          const textField = new Blockly.FieldTextInput("");
          input.appendField(textField, `VALUE_${i}`);

          this.argumentInputs_.push(inputName);
        }
      } else {
        // No parameters
        this.appendDummyInput("NO_PARAMS").appendField(
          "no parameters required",
        );
        this.argumentInputs_.push("NO_PARAMS");
      }
    } catch (error) {
      console.error("Error updating argument inputs:", error);
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

    // Skip if this is a field change event on this block (user typing)
    const ev = event as unknown as { blockId?: string; name?: string };
    if (event.type === Blockly.Events.BLOCK_CHANGE && ev.blockId === this.id) {
      return;
    }

    // Trigger on move, create events, or when execute_function changes
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE ||
      (event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.name === "FUNCTION_NAME")
    ) {
      // Use setTimeout to ensure parent connections are established
      setTimeout(() => {
        this.fetchAndUpdateArguments();
      }, 100);
    }
  },

  showStatus: function (message: string) {
    try {
      // Remove inputs from the end, keeping only the first input (index 0 - message0)
      const inputsToRemove = [];
      for (let i = 1; i < this.inputList.length; i++) {
        inputsToRemove.push(this.inputList[i].name);
      }

      for (const inputName of inputsToRemove) {
        this.removeInput(inputName);
      }

      this.argumentInputs_ = [];
      this.hasDynamicFields_ = true;

      this.appendDummyInput("STATUS").appendField(message);
      this.argumentInputs_.push("STATUS");
    } catch (error) {
      console.error("Error showing status:", error);
    }
  },

  fetchAndUpdateArguments: async function () {
    // Find the execute_function block by checking which block contains this one
    let executeFunctionBlock = null;

    // Check if this block is connected to an execute_function block
    if (this.workspace) {
      const allBlocks = this.workspace.getAllBlocks(false);
      for (const block of allBlocks) {
        if (block.type === "execute_function") {
          // Check if this static_arguments block is in the ARGUMENTS input of execute_function
          const argsInput = block.getInput("ARGUMENTS");
          if (argsInput) {
            let connectedBlock = argsInput.connection?.targetBlock();
            while (connectedBlock) {
              if (connectedBlock.id === this.id) {
                executeFunctionBlock = block;
                break;
              }
              connectedBlock = connectedBlock.getNextBlock();
            }
          }
          if (executeFunctionBlock) break;
        }
      }
    }

    if (!executeFunctionBlock) {
      this.showStatus("(function not found)");
      return;
    }

    const functionSignature =
      executeFunctionBlock.getFieldValue("FUNCTION_NAME");
    const contractAddress =
      executeFunctionBlock.getFieldValue("CONTRACT_ADDRESS");

    if (
      !functionSignature ||
      !contractAddress ||
      !ethers.isAddress(contractAddress)
    ) {
      this.showStatus("(waiting for function selection)");
      return;
    }

    // Check if the function signature has changed and we already have fields
    if (
      this.lastFunctionSignature_ === functionSignature &&
      this.hasDynamicFields_
    ) {
      return; // Don't re-fetch if the function hasn't changed and fields exist
    }

    this.lastFunctionSignature_ = functionSignature;

    // Show fetching status
    this.showStatus("(fetching arguments...)");

    // Get chain ID from workspace
    let chainId: number | null = null;
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

    if (chainId === null) {
      this.showStatus("(select a chain first)");
      return;
    }

    try {
      const abiString = await fetchContractABI(contractAddress, chainId, false);
      if (abiString) {
        const functions = extractFunctions(abiString);

        const matchedFunction = functions.find(
          (func: { name: string; inputs: { type: string; name: string }[] }) =>
            formatFunctionSignature(func.name, func.inputs || []) ===
            functionSignature,
        );

        if (matchedFunction) {
          this.updateArgumentInputs(matchedFunction.inputs || []);
        } else {
          this.showStatus("(function not found in ABI)");
        }
      } else {
        this.showStatus("(ABI not found)");
      }
    } catch (error) {
      console.error("Error fetching ABI for static arguments:", error);
      this.showStatus("(error fetching ABI)");
    }
  },
};

export const staticArgumentsGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  // Collect all argument values
  const argumentValues: string[] = [];
  let i = 0;

  while (block.getField(`VALUE_${i}`)) {
    const value = block.getFieldValue(`VALUE_${i}`);
    argumentValues.push(value);
    i++;
  }

  const json = JSON.stringify({
    argument_type: "static",
    argument_values: argumentValues,
  });

  return [`// Static Arguments: ${json}`, Order.NONE];
};

export default staticArgumentsJson;
