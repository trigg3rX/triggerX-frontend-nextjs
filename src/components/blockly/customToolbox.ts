"use client";

import * as Blockly from "blockly/core";

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

// Custom toolbox category with rounded pill design
class CustomCategory extends (B.ToolboxCategory as ToolboxCtor) {
  /** @override */
  createDom_() {
    // @ts-expect-error - calling parent method
    super.createDom_?.call(this);

    const self = this as unknown as ToolboxCategoryInstance;

    // Style the row container for pill shape
    self.rowDiv_.style.borderRadius = "10px";
    self.rowDiv_.style.margin = "10px 0px";
    self.rowDiv_.style.padding = "18px 10px";
    self.rowDiv_.style.transition = "all 0.2s ease";
    self.rowDiv_.style.display = "flex";
    self.rowDiv_.style.alignItems = "center";
    self.rowDiv_.style.gap = "0px";

    // Style the label
    const labelDom = self.rowDiv_.getElementsByClassName(
      "blocklyToolboxCategoryLabel",
    )[0] as HTMLElement | undefined;

    if (labelDom) {
      labelDom.style.fontWeight = "500";
      labelDom.style.fontSize = "14px";
    }

    return self.rowDiv_;
  }

  /** @override */
  addColourBorder_(colour: string) {
    // Fill entire row with the category colour
    const self = this as unknown as ToolboxCategoryInstance;
    self.rowDiv_.style.backgroundColor = colour;
  }

  /** @override */
  setSelected(isSelected: boolean) {
    const self = this as unknown as ToolboxCategoryInstance;
    const labelDom = self.rowDiv_.getElementsByClassName(
      "blocklyToolboxCategoryLabel",
    )[0] as HTMLElement | undefined;

    if (isSelected) {
      // Selected state: white background, colored text/icon
      self.rowDiv_.style.backgroundColor = "white";
      self.rowDiv_.style.transform = "scale(1.02)";
      self.rowDiv_.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";

      if (labelDom) labelDom.style.color = self.colour_;
      if (self.iconDom_) self.iconDom_.style.color = self.colour_;
    } else {
      // Default state: colored background, white text/icon
      self.rowDiv_.style.backgroundColor = self.colour_;
      self.rowDiv_.style.transform = "scale(1)";
      self.rowDiv_.style.boxShadow = "none";

      if (labelDom) labelDom.style.color = "white";
      if (self.iconDom_) self.iconDom_.style.color = "white";
    }

    B.utils.aria.setState(
      self.htmlDiv_,
      B.utils.aria.State.SELECTED,
      isSelected,
    );
  }
}

// Register and override default ToolboxCategory
B.registry.register(
  B.registry.Type.TOOLBOX_ITEM,
  (Blockly as unknown as { ToolboxCategory: { registrationName: string } })
    .ToolboxCategory.registrationName,
  CustomCategory,
  true,
);
