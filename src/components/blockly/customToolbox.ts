"use client";

import * as Blockly from "blockly/core";
import { FaWallet, FaLink } from "react-icons/fa";
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

// Set your universal toolbox category background color here
const CATEGORY_BG = "#313334"; // dark mode example — change to what suits your UI
const ICON_BG_SIZE = "30px"; // circular icon size

// Custom toolbox category class
class CustomCategory extends (B.ToolboxCategory as ToolboxCtor) {
  /** @override */
  createDom_() {
    // @ts-expect-error - calling parent method
    super.createDom_?.call(this);
    const self = this as unknown as ToolboxCategoryInstance;

    // Style category container (pill-like)
    self.rowDiv_.style.borderRadius = "50px";
    self.rowDiv_.style.margin = "4px 0";
    self.rowDiv_.style.padding = "22px 10px";
    self.rowDiv_.style.transition = "all 0.2s ease";
    self.rowDiv_.style.display = "flex";
    self.rowDiv_.style.alignItems = "center";
    self.rowDiv_.style.justifyContent = "start";
    self.rowDiv_.style.gap = "10px";
    self.rowDiv_.style.backgroundColor = CATEGORY_BG;
    self.rowDiv_.style.cursor = "pointer";
    self.rowDiv_.style.width = "200px";
    self.rowDiv_.style.minWidth = "200px";
    self.rowDiv_.style.maxWidth = "200px";

    // Style label
    const labelDom = self.rowDiv_.getElementsByClassName(
      "blocklyToolboxCategoryLabel",
    )[0] as HTMLElement | undefined;

    if (labelDom) {
      labelDom.style.fontWeight = "500";
      labelDom.style.fontSize = "14px";
      labelDom.style.color = "white";
    }

    // Style icon background as a colored circle
    if (self.iconDom_) {
      const iconContainer = document.createElement("div");
      iconContainer.style.width = ICON_BG_SIZE;
      iconContainer.style.height = ICON_BG_SIZE;
      iconContainer.style.borderRadius = "50%";
      iconContainer.style.backgroundColor = self.colour_ || "#888";
      iconContainer.style.display = "flex";
      iconContainer.style.alignItems = "center";
      iconContainer.style.justifyContent = "center";

      // Get category name to determine which icon to use
      const categoryName = self.labelDom_?.textContent?.toLowerCase() || "";

      // Create custom icon based on category
      let customIcon: HTMLElement;

      if (categoryName.includes("wallet")) {
        // Wallet icon using React Icons
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaWallet, {
            size: 12,
            color: "white",
          }),
        );
      } else if (categoryName.includes("chain")) {
        // Chain icon using React Icons
        customIcon = document.createElement("div");
        const root = createRoot(customIcon);
        root.render(
          React.createElement(FaLink, {
            size: 12,
            color: "white",
          }),
        );
      } else {
        // Use existing icon for other categories
        customIcon = self.iconDom_;
        customIcon.style.color = "white";
        customIcon.style.fontSize = "12px";
      }

      iconContainer.appendChild(customIcon);

      // Replace icon in rowDiv with the new container
      self.rowDiv_.insertBefore(iconContainer, self.rowDiv_.firstChild);
    }

    // Hover effect
    self.rowDiv_.addEventListener("mouseenter", () => {
      self.rowDiv_.style.transform = "scale(1.01)";
      // self.rowDiv_.style.boxShadow = "0 3px 8px rgba(0, 0, 0, 0.25)";
    });
    self.rowDiv_.addEventListener("mouseleave", () => {
      self.rowDiv_.style.transform = "scale(1)";
      // self.rowDiv_.style.boxShadow = "none";
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
      // Selected state
      // self.rowDiv_.style.boxShadow = "0 4px 12px rgba(255, 255, 255, 0.1)";
      self.rowDiv_.style.transform = "scale(1)";

      // Add connecting square using ::after pseudo-element
      self.rowDiv_.style.position = "relative";
      self.rowDiv_.setAttribute("data-selected", "true");
    } else {
      // self.rowDiv_.style.boxShadow = "none";
      self.rowDiv_.style.transform = "scale(1)";
      self.rowDiv_.removeAttribute("data-selected");
    }

    B.utils.aria.setState(
      self.htmlDiv_,
      B.utils.aria.State.SELECTED,
      isSelected,
    );
  }
}

// Register and override the default ToolboxCategory globally
B.registry.register(
  B.registry.Type.TOOLBOX_ITEM,
  (Blockly as unknown as { ToolboxCategory: { registrationName: string } })
    .ToolboxCategory.registrationName,
  CustomCategory,
  true,
);
