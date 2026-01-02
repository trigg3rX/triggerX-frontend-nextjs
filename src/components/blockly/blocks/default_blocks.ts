import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import networksData from "@/utils/networks.json";

// Type for network object
interface Network {
  id: number;
  name: string;
  type: string;
}

// Available chain options from networks.json - dynamically loaded
const chainOptions = (
  networksData as { supportedNetworks: Network[] }
).supportedNetworks.map((network: Network) => [
  network.name,
  network.id.toString(),
]);

// Define the JSON structure for the Chain Selection Block
const chainSelectionJson = {
  type: "chain_selection",
  message0: "Chain %1",
  args0: [
    {
      type: "field_dropdown",
      name: "CHAIN_ID",
      options: chainOptions,
    },
  ],
  inputsInline: true,
  nextStatement: "JOB_TYPE", // Only job type wrappers can connect below
  colour: "#1CD35F", // Green color for chain
  tooltip: "Specify the chain at which your job contract is deployed.",
  helpUrl: "",
};

// Global variable to store the connected chain ID for validation
let connectedChainId: string | null = null;

// Function to set the connected chain ID (called from React component)
export function setConnectedChainId(chainId: string | null) {
  connectedChainId = chainId;
}

// Validator function for chain selection
function validateChainSelection(newValue: string): string | null {
  // If no chain is connected, allow any selection
  if (!connectedChainId) {
    return newValue;
  }
  // Only allow selection of the connected chain
  if (newValue === connectedChainId) {
    return newValue;
  }
  // Revert to connected chain if user tries to select a different one
  return connectedChainId;
}

// Register the Chain Selection Block using jsonInit
Blockly.Blocks["chain_selection"] = {
  init: function () {
    this.jsonInit(chainSelectionJson);

    // Add validator to the CHAIN_ID field to prevent selecting non-connected chains
    const chainField = this.getField("CHAIN_ID");
    if (chainField) {
      chainField.setValidator(validateChainSelection);
    }

    // Set tooltip
    this.setTooltip(
      "Specify the chain at which your job contract is deployed. Only the connected chain can be selected.",
    );
  },
};

export const chainSelectionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const chainId = block.getFieldValue("CHAIN_ID");
  const json = JSON.stringify({ target_chain_id: chainId });
  return [`// ⛓️ Chain Configuration: ${json}`, Order.NONE];
};
