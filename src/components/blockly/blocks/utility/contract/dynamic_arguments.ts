import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Global handler that React can set to open the IPFS Script Wizard
let openDynamicArgsWizardHandler: (() => void) | null = null;

export function setOpenDynamicArgsWizardHandler(handler: () => void): void {
  openDynamicArgsWizardHandler = handler;
}

// Helper to push the selected IPFS URL back into all dynamic_arguments blocks
export function updateDynamicArgsIpfsUrl(ipfsUrl: string): void {
  try {
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;

    const allBlocks = workspace.getAllBlocks(false);
    allBlocks.forEach((block) => {
      if (block.type === "dynamic_arguments") {
        block.setFieldValue(ipfsUrl, "IPFS_URL");
      }
    });
  } catch (error) {
     
    console.error("Error updating dynamic arguments IPFS URL:", error);
  }
}

const dynamicArgumentsJson = {
  type: "dynamic_arguments",
  message0: "fetch values dynmically from %1 %2",
  args0: [
    {
      type: "field_input",
      name: "IPFS_URL",
      text: "ipfs://...",
    },
    {
      // Custom button field (registered in create_safe_wallet.ts)
      type: "field_button",
      name: "OPEN_WIZARD",
      text: "Open Wizard",
    },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 190,
  tooltip:
    "Specify (or generate) the IPFS URL link from which the values of arguments have to be fetched.",
  helpUrl: "",
};

Blockly.Blocks["dynamic_arguments"] = {
  init: function () {
    this.jsonInit(dynamicArgumentsJson);

    // Attach click handler to the button field to open the React wizard
    const buttonField = this.getField("OPEN_WIZARD") as Blockly.Field | null;

    // The actual class is ButtonField from create_safe_wallet.ts, which exposes setClickHandler.
    // We access it via `any` to avoid a hard dependency here.
    if (
      buttonField &&
      (buttonField as unknown as { setClickHandler?: (fn: () => void) => void })
        .setClickHandler
    ) {
      (
        buttonField as unknown as { setClickHandler: (fn: () => void) => void }
      ).setClickHandler(() => {
        if (openDynamicArgsWizardHandler) {
          openDynamicArgsWizardHandler();
        } else {
           
          console.warn("Dynamic arguments IPFS wizard handler not set");
        }
      });
    }
  },
};

export const dynamicArgumentsGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const ipfsUrl = block.getFieldValue("IPFS_URL");

  const json = JSON.stringify({
    function_name: functionName,
    argument_type: "dynamic",
    ipfs_url: ipfsUrl,
  });

  return [`// Dynamic Arguments: ${json}`, Order.NONE];
};

export default dynamicArgumentsJson;
