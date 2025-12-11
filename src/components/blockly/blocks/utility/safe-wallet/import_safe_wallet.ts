import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

// Custom field for button
class ButtonField extends Blockly.Field {
  private buttonText_: string;
  private clickHandler_: (() => void) | null;
  private isEnabled_: boolean;

  constructor(buttonText: string, clickHandler?: () => void) {
    super(buttonText);
    this.buttonText_ = buttonText;
    this.clickHandler_ = clickHandler || null;
    this.isEnabled_ = true;
  }

  static fromJson(
    options: Blockly.FieldConfig & { text?: string },
  ): ButtonField {
    const text =
      typeof options === "string" ? options : options.text || "Button";
    return new ButtonField(text);
  }

  showEditor_(): void {
    // When clicked, trigger the click handler only if enabled
    if (this.isEnabled_ && this.clickHandler_) {
      this.clickHandler_();
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled_ = enabled;
    this.forceRerender();
  }

  getEnabled(): boolean {
    return this.isEnabled_;
  }

  getText(): string {
    return this.buttonText_;
  }

  setText(text: string): void {
    this.buttonText_ = text;
    this.forceRerender();
  }

  // Set the click handler after creation
  setClickHandler(handler: () => void): void {
    this.clickHandler_ = handler;
  }

  protected render_(): void {
    super.render_();

    // Make the entire field group clickable
    const fieldGroup = this.fieldGroup_;
    if (fieldGroup) {
      fieldGroup.style.cursor = "pointer";

      // Add click event listener directly to the field group
      fieldGroup.addEventListener("mousedown", (e) => {
        e.stopPropagation();
        if (this.isEnabled_ && this.clickHandler_) {
          this.clickHandler_();
        }
      });

      // Add a rectangle behind the text for border
      // Remove any existing border rect first
      const existingRect = fieldGroup.querySelector(".button-border");
      if (existingRect) {
        existingRect.remove();
      }

      // Create new border rectangle
      const rect = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
      );
      rect.classList.add("button-border");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "0");
      rect.setAttribute("width", String(this.size_.width));
      rect.setAttribute("height", String(this.size_.height));
      rect.setAttribute("rx", "15"); // Rounded corners
      rect.setAttribute("ry", "15");

      // Change styling based on enabled state
      if (this.isEnabled_) {
        rect.style.fill = "#ffffff";
        rect.style.stroke = "#ffffff";
        fieldGroup.style.cursor = "pointer";
        fieldGroup.style.opacity = "1";
      } else {
        rect.style.fill = "#ffffff";
        rect.style.stroke = "#ffffff";
        fieldGroup.style.cursor = "not-allowed";
        fieldGroup.style.opacity = "0.5";
      }
      rect.style.strokeWidth = "0";

      // Insert the rect before the text element
      if (this.textElement_) {
        fieldGroup.insertBefore(rect, this.textElement_);
      }
    }

    if (this.textElement_) {
      // Style text as a button
      this.textElement_.style.fontWeight = "600";
      this.textElement_.style.fontSize = "14px";
      this.textElement_.setAttribute("dominant-baseline", "middle");
      this.textElement_.setAttribute("x", "22");
      this.textElement_.setAttribute("dy", "15");

      // Change text color based on enabled state
      if (this.isEnabled_) {
        this.textElement_.style.cursor = "pointer";
        this.textElement_.style.fill = "#000000";
      } else {
        this.textElement_.style.cursor = "not-allowed";
        this.textElement_.style.fill = "#999999";
      }
    }
  }

  updateSize_(): void {
    // Calculate size based on text with padding
    const text = this.getText();
    const textWidth = text.length * 8; // Approximate character width
    const width = Math.max(textWidth + 30, 140); // Min width 140px with more padding
    const height = 32; // Taller for better button appearance

    this.size_.width = width;
    this.size_.height = height;
  }
}

// Register the custom field
Blockly.fieldRegistry.register("field_button_import", ButtonField);

const importSafeWalletJson = {
  type: "import_safe_wallet",
  message0: "Import Safe Wallet %1 %2 %3",
  args0: [
    {
      type: "field_button_import",
      name: "IMPORT_BUTTON",
      text: "Import Safe",
    },
    {
      type: "input_dummy",
    },
    {
      type: "field_label",
      name: "WALLET_ADDRESS",
      text: "",
    },
  ],
  output: "SAFE_WALLET_OUTPUT",
  colour: "#9C27B0", // Purple color for safe wallet
  tooltip:
    "Click the button to import an existing Safe wallet from Base network. This will guide you through the import process.",
  helpUrl: "",
  data: "", // Store wallet address as data attribute
};

// Global click handler that can be set from React
let globalImportSafeHandler: (() => void) | null = null;
let currentChainId: number | null = null;

// Base Sepolia chain ID
const BASE_SEPOLIA_CHAIN_ID = 84532;

export function setImportSafeHandler(handler: () => void): void {
  globalImportSafeHandler = handler;
}

export function setImportSafeChainId(chainId: number | null): void {
  currentChainId = chainId;
  updateImportButtonStates();
}

function updateImportButtonStates(): void {
  // Update all import_safe_wallet blocks
  try {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const allBlocks = workspace.getAllBlocks(false);
      allBlocks.forEach((block) => {
        if (block.type === "import_safe_wallet") {
          const buttonField = block.getField(
            "IMPORT_BUTTON",
          ) as ButtonField | null;
          if (buttonField && buttonField instanceof ButtonField) {
            const isEnabled = currentChainId === BASE_SEPOLIA_CHAIN_ID;
            buttonField.setEnabled(isEnabled);
          }
        }
      });
    }
  } catch (error) {
    console.error("Error updating import button states:", error);
  }
}

// Function to update wallet address on import_safe_wallet blocks
export function updateImportedWalletAddress(walletAddress: string): void {
  try {
    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
      const allBlocks = workspace.getAllBlocks(false);
      allBlocks.forEach((block) => {
        if (block.type === "import_safe_wallet") {
          // Update the display label
          const addressField = block.getField(
            "WALLET_ADDRESS",
          ) as Blockly.FieldLabel | null;
          if (addressField) {
            // Format the address for display
            const shortAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
            addressField.setValue(`✓ ${shortAddress}`);
          }

          // Store the full address in the block's data attribute
          block.data = walletAddress;
        }
      });
    }
  } catch (error) {
    console.error("Error updating imported wallet address:", error);
  }
}

Blockly.Blocks["import_safe_wallet"] = {
  init: function () {
    this.jsonInit(importSafeWalletJson);

    // Get the button field and attach the click handler
    const buttonField = this.getField("IMPORT_BUTTON") as ButtonField | null;
    if (buttonField && buttonField instanceof ButtonField) {
      // Set initial enabled state based on current chain
      const isEnabled = currentChainId === BASE_SEPOLIA_CHAIN_ID;
      buttonField.setEnabled(isEnabled);

      buttonField.setClickHandler(() => {
        console.log("Import Safe button clicked");
        if (globalImportSafeHandler) {
          console.log("Calling globalImportSafeHandler");
          globalImportSafeHandler();
        } else {
          console.warn("Import Safe handler not set");
        }
      });
    } else {
      console.warn("Button field not found or not ButtonField instance");
    }
  },
};

export const importSafeWalletGenerator = function (): [string, Order] {
  const json = JSON.stringify({
    action: "import_safe_wallet",
  });
  return [`// Import Safe Wallet: ${json}`, Order.NONE];
};

export default importSafeWalletJson;
