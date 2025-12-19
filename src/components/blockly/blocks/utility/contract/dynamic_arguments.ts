import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Global handler that React can set to open the IPFS Script Wizard
let openDynamicArgsWizardHandler: (() => void) | null = null;

export function setOpenDynamicArgsWizardHandler(handler: () => void): void {
  openDynamicArgsWizardHandler = handler;
}

// Helper to push the selected IPFS URL back into all dynamic_arguments blocks
// We store it in `block.data` and mirror it into a visible field for validation.
export function updateDynamicArgsIpfsUrl(ipfsUrl: string): void {
  try {
    const workspace = Blockly.getMainWorkspace();
    if (!workspace) return;

    const allBlocks = workspace.getAllBlocks(false);
    allBlocks.forEach((block) => {
      if (block.type === "dynamic_arguments") {
        block.data = ipfsUrl;
        const field = block.getField("IPFS_URL");
        if (field) {
          field.setValue(ipfsUrl);
        }
      }
    });
  } catch (error) {
    console.error("Error updating dynamic arguments IPFS URL:", error);
  }
}

const dynamicArgumentsJson = {
  type: "dynamic_arguments",
  message0: "fetch values dynmically from script",
  message1: "%1",
  args1: [
    {
      // Custom button field (registered in create_safe_wallet.ts)
      type: "field_button",
      name: "OPEN_WIZARD",
      text: "Upload Script",
    },
  ],
  message2: "ipfs url %1",
  args2: [
    {
      type: "field_input",
      name: "IPFS_URL",
      text: "ipfs://...",
    },
  ],
  // No visible IPFS URL field here – URL is only shown in the Job Form UI,
  // and is stored in block.data for syncing.
  // Use SAFE_TRANSACTION connection type so it can plug into execute_through_safe_wallet
  previousStatement: "SAFE_TRANSACTION",
  nextStatement: "ARGUMENTS_END",
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

    // Keep the field value in sync with block.data when the block loads
    const ipfsField = this.getField("IPFS_URL") as Blockly.Field | null;
    if (ipfsField && this.data) {
      ipfsField.setValue(this.data);
    }

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

  // Serialize the IPFS URL to XML using mutationToDom
  mutationToDom: function (): Element {
    const container = Blockly.utils.xml.createElement("mutation");
    const ipfsUrl =
      (this.data as string) || this.getFieldValue("IPFS_URL") || "";
    if (ipfsUrl && ipfsUrl !== "ipfs://...") {
      container.setAttribute("ipfs_url", ipfsUrl);
    }
    return container;
  },

  // Deserialize the IPFS URL from XML using domToMutation
  domToMutation: function (xmlElement: Element): void {
    const ipfsUrl = xmlElement.getAttribute("ipfs_url") || "";
    if (ipfsUrl) {
      this.data = ipfsUrl;
      const ipfsField = this.getField("IPFS_URL");
      if (ipfsField) {
        ipfsField.setValue(ipfsUrl);
      }
    }
  },

  // Ensure this block is only used under execute_function or execute_through_safe_wallet
  onchange: function (event: Blockly.Events.Abstract) {
    if (!this.workspace || this.isInFlyout) {
      return;
    }

    if (
      event.type !== Blockly.Events.BLOCK_MOVE &&
      event.type !== Blockly.Events.BLOCK_CREATE
    ) {
      return;
    }

    const parent = this.getParent();
    const allowedParents = ["execute_function", "execute_through_safe_wallet"];

    if (parent && !allowedParents.includes(parent.type)) {
      this.setWarningText(
        "Dynamic Arguments can only be used under an Execute Function or Execute Through Safe Wallet block.",
      );

      // Detach from invalid parent while keeping stack intact
      setTimeout(() => {
        this.unplug(true);
      }, 0);
    } else {
      this.setWarningText(null);
    }
  },
};

export const dynamicArgumentsGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const functionName = block.getFieldValue("FUNCTION_NAME");
  const ipfsUrl =
    block.getFieldValue("IPFS_URL") || (block.data as string) || "";

  const json = JSON.stringify({
    function_name: functionName,
    argument_type: "dynamic",
    ipfs_url: ipfsUrl,
  });

  return [`// Dynamic Arguments: ${json}`, Order.NONE];
};

export default dynamicArgumentsJson;
