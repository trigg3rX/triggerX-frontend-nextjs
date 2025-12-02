import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Store safe wallets globally
let globalSafeWallets: string[] = [];
let isLoadingWallets: boolean = false;
let onBlockAddedCallback: (() => void) | null = null;

export function setOnBlockAddedCallback(callback: () => void): void {
  onBlockAddedCallback = callback;
}

export function setLoadingWallets(loading: boolean): void {
  isLoadingWallets = loading;
  updateAllSelectSafeWalletDropdowns();
}

export function setSafeWallets(wallets: string[]): void {
  console.log("setSafeWallets called with:", wallets);
  globalSafeWallets = wallets;
  isLoadingWallets = false;
  updateAllSelectSafeWalletDropdowns();
}

function updateAllSelectSafeWalletDropdowns(): void {
  try {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const allBlocks = workspace.getAllBlocks(false);
      allBlocks.forEach((block) => {
        if (block.type === "select_safe_wallet") {
          updateDropdownOptions(block);
        }
      });
    }
  } catch (error) {
    console.error("Error updating select safe wallet dropdowns:", error);
  }
}

function updateDropdownOptions(block: Blockly.Block): void {
  const field = block.getField("SAFE_WALLET") as Blockly.FieldDropdown | null;
  if (field) {
    const currentValue = field.getValue();
    const newOptions = getSafeWalletOptions();

    // Update the dropdown's options in place instead of appending new fields
    (
      field as unknown as { menuGenerator_: [string, string][] }
    ).menuGenerator_ = newOptions;

    // If current value is not in new options, set to first option
    const validValues = newOptions.map((opt: [string, string]) => opt[1]);
    if (!currentValue || !validValues.includes(currentValue)) {
      field.setValue(newOptions[0][1]);
    } else {
      field.setValue(currentValue);
    }
  }
}

function getSafeWalletOptions(): [string, string][] {
  if (isLoadingWallets) {
    return [["Fetching wallets...", ""]];
  }

  if (globalSafeWallets.length === 0) {
    return [["No Safe Wallets Available", ""]];
  }

  return globalSafeWallets.map((wallet, index) => {
    const shortAddress = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
    return [`Safe ${index + 1}: ${shortAddress}`, wallet];
  });
}

const selectSafeWalletJson = {
  type: "select_safe_wallet",
  message0: "Select Safe Wallet %1",
  args0: [
    {
      type: "field_dropdown",
      name: "SAFE_WALLET",
      options: getSafeWalletOptions(),
    },
  ],
  output: "SAFE_WALLET_OUTPUT",
  colour: "#9C27B0", // Purple color for safe wallet
  tooltip: "Select an existing Safe wallet from the dropdown list.",
  helpUrl: "",
};

Blockly.Blocks["select_safe_wallet"] = {
  init: function () {
    this.jsonInit(selectSafeWalletJson);

    // Trigger wallet fetch when block is added to workspace
    if (onBlockAddedCallback) {
      onBlockAddedCallback();
    }
  },
};

export const selectSafeWalletGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const safeWallet = block.getFieldValue("SAFE_WALLET");
  const json = JSON.stringify({
    action: "select_safe_wallet",
    safe_wallet: safeWallet,
  });
  return [`// Select Safe Wallet: ${json}`, Order.NONE];
};

export default selectSafeWalletJson;
