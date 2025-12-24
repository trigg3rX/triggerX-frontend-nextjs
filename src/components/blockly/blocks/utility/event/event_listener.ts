import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";
import { devLog } from "@/lib/devLog";

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

// Helper function to fetch and update ABI for a block
const fetchAndUpdateABI = async (
  block: Blockly.Block,
  contractAddress: string,
  chainId: number,
) => {
  try {
    const abiString = await fetchContractABI(contractAddress, chainId, false);

    if (abiString) {
      const events = extractEvents(abiString);
      const eventDropdown = block.getField("EVENT_NAME");

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

          // Hide manual ABI input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (block as any).setShowManualABI(false);
        } else {
          // No events found in ABI
          (
            eventDropdown as unknown as { menuGenerator_: string[][] }
          ).menuGenerator_ = [["No events found", ""]];
          eventDropdown.setValue("");

          // Show manual ABI input
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (block as any).setShowManualABI(true);
        }
      }
    } else {
      // ABI not found
      const eventDropdown = block.getField("EVENT_NAME");
      if (eventDropdown) {
        (
          eventDropdown as unknown as { menuGenerator_: string[][] }
        ).menuGenerator_ = [["ABI not found", ""]];
        eventDropdown.setValue("");
      }

      // Show manual ABI input
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (block as any).setShowManualABI(true);
    }
  } catch (error) {
    console.error("Error fetching contract ABI:", error);
    const eventDropdown = block.getField("EVENT_NAME");
    if (eventDropdown) {
      (
        eventDropdown as unknown as { menuGenerator_: string[][] }
      ).menuGenerator_ = [["Error fetching ABI", ""]];
      eventDropdown.setValue("");
    }

    // Show manual ABI input on error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (block as any).setShowManualABI(true);
  }
};

const eventListenerJson = {
  type: "event_listener",
  message0: "Listen for %1",
  args0: [
    {
      type: "field_dropdown",
      name: "EVENT_NAME",
      options: [["select an event", ""]],
    },
  ],
  message1: "on contract %1",
  args1: [
    {
      type: "field_input",
      name: "CONTRACT_ADDRESS",
      text: "0x...",
      spellcheck: false,
    },
  ],
  message2: "then %1",
  args2: [
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

    // Store the last fetched address to track changes
    let lastFetchedAddress = "";

    // Add validator to CONTRACT_ADDRESS field to fetch events when address changes
    const contractAddressField = this.getField("CONTRACT_ADDRESS");
    if (contractAddressField) {
      contractAddressField.setValidator((newValue: string) => {
        // Normalize the value
        const normalizedValue = newValue?.trim() || "";

        // Check if address was removed or cleared
        if (!normalizedValue || normalizedValue === "0x...") {
          const eventDropdown = this.getField("EVENT_NAME");
          if (eventDropdown) {
            (
              eventDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Enter contract address", ""]];
            eventDropdown.setValue("");
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
              let chainId: number | null = null;

              // First, try to find chain_selection in parent blocks (connected)
              let currentBlock = this.getParent();
              while (currentBlock) {
                if (currentBlock.type === "chain_selection") {
                  const chainIdValue = currentBlock.getFieldValue("CHAIN_ID");
                  chainId = parseInt(chainIdValue, 10);
                  break;
                }
                currentBlock = currentBlock.getParent();
              }

              // If not found in parents, search the entire workspace for any chain_selection block
              if (chainId === null && this.workspace) {
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
                const eventDropdown = this.getField("EVENT_NAME");
                if (eventDropdown) {
                  (
                    eventDropdown as unknown as { menuGenerator_: string[][] }
                  ).menuGenerator_ = [["Select a chain first", ""]];
                  eventDropdown.setValue("");
                }
                return;
              }

              await fetchAndUpdateABI(this, normalizedValue, chainId);
            } catch (error) {
              console.error("Error in validator:", error);
            }
          })();
        } else {
          // Invalid address format
          const eventDropdown = this.getField("EVENT_NAME");
          if (eventDropdown) {
            (
              eventDropdown as unknown as { menuGenerator_: string[][] }
            ).menuGenerator_ = [["Invalid address format", ""]];
            eventDropdown.setValue("");
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

    // Store last known chain ID to detect actual chain changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockInstance = this as any;
    if (blockInstance.lastKnownChainId === undefined) {
      blockInstance.lastKnownChainId = null;
    }

    // Handle manual ABI input changes
    if (event.type === Blockly.Events.BLOCK_CHANGE) {
      const changeEvent = event as Blockly.Events.BlockChange;

      // Check if ABI_TEXT field changed in a connected manual_abi_input block
      if (changeEvent.name === "ABI_TEXT") {
        const changedBlock = this.workspace.getBlockById(changeEvent.blockId);
        if (changedBlock && changedBlock.type === "manual_abi_input") {
          // Check if this manual_abi_input block is connected to this event_listener
          const manualAbiBlock = this.getInputTargetBlock("MANUAL_ABI");
          if (manualAbiBlock && manualAbiBlock.id === changedBlock.id) {
            const abiText = changedBlock.getFieldValue("ABI_TEXT");

            try {
              const parsedABI = JSON.parse(abiText);

              // Check if it's a valid event ABI structure
              if (Array.isArray(parsedABI) && parsedABI.length > 0) {
                // Filter for event type entries or treat all as events if no type specified
                const events = parsedABI.filter(
                  (item: { type?: string }) =>
                    !item.type || item.type === "event",
                );

                if (events.length > 0) {
                  const eventDropdown = this.getField("EVENT_NAME");
                  if (eventDropdown) {
                    // Create dropdown options from manual ABI
                    const options = events.map(
                      (event: {
                        name?: string;
                        inputs?: { type: string }[];
                      }) => {
                        const name = event.name || "UnnamedEvent";
                        const signature = formatEventSignature(
                          name,
                          event.inputs || [],
                        );
                        return [signature, signature];
                      },
                    );

                    // Update dropdown options
                    (
                      eventDropdown as unknown as { menuGenerator_: string[][] }
                    ).menuGenerator_ = options;

                    // Set the first event as default
                    eventDropdown.setValue(options[0][1]);
                  }
                } else {
                  // No valid events in manual ABI
                  const eventDropdown = this.getField("EVENT_NAME");
                  if (eventDropdown) {
                    (
                      eventDropdown as unknown as { menuGenerator_: string[][] }
                    ).menuGenerator_ = [["No events in manual ABI", ""]];
                    eventDropdown.setValue("");
                  }
                }
              }
            } catch (error) {
              // Invalid JSON in manual ABI
              devLog(error);
              const eventDropdown = this.getField("EVENT_NAME");
              if (eventDropdown) {
                (
                  eventDropdown as unknown as { menuGenerator_: string[][] }
                ).menuGenerator_ = [["Invalid JSON format", ""]];
                eventDropdown.setValue("");
              }
            }
          }
        }
      }

      // Check if a chain_selection block's CHAIN_ID field changed
      if (changeEvent.name === "CHAIN_ID") {
        const changedBlock = this.workspace.getBlockById(changeEvent.blockId);
        if (changedBlock && changedBlock.type === "chain_selection") {
          const contractAddress = this.getFieldValue("CONTRACT_ADDRESS");

          if (
            contractAddress &&
            contractAddress !== "0x..." &&
            ethers.isAddress(contractAddress)
          ) {
            const newChainId = parseInt(changeEvent.newValue as string, 10);

            // Update last known chain ID and fetch
            blockInstance.lastKnownChainId = newChainId;

            const eventDropdown = this.getField("EVENT_NAME");
            if (eventDropdown) {
              (
                eventDropdown as unknown as { menuGenerator_: string[][] }
              ).menuGenerator_ = [["Fetching ABI...", ""]];
              eventDropdown.setValue("");
            }

            // Fetch ABI asynchronously
            (async () => {
              await fetchAndUpdateABI(this, contractAddress, newChainId);
            })();
          }
        }
      }
    }

    // When block is moved from flyout to workspace or created
    if (
      event.type === Blockly.Events.BLOCK_MOVE ||
      event.type === Blockly.Events.BLOCK_CREATE
    ) {
      const moveEvent = event as Blockly.Events.BlockMove;

      // Only handle events for chain_selection blocks being added/removed
      // or this block being moved from flyout
      const isChainBlockEvent =
        moveEvent.blockId &&
        this.workspace.getBlockById(moveEvent.blockId)?.type ===
          "chain_selection";
      const isThisBlockFromFlyout =
        moveEvent.blockId === this.id && moveEvent.oldParentId === undefined;

      if (!isChainBlockEvent && !isThisBlockFromFlyout) {
        return;
      }

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

      // Auto-fetch ABI when chain becomes available or changes
      if (!this.isInFlyout && contractAddress && contractAddress !== "0x...") {
        let chainId: number | null = null;

        // First, try to find chain_selection in parent blocks (connected)
        let currentBlock = this.getParent();
        while (currentBlock) {
          if (currentBlock.type === "chain_selection") {
            const chainIdValue = currentBlock.getFieldValue("CHAIN_ID");
            chainId = parseInt(chainIdValue, 10);
            break;
          }
          currentBlock = currentBlock.getParent();
        }

        // If not found in parents, search the entire workspace for any chain_selection block
        if (chainId === null && this.workspace) {
          const allBlocks = this.workspace.getAllBlocks(false);
          for (const block of allBlocks) {
            if (block.type === "chain_selection" && !block.isInFlyout) {
              const chainIdValue = block.getFieldValue("CHAIN_ID");
              chainId = parseInt(chainIdValue, 10);
              break;
            }
          }
        }

        // Only fetch if chain ID actually changed
        if (chainId !== blockInstance.lastKnownChainId) {
          blockInstance.lastKnownChainId = chainId;

          // If we found a chain and have a valid contract address, trigger fetch
          if (chainId !== null && ethers.isAddress(contractAddress)) {
            const eventDropdown = this.getField("EVENT_NAME");

            // Show "Fetching ABI..." immediately
            if (eventDropdown) {
              (
                eventDropdown as unknown as { menuGenerator_: string[][] }
              ).menuGenerator_ = [["Fetching ABI...", ""]];
              eventDropdown.setValue("");
            }

            // Fetch ABI asynchronously
            (async () => {
              await fetchAndUpdateABI(this, contractAddress, chainId);
            })();
          }
        }
      }
    }
  },
  setShowManualABI: function (show: boolean) {
    if (show && !this.getInput("MANUAL_ABI")) {
      this.appendValueInput("MANUAL_ABI")
        .setCheck("MANUAL_ABI_TYPE")
        .appendField("manual ABI");
    } else if (!show && this.getInput("MANUAL_ABI")) {
      this.removeInput("MANUAL_ABI");
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
