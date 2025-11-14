import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";

// Helper function to extract events from ABI
const extractEvents = (abi: string) => {
  try {
    const parsedABI = JSON.parse(abi);
    return parsedABI.filter((item: { type: string }) => item.type === "event");
  } catch (error) {
    console.error("Error parsing ABI:", error);
    return [];
  }
};

// Helper function to format event signature
const formatEventSignature = (name: string, inputs: { type: string }[]) =>
  `${name}(${inputs.map((input) => input.type).join(",")})`;

const eventListenerJson = {
  type: "event_listener",
  message0: "Listen for %1 on contract %2",
  args0: [
    {
      type: "field_dropdown",
      name: "EVENT_NAME",
      options: [["select an event", ""]],
    },
    {
      type: "field_input",
      name: "CONTRACT_ADDRESS",
      text: "0x...",
      spellcheck: false,
    },
  ],
  message1: "then %1",
  args1: [
    {
      type: "input_statement",
      name: "ACTION",
      check: ["EVENT_FILTER", "ACTION"],
    },
  ],
  previousStatement: "EVENT_CONFIG",
  nextStatement: "UTILITY_END",
  colour: 220, // Using the same color as other event/schedule blocks
  tooltip:
    "Specify the event that needs to be detected on-chain and the contract address. Optionally add a filter block, then connect a contract action to execute.",
  helpUrl: "",
};

Blockly.Blocks["event_listener"] = {
  init: function () {
    this.jsonInit(eventListenerJson);

    // Add validator to CONTRACT_ADDRESS field to fetch events when address changes
    const contractAddressField = this.getField("CONTRACT_ADDRESS");
    if (contractAddressField) {
      contractAddressField.setValidator((newValue: string) => {
        // Validate address format first
        if (ethers.isAddress(newValue)) {
          const eventDropdown = this.getField("EVENT_NAME");

          // Show "Fetching ABI..." immediately
          if (eventDropdown) {
            (
              eventDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Fetching ABI...", ""]];
            eventDropdown.setValue("");
          }

          // Fetch ABI asynchronously (non-blocking)
          (async () => {
            try {
              // Traverse up the parent blocks to find the chain_selection block
              let currentBlock = this.getParent();
              let chainId = 1; // Default to mainnet if not found

              while (currentBlock) {
                if (currentBlock.type === "chain_selection") {
                  const chainIdValue = currentBlock.getFieldValue("CHAIN_ID");
                  chainId = parseInt(chainIdValue, 10);
                  break;
                }
                currentBlock = currentBlock.getParent();
              }

              const abiString = await fetchContractABI(
                newValue,
                chainId,
                false,
              );

              if (abiString) {
                const events = extractEvents(abiString);
                const eventDropdown = this.getField("EVENT_NAME");

                if (eventDropdown) {
                  if (events.length > 0) {
                    // Create dropdown options from events
                    const options = events.map(
                      (event: { name: string; inputs: { type: string }[] }) => [
                        formatEventSignature(event.name, event.inputs || []),
                        formatEventSignature(event.name, event.inputs || []),
                      ],
                    );

                    // Update dropdown options
                    (
                      eventDropdown as unknown as { menuGenerator_: string[][] }
                    ).menuGenerator_ = options;

                    // Set the first event as default
                    eventDropdown.setValue(options[0][1]);
                  } else {
                    // No events found in ABI
                    (
                      eventDropdown as unknown as { menuGenerator_: string[][] }
                    ).menuGenerator_ = [["No events found", ""]];
                    eventDropdown.setValue("");
                  }
                }
              } else {
                // ABI not found
                const eventDropdown = this.getField("EVENT_NAME");
                if (eventDropdown) {
                  (
                    eventDropdown as unknown as { menuGenerator_: string[][] }
                  ).menuGenerator_ = [["ABI not found", ""]];
                  eventDropdown.setValue("");
                }
              }
            } catch (error) {
              console.error("Error fetching contract ABI:", error);
              const eventDropdown = this.getField("EVENT_NAME");
              if (eventDropdown) {
                (
                  eventDropdown as unknown as { menuGenerator_: string[][] }
                ).menuGenerator_ = [["Error fetching ABI", ""]];
                eventDropdown.setValue("");
              }
            }
          })();
        } else if (newValue && newValue !== "0x...") {
          // Invalid address format
          const eventDropdown = this.getField("EVENT_NAME");
          if (eventDropdown) {
            (
              eventDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Invalid address format", ""]];
            eventDropdown.setValue("");
          }
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
      const eventDropdown = this.getField("EVENT_NAME");

      // If not in flyout and contract address is empty or default
      if (
        !this.isInFlyout &&
        eventDropdown &&
        (!contractAddress || contractAddress === "0x...")
      ) {
        (
          eventDropdown as unknown as { menuGenerator_: string[][] }
        ).menuGenerator_ = [["Enter contract address", ""]];
        eventDropdown.setValue("");
      }
    }
  },
};

export const eventListenerGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const eventName = block.getFieldValue("EVENT_NAME");
  const contractAddress = block.getFieldValue("CONTRACT_ADDRESS");

  // Check for filter blocks in the ACTION chain
  let filterParaName = "";
  let filterValue = "";

  const firstBlock = block.getInputTargetBlock("ACTION");
  if (firstBlock && firstBlock.type === "event_filter") {
    filterParaName = firstBlock.getFieldValue("PARAMETER_NAME") || "";
    filterValue = firstBlock.getFieldValue("PARAMETER_VALUE") || "";
  }

  const json = JSON.stringify({
    trigger_event: eventName,
    trigger_contract_address: contractAddress,
    event_filter_para_name: filterParaName,
    event_filter_value: filterValue,
  });

  return [`// Event Listener: ${json}`, Order.NONE];
};

export default eventListenerJson;
