import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";

const eventFilterJson = {
  type: "event_filter",
  message0: "filter by parameter %1",
  args0: [
    {
      type: "field_dropdown",
      name: "PARAMETER_NAME",
      options: [["loading...", ""]],
    },
  ],
  message1: "equals %1",
  args1: [
    {
      type: "field_input",
      name: "PARAMETER_VALUE",
      text: "value",
    },
  ],
  message2: "execute %1",
  args2: [
    {
      type: "input_statement",
      name: "ACTION",
      check: "ACTION",
    },
  ],
  previousStatement: "EVENT_FILTER",
  nextStatement: "EVENT_FILTER",
  inputsInline: false,
  colour: 220, // Using the same color as other event blocks
  tooltip:
    "Filter events based on a specific parameter value. Select the event parameter name and the value to filter by. Place action blocks inside to execute when the filter matches.",
  helpUrl: "",
};

Blockly.Blocks["event_filter"] = {
  init: function () {
    this.jsonInit(eventFilterJson);

    // Store the fetched parameters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockInstance = this as any;
    blockInstance.eventParameters = [];
    blockInstance.lastFetchedKey = "";

    // Helper function to update parameter dropdown
    const updateParameterDropdown = (
      parameters: { name?: string; type: string }[],
    ) => {
      const paramField = this.getField("PARAMETER_NAME") as unknown as {
        updateOptions?: (opts: [string, string][]) => void;
        setOptions?: (opts: [string, string][]) => void;
        menuGenerator_?: [string, string][] | (() => [string, string][]);
        setValue?: (value: string) => void;
        forceRerender?: () => void;
      } | null;

      if (!paramField) return;

      let options: [string, string][];
      if (parameters.length === 0) {
        options = [["No parameters found", ""]];
      } else {
        options = parameters.map((param, idx) => {
          const label =
            param.name && param.name.length > 0
              ? `${param.name} (${param.type})`
              : `arg${idx + 1} (${param.type})`;
          const value = param.name || `arg${idx + 1}`;
          return [label, value] as [string, string];
        });
      }

      blockInstance.eventParameters = parameters;

      if (typeof paramField.updateOptions === "function") {
        paramField.updateOptions(options);
      } else if (typeof paramField.setOptions === "function") {
        paramField.setOptions(options);
      } else {
        paramField.menuGenerator_ = options;
        paramField.forceRerender?.();
      }

      // Set first option as default if available
      if (parameters.length > 0) {
        const firstValue = parameters[0].name || "arg1";
        paramField.setValue?.(firstValue);
      } else {
        paramField.setValue?.("");
      }
    };

    // Helper function to fetch event parameters from event_listener block
    const fetchEventParameters = async () => {
      try {
        // Find parent event_listener block
        let currentBlock = this.getParent();
        let eventListenerBlock: Blockly.Block | null = null;

        while (currentBlock) {
          if (currentBlock.type === "event_listener") {
            eventListenerBlock = currentBlock;
            break;
          }
          currentBlock = currentBlock.getParent();
        }

        if (!eventListenerBlock) {
          updateParameterDropdown([]);
          const paramField = this.getField("PARAMETER_NAME") as unknown as {
            updateOptions?: (opts: [string, string][]) => void;
            setOptions?: (opts: [string, string][]) => void;
            menuGenerator_?: [string, string][] | (() => [string, string][]);
            setValue?: (value: string) => void;
            forceRerender?: () => void;
          } | null;
          if (paramField) {
            const opts: [string, string][] = [
              ["Connect to event listener", ""],
            ];
            if (typeof paramField.updateOptions === "function") {
              paramField.updateOptions(opts);
            } else if (typeof paramField.setOptions === "function") {
              paramField.setOptions(opts);
            } else {
              paramField.menuGenerator_ = opts;
              paramField.setValue?.("");
              paramField.forceRerender?.();
            }
          }
          return;
        }

        const eventName = eventListenerBlock.getFieldValue("EVENT_NAME");
        const contractAddress =
          eventListenerBlock.getFieldValue("CONTRACT_ADDRESS");

        if (
          !eventName ||
          !contractAddress ||
          !ethers.isAddress(contractAddress)
        ) {
          updateParameterDropdown([]);
          return;
        }

        // Check if we've already fetched for this event
        const fetchKey = `${contractAddress}-${eventName}`;
        if (fetchKey === blockInstance.lastFetchedKey) {
          return;
        }

        blockInstance.lastFetchedKey = fetchKey;

        // Show loading state
        const paramField = this.getField("PARAMETER_NAME") as unknown as {
          updateOptions?: (opts: [string, string][]) => void;
          setOptions?: (opts: [string, string][]) => void;
          menuGenerator_?: [string, string][] | (() => [string, string][]);
          setValue?: (value: string) => void;
          forceRerender?: () => void;
        } | null;
        if (paramField) {
          const opts: [string, string][] = [["Fetching parameters...", ""]];
          if (typeof paramField.updateOptions === "function") {
            paramField.updateOptions(opts);
          } else if (typeof paramField.setOptions === "function") {
            paramField.setOptions(opts);
          } else {
            paramField.menuGenerator_ = opts;
            paramField.setValue?.("");
            paramField.forceRerender?.();
          }
        }

        // Find chain ID
        let chainId: number | undefined = undefined;
        try {
          const allBlocks = this.workspace.getAllBlocks(
            false,
          ) as Blockly.Block[];
          const chainBlock = allBlocks.find(
            (b: Blockly.Block) => b.type === "chain_selection",
          );
          if (chainBlock) {
            const chainVal = chainBlock.getFieldValue("CHAIN_ID");
            if (chainVal) chainId = Number(chainVal);
          }
        } catch {}

        if (!chainId) {
          updateParameterDropdown([]);
          return;
        }

        // Fetch ABI
        const abiString = await fetchContractABI(
          contractAddress,
          chainId,
          false,
        );

        if (!abiString) {
          updateParameterDropdown([]);
          return;
        }

        // Parse ABI and find the event
        const abi = JSON.parse(abiString);
        const events = abi.filter(
          (item: { type: string }) => item.type === "event",
        );

        // Find matching event by signature
        const matchingEvent = events.find(
          (ev: { name: string; inputs?: Array<{ type: string }> }) => {
            const types = (ev.inputs || []).map((i) => i.type).join(",");
            const signature = `${ev.name}(${types})`;
            return signature === eventName;
          },
        );

        if (matchingEvent && matchingEvent.inputs) {
          updateParameterDropdown(matchingEvent.inputs);
        } else {
          updateParameterDropdown([]);
        }
      } catch (error) {
        console.error("Error fetching event parameters:", error);
        updateParameterDropdown([]);
      }
    };

    // Set up change handler
    this.setOnChange((event?: Blockly.Events.Abstract) => {
      if (!event) return;

      // Fetch parameters when block is moved from flyout
      if (
        event.type === Blockly.Events.BLOCK_MOVE ||
        event.type === Blockly.Events.BLOCK_CREATE
      ) {
        const ev = event as unknown as {
          blockId?: string;
          oldParentId?: string;
        };
        // Only fetch if this is the block being moved from the flyout (initial placement)
        if (ev.blockId === this.id && ev.oldParentId === undefined) {
          fetchEventParameters();
        }
      }

      // Also refetch when any parent block changes (e.g., event selection changes)
      if (event.type === Blockly.Events.BLOCK_CHANGE) {
        const ev = event as unknown as { blockId?: string; name?: string };

        // Check if the change was on a parent event_listener block
        let currentBlock = this.getParent();
        while (currentBlock) {
          if (
            currentBlock.type === "event_listener" &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (currentBlock as any).id === ev.blockId &&
            (ev.name === "EVENT_NAME" || ev.name === "CONTRACT_ADDRESS")
          ) {
            // Reset the fetch key to force refetch
            blockInstance.lastFetchedKey = "";
            setTimeout(() => fetchEventParameters(), 100);
            break;
          }
          currentBlock = currentBlock.getParent();
        }
      }
    });

    // Initial fetch if already connected
    setTimeout(() => fetchEventParameters(), 100);
  },
};

export const eventFilterGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const parameterName = block.getFieldValue("PARAMETER_NAME");
  const parameterValue = block.getFieldValue("PARAMETER_VALUE");

  const json = JSON.stringify({
    event_filter_para_name: parameterName,
    event_filter_value: parameterValue,
  });

  return [`// Event Filter: ${json}`, Order.NONE];
};

export default eventFilterJson;
