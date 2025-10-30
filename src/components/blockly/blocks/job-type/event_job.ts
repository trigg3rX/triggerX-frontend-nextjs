import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";

interface EventJobData {
  trigger_chain_id: number;
  trigger_contract_address: string;
  trigger_event: string;
  event_filter_para_name?: string;
  event_filter_value?: string;
}

const eventJobJson = {
  type: "event_job",
  // Compact, multi-line layout to reduce width
  message0: "Runs when event is detected",
  message1: "from contract %1",
  message2: "Execute: %1",
  args0: [],
  args1: [
    {
      type: "field_input",
      name: "TRIGGER_CONTRACT_ADDRESS",
      text: "0x...",
    },
  ],
  args2: [
    {
      type: "input_statement",
      name: "STATEMENT",
      check: null,
    },
  ],
  inputsInline: false,
  previousStatement: null,
  nextStatement: null,
  colour: 210,
  tooltip:
    "Runs when event is detected from contract. Optionally filter by a parameter name and value.",
  helpUrl: "",
};

Blockly.Blocks["event_job"] = {
  init: function () {
    this.jsonInit(eventJobJson);
  },
  onchange: function (e: Blockly.Events.Abstract) {
    type FieldDropdownLike = {
      setOptions?: (opts: [string, string][]) => void;
      updateOptions?: (opts: [string, string][]) => void;
      menuGenerator_?: [string, string][] | (() => [string, string][]);
      setValue?: (value: string) => void;
      forceRerender?: () => void;
    };
    // Only react to changes on this block
    if (!this.workspace || this.isInFlyout) return;
    if (e.type !== Blockly.Events.CHANGE) return;
    const change = e as unknown as { blockId?: string; name?: string };
    if (change.blockId !== this.id) return;
    // If contract address changed, refetch events
    if (change.name === "TRIGGER_CONTRACT_ADDRESS") {
      const addressField = this.getField("TRIGGER_CONTRACT_ADDRESS");
      const address = addressField ? String(addressField.getValue()) : "";
      if (!address || address.length < 4) {
        // Remove event row entirely when contract is cleared
        try {
          if (this.getInput("EVENT_INPUT"))
            this.removeInput("EVENT_INPUT", true);
        } catch {}
        try {
          if (this.getInput("FILTER_INPUT"))
            this.removeInput("FILTER_INPUT", true);
        } catch {}
        try {
          if (this.getInput("FILTER_VALUE_INPUT"))
            this.removeInput("FILTER_VALUE_INPUT", true);
        } catch {}
        return;
      }

      // Validate EVM address early
      if (!ethers.isAddress(address)) {
        // Show event row with invalid state
        try {
          if (!this.getInput("EVENT_INPUT")) {
            const dd = new (
              Blockly as unknown as {
                FieldDropdown: new (opts: [string, string][]) => unknown;
              }
            ).FieldDropdown([["Invalid address", ""]]);
            this.appendDummyInput("EVENT_INPUT")
              .appendField("event ")
              .appendField(dd as unknown as Blockly.Field, "TRIGGER_EVENT");
          } else {
            const eventField = this.getField(
              "TRIGGER_EVENT",
            ) as unknown as FieldDropdownLike | null;
            if (eventField) {
              const opts: [string, string][] = [["Invalid address", ""]];
              if (typeof eventField.updateOptions === "function")
                eventField.updateOptions(opts);
              else if (typeof eventField.setOptions === "function")
                eventField.setOptions(opts);
              else {
                eventField.menuGenerator_ = opts;
                eventField.setValue?.("");
                eventField.forceRerender?.();
              }
            }
          }
        } catch {}
        try {
          if (this.getInput("FILTER_INPUT"))
            this.removeInput("FILTER_INPUT", true);
        } catch {}
        return;
      }

      // Find chain ID from any chain_selection block in the workspace
      let chainId: number | undefined = undefined;
      try {
        const allBlocks = this.workspace.getAllBlocks(false) as Blockly.Block[];
        const chainBlock = (allBlocks as Blockly.Block[]).find(
          (b: Blockly.Block) => b.type === "chain_selection",
        );
        if (chainBlock) {
          const chainVal = chainBlock.getFieldValue("CHAIN_ID");
          if (chainVal) chainId = Number(chainVal);
        }
      } catch {}

      // Require chain selection to know which explorer to query
      if (!chainId) {
        try {
          if (!this.getInput("EVENT_INPUT")) {
            const dd = new (
              Blockly as unknown as {
                FieldDropdown: new (opts: [string, string][]) => unknown;
              }
            ).FieldDropdown([["Select chain first", ""]]);
            this.appendDummyInput("EVENT_INPUT")
              .appendField("event ")
              .appendField(dd as unknown as Blockly.Field, "TRIGGER_EVENT");
          } else {
            const eventFieldForPre = this.getField(
              "TRIGGER_EVENT",
            ) as unknown as FieldDropdownLike | null;
            if (eventFieldForPre) {
              const opts: [string, string][] = [["Select chain first", ""]];
              if (typeof eventFieldForPre.updateOptions === "function")
                eventFieldForPre.updateOptions(opts);
              else if (typeof eventFieldForPre.setOptions === "function")
                eventFieldForPre.setOptions(opts);
              else {
                eventFieldForPre.menuGenerator_ = opts;
                eventFieldForPre.setValue?.("");
                eventFieldForPre.forceRerender?.();
              }
            }
          }
        } catch {}
        try {
          if (this.getInput("FILTER_INPUT"))
            this.removeInput("FILTER_INPUT", true);
        } catch {}
        return;
      }

      // Fetch ABI and populate events dropdown
      (async () => {
        try {
          // Ensure event row exists and show loading
          let eventField = this.getField(
            "TRIGGER_EVENT",
          ) as unknown as FieldDropdownLike | null;
          if (!this.getInput("EVENT_INPUT")) {
            const dd = new (
              Blockly as unknown as {
                FieldDropdown: new (opts: [string, string][]) => unknown;
              }
            ).FieldDropdown([["Loading events...", ""]]);
            this.appendDummyInput("EVENT_INPUT")
              .appendField("event ")
              .appendField(dd as unknown as Blockly.Field, "TRIGGER_EVENT");
            eventField = this.getField(
              "TRIGGER_EVENT",
            ) as unknown as FieldDropdownLike | null;
          } else if (eventField) {
            const loading: [string, string][] = [["Loading events...", ""]];
            if (typeof eventField.updateOptions === "function")
              eventField.updateOptions(loading);
            else if (typeof eventField.setOptions === "function")
              eventField.setOptions(loading);
            else {
              eventField.menuGenerator_ = loading;
              eventField.setValue?.("");
              eventField.forceRerender?.();
            }
          }

          const abiString = await fetchContractABI(address, chainId);
          if (!eventField) return;

          if (!abiString) {
            const opts: [string, string][] = [["No events found", ""]];
            if (typeof eventField.updateOptions === "function")
              eventField.updateOptions(opts);
            else if (typeof eventField.setOptions === "function")
              eventField.setOptions(opts);
            else {
              eventField.menuGenerator_ = opts;
              eventField.setValue?.("");
              eventField.forceRerender?.();
            }
            return;
          }
          let abi: Array<{
            type?: string;
            name?: string;
            inputs?: Array<{ type: string; name?: string }>;
          }> = [];
          try {
            abi = JSON.parse(abiString);
          } catch {
            abi = [];
          }
          const events = abi.filter(
            (item) =>
              item && item.type === "event" && typeof item.name === "string",
          );
          if (events.length === 0) {
            const opts: [string, string][] = [["No events found", ""]];
            if (typeof eventField.updateOptions === "function")
              eventField.updateOptions(opts);
            else if (typeof eventField.setOptions === "function")
              eventField.setOptions(opts);
            else {
              eventField.menuGenerator_ = opts;
              eventField.setValue?.("");
              eventField.forceRerender?.();
            }
            return;
          }
          const formatSignature = (
            name: string,
            inputs?: Array<{ type: string }>,
          ) => {
            const types = (inputs || []).map((i) => i.type).join(",");
            return `${name}(${types})`;
          };
          // Build event dropdown options and store inputs map for later use
          const inputsMap: Record<string, { name?: string; type: string }[]> =
            {};
          const options = events
            .slice(0, 50) // cap to avoid overly long dropdowns
            .map((ev) => {
              const inputsArr = (
                (ev.inputs as Array<{ type: string; name?: string }>) || []
              ).map((i) => ({ name: i.name, type: i.type }));
              const label = formatSignature(
                ev.name as string,
                ev.inputs as Array<{ type: string }>,
              );
              inputsMap[label] = inputsArr;
              return [label, label] as [string, string];
            });
          (
            this as unknown as {
              __eventInputsMap?: Record<
                string,
                { name?: string; type: string }[]
              >;
            }
          ).__eventInputsMap = inputsMap;
          {
            const opts: [string, string][] = [["Select event", ""], ...options];
            if (typeof eventField.updateOptions === "function")
              eventField.updateOptions(opts);
            else if (typeof eventField.setOptions === "function")
              eventField.setOptions(opts);
            else {
              eventField.menuGenerator_ = opts;
              eventField.setValue?.("");
              eventField.forceRerender?.();
            }
          }
        } catch {
          try {
            let eventField = this.getField(
              "TRIGGER_EVENT",
            ) as unknown as FieldDropdownLike | null;
            if (!this.getInput("EVENT_INPUT")) {
              const dd = new (
                Blockly as unknown as {
                  FieldDropdown: new (opts: [string, string][]) => unknown;
                }
              ).FieldDropdown([["Error loading events", ""]]);
              this.appendDummyInput("EVENT_INPUT")
                .appendField("event ")
                .appendField(dd as unknown as Blockly.Field, "TRIGGER_EVENT");
              eventField = this.getField(
                "TRIGGER_EVENT",
              ) as unknown as FieldDropdownLike | null;
            }
            const opts: [string, string][] = [["Error loading events", ""]];
            if (eventField) {
              if (typeof eventField.updateOptions === "function")
                eventField.updateOptions(opts);
              else if (typeof eventField.setOptions === "function")
                eventField.setOptions(opts);
              else {
                eventField.menuGenerator_ = opts;
                eventField.setValue?.("");
                eventField.forceRerender?.();
              }
            }
          } catch {}
        }
      })();
    }
    // Toggle filter UI when event selection changes
    if (change.name === "TRIGGER_EVENT") {
      const selected = String(this.getFieldValue("TRIGGER_EVENT") || "");
      // Rebuild the filter row entirely based on current event
      try {
        if (this.getInput("FILTER_INPUT"))
          this.removeInput("FILTER_INPUT", true);
      } catch {}
      try {
        if (this.getInput("FILTER_VALUE_INPUT"))
          this.removeInput("FILTER_VALUE_INPUT", true);
      } catch {}
      if (!selected) {
        return;
      }
      const mapHolder = this as unknown as {
        __eventInputsMap?: Record<string, { name?: string; type: string }[]>;
      };
      const inputsForEvent = mapHolder.__eventInputsMap?.[selected] || [];
      const opts: [string, string][] = [["No filter", ""]];
      inputsForEvent.forEach((inp, idx) => {
        const label =
          inp.name && inp.name.length > 0 ? inp.name : `arg${idx + 1}`;
        opts.push([label, label]);
      });
      const dd = new (
        Blockly as unknown as {
          FieldDropdown: new (o: [string, string][]) => unknown;
        }
      ).FieldDropdown(opts);
      const input = this.appendDummyInput("FILTER_INPUT")
        .appendField("filter ")
        .appendField(
          dd as unknown as Blockly.Field,
          "EVENT_FILTER_PARA_NAME",
        ) as Blockly.Input;
      const current = String(
        this.getFieldValue("EVENT_FILTER_PARA_NAME") || "",
      );
      if (current) {
        input.appendField(" = ");
        input.appendField(new Blockly.FieldTextInput(""), "EVENT_FILTER_VALUE");
        // Open the editor immediately so the wider HTML input is used
        try {
          (
            this.getField("EVENT_FILTER_VALUE") as unknown as {
              showEditor_: () => void;
            }
          ).showEditor_();
        } catch {}
      }
    }

    // When filter parameter dropdown changes, rebuild same-line filter with or without value
    if (change.name === "EVENT_FILTER_PARA_NAME") {
      const selectedParam = String(
        this.getFieldValue("EVENT_FILTER_PARA_NAME") || "",
      );
      // Recreate filter row to ensure parameter and value are on the same line
      // Preserve current value if present
      const prevValue = String(this.getFieldValue("EVENT_FILTER_VALUE") || "");
      try {
        if (this.getInput("FILTER_INPUT"))
          this.removeInput("FILTER_INPUT", true);
      } catch {}
      // Rebuild dropdown options from cached map
      const selectedEvent = String(this.getFieldValue("TRIGGER_EVENT") || "");
      const mapHolder = this as unknown as {
        __eventInputsMap?: Record<string, { name?: string; type: string }[]>;
      };
      const inputsForEvent = mapHolder.__eventInputsMap?.[selectedEvent] || [];
      const opts: [string, string][] = [["No filter", ""]];
      inputsForEvent.forEach((inp, idx) => {
        const label =
          inp.name && inp.name.length > 0 ? inp.name : `arg${idx + 1}`;
        opts.push([label, label]);
      });
      const dd = new (
        Blockly as unknown as {
          FieldDropdown: new (o: [string, string][]) => unknown;
        }
      ).FieldDropdown(opts);
      const input = this.appendDummyInput("FILTER_INPUT")
        .appendField("filter ")
        .appendField(
          dd as unknown as Blockly.Field,
          "EVENT_FILTER_PARA_NAME",
        ) as Blockly.Input;
      // Set the dropdown to the selected value
      (this.getField("EVENT_FILTER_PARA_NAME") as Blockly.Field).setValue(
        selectedParam,
      );
      if (selectedParam) {
        input.appendField(" = ");
        input.appendField(
          new Blockly.FieldTextInput(prevValue),
          "EVENT_FILTER_VALUE",
        );
        // Focus editor immediately to avoid tiny on-block field
        try {
          (
            this.getField("EVENT_FILTER_VALUE") as unknown as {
              showEditor_: () => void;
            }
          ).showEditor_();
        } catch {}
      }
    }
  },
};

export const eventJobGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const triggerChainId = block.getFieldValue("TRIGGER_CHAIN_ID");
  const triggerEvent = block.getFieldValue("TRIGGER_EVENT");
  const triggerContractAddress = block.getFieldValue(
    "TRIGGER_CONTRACT_ADDRESS",
  );
  const eventFilterParaName =
    block.getFieldValue("EVENT_FILTER_PARA_NAME") || "";
  const eventFilterValue = block.getFieldValue("EVENT_FILTER_VALUE") || "";

  const jobData: EventJobData = {
    trigger_chain_id: triggerChainId,
    trigger_contract_address: triggerContractAddress,
    trigger_event: triggerEvent,
  };

  // Only include when both provided
  if (eventFilterParaName && eventFilterValue) {
    jobData.event_filter_para_name = eventFilterParaName;
    jobData.event_filter_value = eventFilterValue;
  }

  const json = JSON.stringify(jobData);
  return [`// Event Job: ${json}`, Order.NONE];
};
