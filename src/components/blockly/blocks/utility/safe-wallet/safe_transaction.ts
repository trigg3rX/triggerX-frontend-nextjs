import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { detectAddressTypeHelper } from "@/utils/addressDetection";
import {
  extractFunctions,
  findFunctionBySignature,
  type ParsedFunction,
} from "@/utils/abiUtils";
import { ethers } from "ethers";
import networksData from "@/utils/networks.json";

// Helper function to format function signature
const formatFunctionSignature = (
  name: string,
  inputs: { type: string; name?: string }[],
) => `${name}(${inputs.map((input) => input.type).join(",")})`;

const safeTransactionJson = {
  type: "safe_transaction",
  message0: "Target Address %1",
  message1: "Function %1",
  message2: "Value (ETH) %1",
  args0: [
    {
      type: "field_input",
      name: "TARGET_ADDRESS",
      text: "0x...",
      spellcheck: false,
    },
  ],
  args1: [
    {
      type: "field_dropdown",
      name: "FUNCTION_NAME",
      options: [["Select function", ""]],
    },
  ],
  args2: [
    {
      type: "field_number",
      name: "VALUE",
      value: 0,
      min: 0,
    },
  ],
  previousStatement: "SAFE_TRANSACTION",
  nextStatement: "SAFE_TRANSACTION",
  colour: "#9C27B0",
  tooltip:
    "Define a Safe transaction with target address, function, parameters, and value.",
  helpUrl: "",
};

Blockly.Blocks["safe_transaction"] = {
  init: function () {
    this.jsonInit(safeTransactionJson);
    this.parameterInputs_ = [];
    this.hasDynamicFields_ = false;
    this.lastFunctionSignature_ = "";
    this.lastAddress_ = "";
    this.addressType_ = "eoa" as "contract" | "eoa" | "detecting";
    this.abi_ = null as string | null;
    this.functions_ = [] as ReturnType<typeof extractFunctions>;
    this.selectedFunction_ = "";
    this.functionInputs_ = [] as { name?: string; type: string }[];

    // Add validator to TARGET_ADDRESS to trigger detection as user types
    const targetAddressField = this.getField("TARGET_ADDRESS");
    if (targetAddressField) {
      const block = this as unknown as Blockly.Block & {
        addressType_: "contract" | "eoa" | "detecting";
        abi_: string | null;
        functions_: ReturnType<typeof extractFunctions>;
        updateFunctionDropdown: () => void;
        detectAddressAndFetchABI: (address: string) => Promise<void>;
      };

      targetAddressField.setValidator((newValue: string) => {
        const normalized = newValue?.trim() || "";

        // If cleared or default placeholder, reset to EOA / ETH transfer state
        if (!normalized || normalized === "0x...") {
          block.addressType_ = "eoa";
          block.abi_ = null;
          block.functions_ = [];
          block.updateFunctionDropdown();
          return newValue;
        }

        // Only react once we have a syntactically valid address
        if (ethers.isAddress(normalized)) {
          // Trigger async detection + ABI fetch (if contract)
          void block.detectAddressAndFetchABI(normalized);
        } else {
          // Invalid address format: treat as EOA with no functions
          block.addressType_ = "eoa";
          block.abi_ = null;
          block.functions_ = [];
          block.updateFunctionDropdown();
        }

        // Always allow editing
        return newValue;
      });
    }
  },

  // Method to update parameter inputs based on function signature
  updateParameterInputs: function (
    functionInputs: { name?: string; type: string }[],
  ) {
    try {
      // Remove all existing parameter inputs (inputs with names starting with PARAM_)
      const inputsToRemove = [];

      for (let i = 0; i < this.inputList.length; i++) {
        const input = this.inputList[i];

        // Remove any input that has a name starting with PARAM_
        if (input.name && input.name.startsWith("PARAM_")) {
          inputsToRemove.push(input.name);
        }
      }

      for (const inputName of inputsToRemove) {
        this.removeInput(inputName);
      }

      this.parameterInputs_ = [];
      this.hasDynamicFields_ = true;

      // Add new inputs for each parameter
      if (functionInputs && functionInputs.length > 0) {
        for (let i = 0; i < functionInputs.length; i++) {
          const param = functionInputs[i];
          const inputName = `PARAM_${i}`;
          const paramLabel = param.name || `param${i + 1}`;

          const input = this.appendDummyInput(inputName);
          input.appendField(paramLabel + " (" + param.type + "):");
          const textField = new Blockly.FieldTextInput("");
          input.appendField(textField, `VALUE_${i}`);
          this.parameterInputs_.push(inputName);
        }
      } else {
      }
    } catch (error) {
      console.error("Error updating parameter inputs:", error);
    }
  },

  // Show status message
  showStatus: function (message: string) {
    try {
      // Remove parameter inputs (all inputs after VALUE)
      const inputsToRemove = [];
      let foundValueInput = false;

      for (let i = 0; i < this.inputList.length; i++) {
        const input = this.inputList[i];
        if (input.name === "VALUE") {
          foundValueInput = true;
          continue;
        }
        if (foundValueInput && input.name && input.name.startsWith("PARAM_")) {
          inputsToRemove.push(input.name);
        }
      }

      for (const inputName of inputsToRemove) {
        this.removeInput(inputName);
      }

      this.parameterInputs_ = [];
      this.hasDynamicFields_ = true;

      const input = this.appendDummyInput("STATUS");
      input.appendField(message);
      this.parameterInputs_.push("STATUS");
    } catch (error) {
      console.error("Error showing status:", error);
    }
  },

  // Detect address type and fetch ABI if needed
  detectAddressAndFetchABI: async function (address: string) {
    if (!address || !ethers.isAddress(address)) {
      this.selectedFunction_ = "";
      this.functionInputs_ = [];
      this.lastFunctionSignature_ = "";
      this.addressType_ = "eoa";
      this.abi_ = null;
      this.functions_ = [];
      this.updateParameterInputs([]);
      this.updateFunctionDropdown();
      this.updateValueFieldVisibility();
      return;
    }

    // Check if address changed
    if (this.lastAddress_ === address && this.abi_ !== null) {
      return; // Already processed this address
    }

    // Address changed - clear previous function selection and parameters
    if (this.lastAddress_ !== "" && this.lastAddress_ !== address) {
      this.selectedFunction_ = "";
      this.functionInputs_ = [];
      this.lastFunctionSignature_ = "";
      this.updateParameterInputs([]);
      this.updateValueFieldVisibility();
    }

    this.lastAddress_ = address;
    this.addressType_ = "detecting";

    try {
      // Find chain ID from any chain_selection block in the workspace
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

      // If no chain is found, mirror execute_function behaviour
      if (chainId === null) {
        const functionDropdown = this.getField("FUNCTION_NAME");
        if (functionDropdown) {
          (
            functionDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["Select a chain first", ""]];
          functionDropdown.setValue("");
        }
        // Reset internal state
        this.addressType_ = "eoa";
        this.abi_ = null;
        this.functions_ = [];
        return;
      }

      // Map chain ID to network name for detection helper
      const network =
        networksData.supportedNetworks.find((n) => n.id === chainId) ?? null;
      const networkName = network?.name ?? "Ethereum";

      // Detect address type
      const detectionResult = await detectAddressTypeHelper(
        address,
        networkName,
      );
      this.addressType_ = detectionResult.addressType;

      if (detectionResult.shouldFetchABI) {
        // Fetch ABI using the resolved chainId
        const abiString = await fetchContractABI(address, chainId, false);
        if (abiString) {
          this.abi_ = abiString;
          this.functions_ = extractFunctions(abiString);
          this.updateFunctionDropdown();
          this.updateValueFieldVisibility();
        } else {
          this.abi_ = null;
          this.functions_ = [];
          this.updateFunctionDropdown();
          this.updateValueFieldVisibility();
        }
      } else {
        this.selectedFunction_ = "";
        this.functionInputs_ = [];
        this.lastFunctionSignature_ = "";
        this.abi_ = null;
        this.functions_ = [];
        this.updateParameterInputs([]);
        this.updateFunctionDropdown();
        this.updateValueFieldVisibility();
      }
    } catch (error) {
      console.error("[safe_transaction] Error detecting address:", error);
      this.selectedFunction_ = "";
      this.functionInputs_ = [];
      this.lastFunctionSignature_ = "";
      this.addressType_ = "eoa";
      this.abi_ = null;
      this.functions_ = [];
      this.updateParameterInputs([]);
      this.updateFunctionDropdown();
      this.updateValueFieldVisibility();
    }
  },

  // Update function dropdown
  updateFunctionDropdown: function () {
    const functionDropdown = this.getField("FUNCTION_NAME");
    if (!functionDropdown) return;

    // CONTRACT ADDRESS WITH FUNCTIONS
    if (this.addressType_ === "contract" && this.functions_.length > 0) {
      // First option matches SafeTransactionBuilder: ETH transfer to contract
      const options: string[][] = [
        ["ETH Transfer to Contract", ""],
        ...this.functions_.map((func: ParsedFunction) => [
          formatFunctionSignature(func.name, func.inputs || []),
          formatFunctionSignature(func.name, func.inputs || []),
        ]),
      ];
      (
        functionDropdown as unknown as { menuGenerator_: string[][] }
      ).menuGenerator_ = options;
      // Default to ETH Transfer to Contract (empty function signature)
      functionDropdown.setValue("");
      return;
    }

    // CONTRACT ADDRESS BUT ABI/FUNCTIONS NOT FOUND
    if (this.addressType_ === "contract") {
      (
        functionDropdown as unknown as { menuGenerator_: string[][] }
      ).menuGenerator_ = [["ABI not found", ""]];
      functionDropdown.setValue("");
      return;
    }

    // EOA OR INVALID ADDRESS → ETH TRANSFER ONLY
    this.selectedFunction_ = "";
    this.functionInputs_ = [];
    this.updateParameterInputs([]);
    this.updateValueFieldVisibility();

    (
      functionDropdown as unknown as { menuGenerator_: string[][] }
    ).menuGenerator_ = [["ETH Transfer", ""]];
    functionDropdown.setValue("");
  },

  // Update VALUE field visibility based on function selection
  updateValueFieldVisibility: function () {
    const valueField = this.getField("VALUE");
    const hasFunctionSelected =
      this.selectedFunction_ && this.selectedFunction_ !== "";

    // Find the input that contains the VALUE field
    let valueInput = null;
    for (let i = 0; i < this.inputList.length; i++) {
      const input = this.inputList[i];
      if (
        input.fieldRow?.some((field: Blockly.Field) => field.name === "VALUE")
      ) {
        valueInput = input;
        break;
      }
    }

    if (hasFunctionSelected) {
      // Function selected (not ETH Transfer) - remove VALUE input entirely
      if (valueInput) {
        // Ensure input has a name for removal
        if (!valueInput.name) {
          valueInput.name = "VALUE";
        }
        this.removeInput(valueInput.name);
      }
    } else {
      // ETH Transfer or EOA - ensure VALUE input exists
      if (!valueInput) {
        const input = this.appendDummyInput("VALUE");
        input.appendField("Value (ETH)");
        const valueField = new Blockly.FieldNumber(0, 0);
        input.appendField(valueField, "VALUE");
      } else if (valueField) {
        // Ensure field is enabled
        valueField.setEnabled(true);
      }
    }
  },

  // Handle function selection change
  handleFunctionChange: function (functionSignature: string) {
    if (!functionSignature || functionSignature === "") {
      // ETH Transfer selected
      this.selectedFunction_ = "";
      this.functionInputs_ = [];
      this.updateParameterInputs([]);
      this.updateValueFieldVisibility();
      return;
    }

    if (
      this.lastFunctionSignature_ === functionSignature &&
      this.hasDynamicFields_
    ) {
      return; // Already processed
    }

    this.lastFunctionSignature_ = functionSignature;
    this.selectedFunction_ = functionSignature;

    // Find the function in our functions list
    const selectedFunc = findFunctionBySignature(
      this.functions_,
      functionSignature,
    );
    if (selectedFunc) {
      this.functionInputs_ = selectedFunc.inputs || [];
      this.updateParameterInputs(this.functionInputs_);
    } else {
      this.functionInputs_ = [];
      this.updateParameterInputs([]);
    }

    // Update VALUE field visibility
    this.updateValueFieldVisibility();
  },

  // Encode contract call data (called during sync, not in block)
  encodeContractCall: function (): string {
    // This will be handled during syncBlocklyToJobForm
    return "0x";
  },

  // Parse parameter value based on type
  parseParameterValue: function (value: string, type: string): unknown {
    if (type.startsWith("uint") || type.startsWith("int")) {
      return BigInt(value);
    } else if (type === "bool") {
      return value.toLowerCase() === "true";
    } else if (type === "address") {
      return value;
    } else if (type.startsWith("bytes")) {
      return value;
    } else if (type === "string") {
      return value;
    }
    return value;
  },

  onchange: function (event: Blockly.Events.Abstract) {
    if (!this.workspace) {
      return;
    }

    // Skip if in flyout
    if (this.isInFlyout) {
      return;
    }

    const ev = event as unknown as { blockId?: string; name?: string };

    // Handle function change
    if (
      event.type === Blockly.Events.BLOCK_CHANGE &&
      ev.blockId === this.id &&
      ev.name === "FUNCTION_NAME"
    ) {
      const functionSignature = this.getFieldValue("FUNCTION_NAME");
      this.handleFunctionChange(functionSignature);
      return;
    }

    // Handle block creation or move
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE
    ) {
      // Auto-detect address if set
      const address = this.getFieldValue("TARGET_ADDRESS");
      if (address && address !== "0x..." && ethers.isAddress(address)) {
        setTimeout(() => {
          this.detectAddressAndFetchABI(address);
        }, 100);
      }
    }
  },
};

export const safeTransactionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const targetAddress = block.getFieldValue("TARGET_ADDRESS") || "";
  const functionName = block.getFieldValue("FUNCTION_NAME") || "";
  const value = block.getFieldValue("VALUE") || "0";

  // Get parameter values from fields
  const parameterValues: string[] = [];
  let paramIndex = 0;
  while (block.getField(`VALUE_${paramIndex}`)) {
    const field = block.getField(`VALUE_${paramIndex}`);
    if (field) {
      parameterValues.push((field as Blockly.Field).getValue() as string);
    } else {
      parameterValues.push("");
    }
    paramIndex++;
  }

  const json = JSON.stringify({
    target_address: targetAddress,
    function_name: functionName,
    parameter_values: parameterValues,
    value: value,
  });

  return [`// Safe Transaction: ${json}`, Order.NONE];
};

export default safeTransactionJson;
