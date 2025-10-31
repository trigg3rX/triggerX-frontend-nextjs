import * as Blockly from "blockly/core";
import { Order } from "blockly/javascript";

Blockly.Blocks["manual_abi_input"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Manual ABI")
      .appendField(
        new (
          Blockly as unknown as { FieldLabel: new (text: string) => unknown }
        ).FieldLabel("paste JSON below:") as unknown as Blockly.Field,
      );
    this.setInputsInline(false);
    let field: Blockly.Field;
    try {
      const Multi = (
        Blockly as unknown as {
          FieldMultilineInput: new (text?: string) => unknown;
        }
      ).FieldMultilineInput;
      field = new Multi("") as unknown as Blockly.Field;
    } catch {
      const Single = (
        Blockly as unknown as {
          FieldTextInput: new (text?: string) => unknown;
        }
      ).FieldTextInput;
      field = new Single("") as unknown as Blockly.Field;
    }
    this.appendDummyInput("ABI_TEXT_INPUT").appendField(field, "ABI_TEXT");
    // Add a tiny spacer to expose block fill color around the editor
    this.appendDummyInput().appendField(" ");
    this.setOutput(true, "ABI_JSON");
    // Distinct colour to stand out in the Utility category
    this.setColour("#FF6E40");
    // Make the value output shape visually distinct if supported by renderer
    try {
      if (
        typeof (this as unknown as { setOutputShape?: (s: unknown) => void })
          .setOutputShape === "function"
      ) {
        const maybe = Blockly as unknown as {
          OUTPUT_SHAPE_SQUARE?: unknown;
          OUTPUT_SHAPE_ROUND?: unknown;
        };
        const shape = maybe.OUTPUT_SHAPE_SQUARE || maybe.OUTPUT_SHAPE_ROUND;
        if (shape) {
          (
            this as unknown as { setOutputShape: (s: unknown) => void }
          ).setOutputShape(shape);
        }
      }
    } catch {}
    this.setTooltip(
      "Paste ABI JSON here, then drag into the Contract Info block's Manual ABI (block) input.",
    );
    this.setHelpUrl("");
  },
};

export const manualAbiInputGenerator = function (
  block: Blockly.Block,
): [string, Order] {
  const txt = block.getFieldValue("ABI_TEXT") || "";
  const escaped = JSON.stringify(String(txt));
  return [escaped, Order.ATOMIC];
};
