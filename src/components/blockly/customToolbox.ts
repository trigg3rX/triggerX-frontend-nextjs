"use client";

import * as Blockly from "blockly/core";
import {
  ContinuousCategory,
  registerContinuousToolbox,
} from "@blockly/continuous-toolbox";
import {
  FaWallet,
  FaLink,
  FaBriefcase,
  FaClock,
  FaRedo,
  FaFileCode,
  FaCalendarAlt,
  FaBolt,
  FaSlidersH,
  FaFileContract,
  FaShieldAlt,
  FaExchangeAlt,
} from "react-icons/fa";
import { createRoot } from "react-dom/client";
import React from "react";

// Minimal typings to avoid `any` while accessing private fields
type ToolboxCategoryInstance = {
  rowDiv_: HTMLElement;
  colour_: string;
  iconDom_?: HTMLElement;
  htmlDiv_: Element;
  labelDom_?: HTMLElement;
};

type ToolboxCtor = new (...args: unknown[]) => object;
type BlocklyExports = {
  ToolboxCategory: ToolboxCtor;
  registry: typeof Blockly.registry;
  utils: typeof Blockly.utils;
};

const B = Blockly as unknown as BlocklyExports;

// Icon size for the circular category glyph
const ICON_BG_SIZE = "30px"; // circular icon size
const CATEGORY_WIDTH_PX = 72; // compact vertical category width

// Ensure continuous toolbox plugins are registered before overriding category
registerContinuousToolbox();

// Custom toolbox category class
class CustomCategory extends (ContinuousCategory as unknown as ToolboxCtor) {
  /** @override */
  createDom_() {
    // @ts-expect-error - calling parent method
    super.createDom_?.call(this);
    const self = this as unknown as ToolboxCategoryInstance;

    // Style category container (compact vertical, no background pill)
    self.rowDiv_.style.borderRadius = "0";
    self.rowDiv_.style.margin = "0px 0";
    self.rowDiv_.style.padding = "0px 0px";
    self.rowDiv_.style.transition = "all 0.2s ease";
    self.rowDiv_.style.display = "flex";
    self.rowDiv_.style.flexDirection = "column";
    self.rowDiv_.style.alignItems = "center";
    self.rowDiv_.style.justifyContent = "center";
    self.rowDiv_.style.gap = "2px";
    self.rowDiv_.style.backgroundColor = "transparent";
    self.rowDiv_.style.cursor = "pointer";
    self.rowDiv_.style.width = `${CATEGORY_WIDTH_PX}px`;
    self.rowDiv_.style.minWidth = `${CATEGORY_WIDTH_PX}px`;
    self.rowDiv_.style.maxWidth = `${CATEGORY_WIDTH_PX}px`;

    // Style label
    const labelDom = self.rowDiv_.getElementsByClassName(
      "blocklyToolboxCategoryLabel",
    )[0] as HTMLElement | undefined;

    if (labelDom) {
      labelDom.style.fontWeight = "500";
      labelDom.style.fontSize = "11px";
      labelDom.style.color = "white";
      labelDom.style.textAlign = "center";
      labelDom.style.lineHeight = "1.1";
      labelDom.style.wordBreak = "break-word";
      labelDom.style.whiteSpace = "normal";
      labelDom.style.display = "block";
      labelDom.style.width = "100%";
      labelDom.style.margin = "4px 0px";
    }

    // Style icon background as a colored circle
    // Helper to trigger native selection/open behavior on the underlying toolbox element
    const activateCategory = () => {
      try {
        const click = new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
        });
        const mousedown = new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
        });
        // Dispatch on htmlDiv_ which is what Blockly wires up internally
        (self.htmlDiv_ as HTMLElement).dispatchEvent(mousedown);
        (self.htmlDiv_ as HTMLElement).dispatchEvent(click);
      } catch {
        // no-op
      }
    };
    if (self.iconDom_) {
      const iconContainer = document.createElement("div");
      iconContainer.style.width = ICON_BG_SIZE;
      iconContainer.style.height = ICON_BG_SIZE;
      iconContainer.style.minWidth = ICON_BG_SIZE;
      iconContainer.style.minHeight = ICON_BG_SIZE;
      iconContainer.style.borderRadius = "9999px"; // ensure perfect circle
      iconContainer.style.aspectRatio = "1 / 1";
      iconContainer.style.overflow = "hidden";
      iconContainer.style.flex = "0 0 auto";
      iconContainer.style.backgroundColor = self.colour_ || "#888";
      iconContainer.style.display = "flex";
      iconContainer.style.alignItems = "center";
      iconContainer.style.justifyContent = "center";

      // Get category name to determine which icon to use
      const categoryName = self.labelDom_?.textContent?.toLowerCase() || "";

      // Create custom icon based on category
      let customIcon: HTMLElement;

      if (categoryName.includes("wallet")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "wallet-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaWallet, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("chain")) {
        // Mark the chain category specifically for guided tours
        try {
          self.rowDiv_.setAttribute("data-tour-id", "chain-category");
        } catch {
          // no-op
        }

        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(React.createElement(FaLink, { size: 12, color: "white" }));
      } else if (
        categoryName.includes("job type") ||
        categoryName.includes("jobtype")
      ) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "job-type-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaBriefcase, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("duration")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "duration-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(React.createElement(FaClock, { size: 12, color: "white" }));
      } else if (categoryName.includes("recurring")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "recurring-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(React.createElement(FaRedo, { size: 12, color: "white" }));
      } else if (categoryName.includes("abi")) {
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaFileCode, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("time")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "time-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaCalendarAlt, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("event")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "event-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(React.createElement(FaBolt, { size: 12, color: "white" }));
      } else if (categoryName.includes("condition")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "condition-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaSlidersH, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("execute")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "execute-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaFileContract, { size: 12, color: "white" }),
        );
      } else if (
        categoryName.includes("safe wallet") ||
        categoryName.includes("safewallet")
      ) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "safe-wallet-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaShieldAlt, { size: 12, color: "white" }),
        );
      } else if (
        categoryName.includes("safe transaction") ||
        categoryName.includes("safetransaction")
      ) {
        try {
          self.rowDiv_.setAttribute(
            "data-tour-id",
            "safe-transaction-category",
          );
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaExchangeAlt, { size: 12, color: "white" }),
        );
      } else if (categoryName.includes("function value")) {
        try {
          self.rowDiv_.setAttribute("data-tour-id", "function-values-category");
        } catch {
          // no-op
        }
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaSlidersH, { size: 12, color: "white" }),
        );
      } else {
        // Use existing icon for other categories
        customIcon = self.iconDom_;
        customIcon.style.color = "white";
        customIcon.style.fontSize = "14px";
      }

      iconContainer.appendChild(customIcon);

      // Replace/move icon to the top of the vertical stack
      self.rowDiv_.insertBefore(iconContainer, self.rowDiv_.firstChild);
      // Allow clicking anywhere on the row to open; let events pass through icon
      iconContainer.style.pointerEvents = "none";

      // Hide any default icon element that Blockly injected to avoid layout offset
      try {
        self.iconDom_.style.display = "none";
      } catch {}
    }

    // Make entire category row clickable (icon + label area)
    self.rowDiv_.style.userSelect = "none";
    self.rowDiv_.addEventListener("click", activateCategory);
    self.rowDiv_.addEventListener("mousedown", activateCategory);
    self.rowDiv_.addEventListener("pointerdown", activateCategory);

    // Hover effect
    self.rowDiv_.addEventListener("mouseenter", () => {
      self.rowDiv_.style.transform = "translateY(-1px)";
    });
    self.rowDiv_.addEventListener("mouseleave", () => {
      self.rowDiv_.style.transform = "translateY(0)";
    });

    return self.rowDiv_;
  }

  /** @override */
  addColourBorder_() {
    // No dynamic background per category — keep uniform color
  }

  /** @override */
  setSelected(isSelected: boolean) {
    const self = this as unknown as ToolboxCategoryInstance;

    if (isSelected) {
      // Keep selected state subtle — no extra square or marker
      self.rowDiv_.style.transform = "scale(1)";
    } else {
      self.rowDiv_.style.transform = "scale(1)";
    }

    B.utils.aria.setState(
      self.htmlDiv_,
      B.utils.aria.State.SELECTED,
      isSelected,
    );
  }
}

// Register and override the default ToolboxCategory (continuous variant) globally
const registrationName =
  (ContinuousCategory as unknown as { registrationName?: string })
    .registrationName ||
  // Fallback to core registration name
  (Blockly as unknown as { ToolboxCategory: { registrationName: string } })
    .ToolboxCategory.registrationName;

B.registry.register(
  B.registry.Type.TOOLBOX_ITEM,
  registrationName,
  CustomCategory,
  true,
);
