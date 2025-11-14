import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";
import { fetchContractABI } from "@/utils/fetchContractABI";
import { ethers } from "ethers";
import {
  detectProxyAndGetImplementation,
  getProviderForChain,
} from "@/utils/proxyDetection";

const contractActionJson = {
  type: "contract_action",
  message0: "Contract Info",
  message1: "Contract Address %1",
  args1: [
    {
      type: "field_input",
      name: "TARGET_CONTRACT_ADDRESS",
      text: "0x...",
    },
  ],
  inputsInline: false,
  previousStatement: "ACTION",
  output: "ACTION",
  colour: 260,
  tooltip:
    "Define a smart contract function to execute as part of a job. ABI will be fetched automatically based on chain ID and contract address.",
  helpUrl: "",
};

// (Function extraction moved inline to filter payable/nonpayable functions)

Blockly.Blocks["contract_action"] = {
  init: function () {
    this.jsonInit(contractActionJson);

    // Store ABI and available functions on the block instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockInstance = this as any;
    blockInstance.contractABI = null;
    blockInstance.availableFunctions = [["Select function...", ""]];
    blockInstance.isFetchingABI = false;
    blockInstance.lastFetchedKey = "";

    // Ensure the Function dropdown input exists with given options
    const ensureFunctionInputWithOptions = (options: [string, string][]) => {
      let functionField = this.getField("TARGET_FUNCTION") as unknown as {
        getValue?: () => string;
        setValue?: (value: string) => void;
        updateOptions?: (opts: [string, string][]) => void;
        setOptions?: (opts: [string, string][]) => void;
        forceRerender?: () => void;
        menuGenerator_?: [string, string][] | (() => [string, string][]);
      } | null;
      if (!functionField) {
        const dd = new (
          Blockly as unknown as {
            FieldDropdown: new (opts: [string, string][]) => unknown;
          }
        ).FieldDropdown(options);
        this.appendDummyInput("FUNCTION_INPUT")
          .appendField("Function ")
          .appendField(dd as unknown as Blockly.Field, "TARGET_FUNCTION");
        functionField = this.getField(
          "TARGET_FUNCTION",
        ) as unknown as typeof functionField;
      }

      // Update available options cache
      blockInstance.availableFunctions = options;

      // Update options using public API if available
      if (functionField) {
        if (typeof functionField.updateOptions === "function")
          functionField.updateOptions(options);
        else if (typeof functionField.setOptions === "function")
          functionField.setOptions(options);
        else {
          functionField.menuGenerator_ = options;
          functionField.forceRerender?.();
        }
      }

      // Try to keep Manual ABI (block) input visually above Function
      try {
        const hasAbiVal = !!this.getInput("ABI_VALUE");
        if (hasAbiVal && this.getInput("FUNCTION_INPUT")) {
          this.moveInputBefore("ABI_VALUE", "FUNCTION_INPUT");
        }
      } catch {}
    };

    // Helper to update function dropdown choices (creates input if needed)
    const updateFunctionDropdown = (functions: string[]) => {
      const options: [string, string][] =
        functions.length === 0
          ? [["No functions found", ""]]
          : functions.map((f) => [f, f]);
      ensureFunctionInputWithOptions(options);
      const functionField = this.getField("TARGET_FUNCTION") as unknown as {
        setValue?: (value: string) => void;
        getValue?: () => string;
      } | null;
      const currentValue = functionField?.getValue?.() || "";
      if (functionField) {
        if (currentValue && functions.includes(currentValue)) {
          functionField.setValue?.(currentValue);
        } else if (functions.length > 0) {
          functionField.setValue?.(functions[0]);
        } else {
          functionField.setValue?.("");
        }
      }
    };

    // Ensure Manual ABI value input (for manual_abi_input block)
    const ensureManualAbiValueInput = () => {
      try {
        if (!this.getInput("ABI_VALUE")) {
          this.appendValueInput("ABI_VALUE")
            .setCheck("ABI_JSON")
            .appendField("Manual ABI (block)");
        }
        // Always try to place it above the Function input when present
        try {
          if (this.getInput("FUNCTION_INPUT")) {
            this.moveInputBefore("ABI_VALUE", "FUNCTION_INPUT");
          }
        } catch {}
      } catch {}
    };

    // Remove Manual ABI value input
    const removeManualAbiValueInput = () => {
      try {
        this.removeInput("ABI_VALUE", true);
      } catch {}
    };

    // Try applying a pasted manual ABI and update UI accordingly
    const tryApplyManualAbi = (abiString: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bi = this as any;
      try {
        const parsed = JSON.parse(abiString);
        if (!Array.isArray(parsed)) throw new Error("ABI must be an array");
        bi.contractABI = abiString;
        const signatures: [string, string][] = parsed
          .filter((item: unknown) => {
            const it = item as {
              type?: string;
              stateMutability?: string;
              name?: string;
              inputs?: Array<{ type?: string }>;
            };
            return (
              it &&
              it.type === "function" &&
              (it.stateMutability === "nonpayable" ||
                it.stateMutability === "payable") &&
              typeof it.name === "string"
            );
          })
          .map((fn: { name: string; inputs?: Array<{ type?: string }> }) => {
            const types = (fn.inputs || []).map((i) => i?.type || "").join(",");
            const sig = `${fn.name}(${types})`;
            return [sig, sig] as [string, string];
          });
        if (signatures.length > 0) {
          ensureFunctionInputWithOptions([
            ["Select function", ""],
            ...signatures,
          ]);
          // Reset selected function and dependent UI just like successful fetch
          const functionField = this.getField("TARGET_FUNCTION") as unknown as {
            setValue?: (value: string) => void;
          } | null;
          functionField?.setValue?.("");
        } else {
          updateFunctionDropdown([]);
        }
      } catch {
        // keep manual field for correction
      }
    };

    // Ensure the Arg Type dropdown exists with default options
    const ensureArgTypeInput = () => {
      const existing = this.getField("ARG_TYPE");
      if (!existing) {
        const dd = new (
          Blockly as unknown as {
            FieldDropdown: new (opts: [string, string][]) => unknown;
          }
        ).FieldDropdown([
          ["Static", "0"],
          ["Dynamic", "1"],
        ]);
        this.appendDummyInput("ARG_TYPE_INPUT")
          .appendField("Argument Type ")
          .appendField(dd as unknown as Blockly.Field, "ARG_TYPE");
        // Default to Static
        try {
          this.setFieldValue("0", "ARG_TYPE");
        } catch {}
      }
    };

    // Remove any dynamically created per-argument inputs (for static mode)
    const removeAllStaticArgInputs = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bi = this as any;
      const count: number = Number(bi.__argInputCount || 0);
      for (let i = 0; i < count; i++) {
        try {
          this.removeInput(`ARG_DYNAMIC_INPUT_${i}`);
        } catch {}
      }
      bi.__argInputCount = 0;
    };

    // Helper to update argument type fields visibility (only after function is selected)
    const updateArgumentFields = () => {
      const selectedFunction = this.getFieldValue("TARGET_FUNCTION") || "";

      // Remove any existing argument inputs first
      try {
        this.removeInput("ARGUMENTS_INPUT");
      } catch {}
      try {
        this.removeInput("DYNAMIC_SCRIPT_INPUT");
      } catch {}
      removeAllStaticArgInputs();
      // If no function is selected, hide ArgType as well
      if (!selectedFunction) {
        try {
          this.removeInput("ARG_TYPE_INPUT");
        } catch {}
        this.render();
        return;
      }

      // Ensure Arg Type field is visible once function is selected
      ensureArgTypeInput();

      const argType = this.getFieldValue("ARG_TYPE") || "0";
      const isDynamic = argType === "1";

      if (isDynamic) {
        this.appendDummyInput("DYNAMIC_SCRIPT_INPUT")
          .appendField("Dynamic Arguments Script URL")
          .appendField(
            new Blockly.FieldTextInput("", (value) => {
              return value;
            }),
            "DYNAMIC_ARGUMENTS_SCRIPT_URL",
          );
      } else {
        // Build inputs for each parameter from ABI based on selected function signature
        try {
          let abiArray: Array<{
            name?: string;
            type?: string;
            inputs?: Array<{ name?: string; type?: string }>;
            stateMutability?: string;
          }>;
          abiArray = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bi = this as any;
          if (bi.contractABI) {
            try {
              abiArray = JSON.parse(bi.contractABI);
            } catch {}
          }
          const matching = (abiArray || []).filter(
            (it) =>
              it &&
              it.type === "function" &&
              (it.stateMutability === "nonpayable" ||
                it.stateMutability === "payable"),
          );
          const fn = matching.find((m) => {
            if (!m || typeof m.name !== "string") return false;
            const types = (m.inputs || []).map((i) => i?.type || "").join(",");
            const sig = `${m.name}(${types})`;
            return sig === selectedFunction;
          });
          const inputs = (fn?.inputs || []) as Array<{
            name?: string;
            type?: string;
          }>;
          let created = 0;
          inputs.forEach((inp, idx) => {
            const label =
              inp.name && inp.name.length > 0 ? inp.name : `arg${idx + 1}`;
            const typeLabel = inp.type || "unknown";
            const field = new (
              Blockly as unknown as {
                FieldTextInput: new (text?: string) => unknown;
              }
            ).FieldTextInput("");
            this.appendDummyInput(`ARG_DYNAMIC_INPUT_${idx}`)
              .appendField(`${label} (${typeLabel}) `)
              .appendField(
                field as unknown as Blockly.Field,
                `ARG_VALUE_${idx}`,
              );
            created += 1;
          });
          (this as unknown as { __argInputCount?: number }).__argInputCount =
            created;
        } catch {
          // Fallback: show JSON input if ABI couldn't be parsed
          this.appendDummyInput("ARGUMENTS_INPUT")
            .appendField("Arguments (JSON array)")
            .appendField(new Blockly.FieldTextInput("[]"), "ARGUMENTS");
        }
      }

      this.render();
    };

    // Fetch ABI and update function dropdown
    const fetchAndUpdateABI = async (chainId: string, address: string) => {
      if (!chainId || !address || !ethers.isAddress(address)) {
        blockInstance.contractABI = null;
        updateFunctionDropdown([]);
        return;
      }

      const fetchKey = `${chainId}-${address}`;
      if (
        blockInstance.isFetchingABI ||
        fetchKey === blockInstance.lastFetchedKey
      ) {
        return;
      }

      blockInstance.isFetchingABI = true;
      blockInstance.lastFetchedKey = fetchKey;

      // Update function dropdown to show loading (and create it if missing)
      ensureFunctionInputWithOptions([["Fetching ABI...", ""]]);

      try {
        // Detect proxy using provider for the resolved chain
        let proxyInfo: {
          isProxy: boolean;
          implementationAddress?: string;
          proxyType?: string;
        } = {
          isProxy: false,
          implementationAddress: undefined,
          proxyType: undefined,
        };
        try {
          const provider = getProviderForChain(parseInt(chainId, 10) || 1);
          const detectedProxy = await detectProxyAndGetImplementation(
            address,
            provider,
          );
          proxyInfo = {
            isProxy: detectedProxy.isProxy,
            implementationAddress: detectedProxy.implementationAddress,
            proxyType: detectedProxy.proxyType,
          };
        } catch {}

        // Fetch ABI - prefer implementation ABI for proxies
        let abiString: string | null = null;
        if (proxyInfo.isProxy && proxyInfo.implementationAddress) {
          abiString = await fetchContractABI(
            proxyInfo.implementationAddress,
            parseInt(chainId, 10),
            true, // skip proxy detection inside fetch since we already resolved it
          );
        } else {
          abiString = await fetchContractABI(
            address,
            parseInt(chainId, 10),
            false,
          );
        }

        if (abiString) {
          blockInstance.contractABI = abiString;
          // Build function signature labels: name(type1,type2,...)
          let signatureOptions: [string, string][] = [];
          try {
            const parsedABI = JSON.parse(abiString);
            if (Array.isArray(parsedABI)) {
              signatureOptions = parsedABI
                .filter((item: unknown) => {
                  const it = item as {
                    type?: string;
                    stateMutability?: string;
                    name?: string;
                    inputs?: Array<{ type?: string }>;
                  };
                  return (
                    it &&
                    it.type === "function" &&
                    (it.stateMutability === "nonpayable" ||
                      it.stateMutability === "payable") &&
                    typeof it.name === "string"
                  );
                })
                .map(
                  (fn: { name: string; inputs?: Array<{ type?: string }> }) => {
                    const types = (fn.inputs || [])
                      .map((i) => i?.type || "")
                      .join(",");
                    const signature = `${fn.name}(${types})`;
                    return [signature, signature] as [string, string];
                  },
                );
            }
          } catch {}
          if (signatureOptions.length > 0) {
            const opts: [string, string][] = [
              ["Select function", ""],
              ...signatureOptions,
            ];
            ensureFunctionInputWithOptions(opts);
            const functionField = this.getField(
              "TARGET_FUNCTION",
            ) as unknown as { setValue?: (value: string) => void } | null;
            functionField?.setValue?.("");
            // If no manual ABI block is connected, hide the input; otherwise keep it fitted
            try {
              const valInput = this.getInput("ABI_VALUE");
              const isConnected = !!valInput?.connection?.targetBlock?.();
              if (!isConnected) removeManualAbiValueInput();
            } catch {}
          } else {
            updateFunctionDropdown([]);
            // Do not show manual ABI field here; only when ABI is not found or errored
            try {
              const valInput = this.getInput("ABI_VALUE");
              const isConnected = !!valInput?.connection?.targetBlock?.();
              if (!isConnected) removeManualAbiValueInput();
            } catch {}
          }
        } else {
          blockInstance.contractABI = null;
          updateFunctionDropdown([]);
          const functionField = this.getField("TARGET_FUNCTION") as unknown as {
            updateOptions?: (opts: [string, string][]) => void;
            setOptions?: (opts: [string, string][]) => void;
            forceRerender?: () => void;
            menuGenerator_?: [string, string][] | (() => [string, string][]);
          } | null;
          if (functionField) {
            const opts: [string, string][] = [["ABI not found", ""]];
            blockInstance.availableFunctions = opts;
            if (typeof functionField.updateOptions === "function")
              functionField.updateOptions(opts);
            else if (typeof functionField.setOptions === "function")
              functionField.setOptions(opts);
            else {
              functionField.menuGenerator_ = opts;
              functionField.forceRerender?.();
            }
          }
          ensureManualAbiValueInput();
        }
      } catch (error) {
        console.error("Error fetching ABI:", error);
        blockInstance.contractABI = null;
        updateFunctionDropdown([]);
        const functionField = this.getField("TARGET_FUNCTION") as unknown as {
          updateOptions?: (opts: [string, string][]) => void;
          setOptions?: (opts: [string, string][]) => void;
          forceRerender?: () => void;
          menuGenerator_?: [string, string][] | (() => [string, string][]);
        } | null;
        if (functionField) {
          const opts: [string, string][] = [["Error fetching ABI", ""]];
          blockInstance.availableFunctions = opts;
          if (typeof functionField.updateOptions === "function")
            functionField.updateOptions(opts);
          else if (typeof functionField.setOptions === "function")
            functionField.setOptions(opts);
          else {
            functionField.menuGenerator_ = opts;
            functionField.forceRerender?.();
          }
        }
        ensureManualAbiValueInput();
      } finally {
        blockInstance.isFetchingABI = false;
      }
    };

    // Initialize argument fields based on default arg_type
    updateArgumentFields();

    // Set up change handlers
    this.setOnChange((event?: Blockly.Events.Abstract) => {
      if (!event) return;
      const ev = event as unknown as { name?: string; blockId?: string };

      // Ensure dropdowns/widgets are bounded to workspace container (like event_job)
      try {
        const ws = this.workspace as unknown as Blockly.WorkspaceSvg & {
          __dropdownBoundsSet?: boolean;
        };
        if (ws && !ws.__dropdownBoundsSet) {
          const inj = ws.getInjectionDiv?.();
          const svg = ws.getParentSvg?.();
          const boundsEl = (inj || svg?.parentElement || svg) as unknown as
            | Element
            | undefined;
          const B = Blockly as unknown as {
            DropDownDiv?: { setBoundsElement?: (el: Element) => void };
            WidgetDiv?: { setBoundsElement?: (el: Element) => void };
          };
          if (boundsEl) {
            try {
              B.DropDownDiv?.setBoundsElement?.(boundsEl);
            } catch {}
            try {
              B.WidgetDiv?.setBoundsElement?.(boundsEl);
            } catch {}
            ws.__dropdownBoundsSet = true;
          }
        }
      } catch {}

      // When contract address changes, resolve chain from chain_selection block and fetch ABI
      if (
        event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.blockId === this.id &&
        ev.name === "TARGET_CONTRACT_ADDRESS"
      ) {
        const address = String(
          this.getFieldValue("TARGET_CONTRACT_ADDRESS") || "",
        );

        // Handle empty/short address: clear function dropdown and exit
        if (!address || address.length < 4) {
          try {
            this.removeInput("FUNCTION_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARG_TYPE_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARGUMENTS_INPUT", true);
          } catch {}
          try {
            this.removeInput("DYNAMIC_SCRIPT_INPUT", true);
          } catch {}
          removeManualAbiValueInput();
          return;
        }

        // Validate address early
        if (!ethers.isAddress(address)) {
          // Hide function and argument selection when invalid address
          try {
            this.removeInput("FUNCTION_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARG_TYPE_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARGUMENTS_INPUT", true);
          } catch {}
          try {
            this.removeInput("DYNAMIC_SCRIPT_INPUT", true);
          } catch {}
          removeManualAbiValueInput();
          return;
        }

        // Find chain ID from any chain_selection block in the workspace (like event_job)
        let resolvedChainId: number | undefined = undefined;
        try {
          const allBlocks = this.workspace.getAllBlocks(
            false,
          ) as Blockly.Block[];
          const chainBlock = (allBlocks as Blockly.Block[]).find(
            (b: Blockly.Block) => b.type === "chain_selection",
          );
          if (chainBlock) {
            const chainVal = chainBlock.getFieldValue("CHAIN_ID");
            if (chainVal) resolvedChainId = Number(chainVal);
          }
        } catch {}

        // If no chain is selected in workspace, prompt user to select chain first
        if (!resolvedChainId) {
          // Hide function and argument selection until chain is selected
          try {
            this.removeInput("FUNCTION_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARG_TYPE_INPUT", true);
          } catch {}
          try {
            this.removeInput("ARGUMENTS_INPUT", true);
          } catch {}
          try {
            this.removeInput("DYNAMIC_SCRIPT_INPUT", true);
          } catch {}
          removeManualAbiValueInput();
          return;
        }

        // Hide manual fields before a new fetch
        removeManualAbiValueInput();
        // Fetch ABI with resolved chain ID
        fetchAndUpdateABI(String(resolvedChainId), address);
      }

      // If a manual_abi_input block is connected, only re-parse when its text changes
      try {
        const valInput = this.getInput("ABI_VALUE");
        const target = valInput?.connection?.targetBlock?.();
        if (target && target.type === "manual_abi_input") {
          const targetId = (target as unknown as { id?: string }).id || "";
          const abiText = String(
            (
              target as unknown as { getFieldValue: (n: string) => string }
            ).getFieldValue("ABI_TEXT") || "",
          );
          const isTextChangeOnManualBlock =
            event.type === Blockly.Events.BLOCK_CHANGE &&
            ev.blockId === targetId &&
            ev.name === "ABI_TEXT";
          // Parse on manual block text edits, or once initially if ABI not yet set
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bi = this as any;
          const needInitialPopulate =
            !bi.contractABI || bi.contractABI === null || bi.contractABI === "";
          if (
            (isTextChangeOnManualBlock || needInitialPopulate) &&
            abiText &&
            abiText.length > 2
          ) {
            tryApplyManualAbi(abiText);
          }
        }
      } catch {}

      // Update argument fields when arg_type changes
      if (
        event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.blockId === this.id &&
        ev.name === "ARG_TYPE"
      ) {
        updateArgumentFields();
      }

      // When function selection changes, toggle argument inputs accordingly
      if (
        event.type === Blockly.Events.BLOCK_CHANGE &&
        ev.blockId === this.id &&
        ev.name === "TARGET_FUNCTION"
      ) {
        updateArgumentFields();
      }
    });

    // Initial ABI fetch if address set and chain can be resolved from chain_selection
    const initialAddress = this.getFieldValue("TARGET_CONTRACT_ADDRESS");
    if (initialAddress && ethers.isAddress(initialAddress)) {
      let resolvedChainId: number | undefined = undefined;
      try {
        const allBlocks = this.workspace.getAllBlocks(false) as Blockly.Block[];
        const chainBlock = (allBlocks as Blockly.Block[]).find(
          (b: Blockly.Block) => b.type === "chain_selection",
        );
        if (chainBlock) {
          const chainVal = chainBlock.getFieldValue("CHAIN_ID");
          if (chainVal) resolvedChainId = Number(chainVal);
        }
      } catch {}
      if (resolvedChainId) {
        // Create function input with loading, then fetch
        ensureFunctionInputWithOptions([["Fetching ABI...", ""]]);
        setTimeout(
          () => fetchAndUpdateABI(String(resolvedChainId!), initialAddress),
          100,
        );
      }
    } else {
      // Ensure no inputs are shown at start if address invalid/default
      try {
        this.removeInput("FUNCTION_INPUT", true);
      } catch {}
      try {
        this.removeInput("ARG_TYPE_INPUT", true);
      } catch {}
      try {
        this.removeInput("ARGUMENTS_INPUT", true);
      } catch {}
      try {
        this.removeInput("DYNAMIC_SCRIPT_INPUT", true);
      } catch {}
      removeManualAbiValueInput();
    }
  },
};

export const contractActionGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const targetContractAddress = block.getFieldValue("TARGET_CONTRACT_ADDRESS");
  // Resolve chain ID from chain_selection block for consistency with event_job
  let targetChainId: string | undefined = undefined;
  try {
    const ws = block.workspace as unknown as Blockly.WorkspaceSvg;
    const allBlocks = ws.getAllBlocks(false) as Blockly.Block[];
    const chainBlock = (allBlocks as Blockly.Block[]).find(
      (b: Blockly.Block) => b.type === "chain_selection",
    );
    if (chainBlock) {
      const chainVal = chainBlock.getFieldValue("CHAIN_ID");
      if (chainVal) targetChainId = String(chainVal);
    }
  } catch {}
  const targetFunction = block.getFieldValue("TARGET_FUNCTION");
  const argType = block.getFieldValue("ARG_TYPE") || "0";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blockInstance = block as any;
  const abi = blockInstance.contractABI || "[]";

  // Get arguments or script URL based on arg_type
  const isDynamic = argType === "1";
  let argumentsValue: unknown[] = [];
  if (isDynamic) {
    argumentsValue = [];
  } else {
    // Prefer values from per-argument inputs if present
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bi = block as any;
    const count: number = Number(bi.__argInputCount || 0);
    if (count > 0) {
      const arr: string[] = [];
      for (let i = 0; i < count; i++) {
        const v = block.getFieldValue(`ARG_VALUE_${i}`) || "";
        arr.push(v);
      }
      argumentsValue = arr;
    } else {
      try {
        argumentsValue = JSON.parse(block.getFieldValue("ARGUMENTS") || "[]");
      } catch {
        argumentsValue = [];
      }
    }
  }
  const dynamicScriptUrl = isDynamic
    ? block.getFieldValue("DYNAMIC_ARGUMENTS_SCRIPT_URL") || ""
    : "";

  const jobData = {
    target_contract_address: targetContractAddress,
    abi: abi,
    target_function: targetFunction,
    arg_type: parseInt(argType, 10), // 0 for Static, 1 for Dynamic
    arguments: isDynamic ? [] : argumentsValue,
    dynamic_arguments_script_url: isDynamic ? dynamicScriptUrl : "",
    target_chain_id: targetChainId ? Number(targetChainId) : 0,
  };

  const json = JSON.stringify(jobData, null, 2);
  return [`// Contract Action: ${json}`, Order.NONE];
};

// manual_abi_input block moved to utility/manual_abi_input.ts
