import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { getSafeModuleAddress } from "@/utils/contractAddresses";

const executeThroughSafeWalletJson = {
  type: "execute_through_safe_wallet",
  message0: "Execute through Safe Wallet %1",
  args0: [
    {
      type: "input_value",
      name: "SAFE_WALLET",
      check: "SAFE_WALLET_OUTPUT",
    },
  ],
  message1: "Safe Module Address %1",
  args1: [
    {
      type: "field_input",
      name: "MODULE_ADDRESS",
      editable: false,
      text: "",
      spellcheck: false,
    },
  ],
  message2: "Function %1",
  args2: [
    {
      type: "field_input",
      name: "FUNCTION",
      editable: false,
      text: "",
      spellcheck: false,
    },
  ],
  message3: "and values from %1",
  args3: [
    {
      type: "input_statement",
      name: "FUNCTION_CALL",
      check: "SAFE_TRANSACTION",
    },
  ],
  previousStatement: "ACTION",
  nextStatement: "EXECUTE_END",
  colour: "190",
  tooltip:
    "Execute a transaction through a Safe wallet using the Safe Module's execJobFromHub function.",
  helpUrl: "",
};

Blockly.Blocks["execute_through_safe_wallet"] = {
  init: function () {
    this.jsonInit(executeThroughSafeWalletJson);

    let currentModuleAddress = "";
    let currentFunction = "execJobFromHub(address,address,uint256,bytes,uint8)";

    // Make module address field non-editable but allow programmatic updates
    const moduleAddressField = this.getField("MODULE_ADDRESS");
    if (moduleAddressField) {
      moduleAddressField.setValidator((newValue: string) => {
        // Allow if it's a programmatic update (matches our stored value)
        if (newValue === currentModuleAddress) {
          return newValue;
        }
        // Reject user edits by returning the current value
        return currentModuleAddress || newValue;
      });
    }

    // Make function field non-editable but allow programmatic updates
    const functionField = this.getField("FUNCTION");
    if (functionField) {
      functionField.setValidator((newValue: string) => {
        // Allow if it's a programmatic update (matches our stored value)
        if (newValue === currentFunction) {
          return newValue;
        }
        // Reject user edits by returning the current value
        return currentFunction;
      });
    }

    // Update Safe Module address when chain is detected
    const updateModuleAddress = () => {
      // Don't update if in flyout
      if (this.isInFlyout) {
        return;
      }

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

      // Update the module address field
      const moduleAddressField = this.getField("MODULE_ADDRESS");
      if (moduleAddressField) {
        if (chainId !== null) {
          const moduleAddress = getSafeModuleAddress(chainId);
          if (moduleAddress) {
            currentModuleAddress = moduleAddress;
            moduleAddressField.setValue(moduleAddress);
          } else {
            currentModuleAddress = "Not available on this chain";
            moduleAddressField.setValue("Not available on this chain");
          }
        } else {
          currentModuleAddress = "Select a chain first";
          moduleAddressField.setValue("Select a chain first");
        }
      }
    };

    // Update module address and function when block is created (only if not in flyout)
    setTimeout(() => {
      if (!this.isInFlyout) {
        updateModuleAddress();

        // Set the function signature
        const functionField = this.getField("FUNCTION");
        if (functionField) {
          currentFunction =
            "execJobFromHub(address,address,uint256,bytes,uint8)";
          functionField.setValue(
            "execJobFromHub(address,address,uint256,bytes,uint8)",
          );
        }
      }
    }, 100);

    // Listen for workspace changes to update module address when chain changes
    this.setOnChange((event: Blockly.Events.Abstract) => {
      // Skip if in flyout
      if (this.isInFlyout) {
        return;
      }

      if (
        event.type === Blockly.Events.BLOCK_CHANGE ||
        event.type === Blockly.Events.BLOCK_MOVE
      ) {
        updateModuleAddress();
      }
    });
  },
};

export const executeThroughSafeWalletGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  // Get Safe wallet address from connected block
  const safeWalletBlock = block.getInputTargetBlock("SAFE_WALLET");
  let safeWalletAddress = "";
  if (safeWalletBlock) {
    safeWalletAddress = safeWalletBlock.getFieldValue("SAFE_WALLET") || "";
  }

  // Get module address and function from fields
  const moduleAddress = block.getFieldValue("MODULE_ADDRESS") || "";
  const functionSignature = block.getFieldValue("FUNCTION") || "";

  // Output the Safe execution configuration
  const json = JSON.stringify({
    action: "execute_through_safe_wallet",
    safe_wallet: safeWalletAddress,
    safe_module_address: moduleAddress,
    function: functionSignature,
    // Target contract details would come from connected blocks
  });

  return [`// Execute Through Safe Wallet: ${json}`, Order.NONE];
};

export default executeThroughSafeWalletJson;
