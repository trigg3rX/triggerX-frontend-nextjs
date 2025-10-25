import * as Blockly from "blockly/core";

export class DatePickerField extends Blockly.FieldTextInput {
  constructor(value?: string) {
    super(value);
    this.setValue(value || "");
  }

  showEditor_() {
    super.showEditor_();
    if (this.htmlInput_) {
      // Use simple text input instead of date picker
      this.htmlInput_.type = "text";
      this.htmlInput_.value = this.getValue() || "";
      this.htmlInput_.style.width = "100%";
      this.htmlInput_.style.display = "block";
      this.htmlInput_.placeholder = "YYYY-MM-DD (e.g., 2024-01-15)";
    }
  }

  doValueUpdate_(newValue: string) {
    if (newValue !== this.getValue()) {
      super.doValueUpdate_(newValue);
    }
  }

  // Override to keep the editor always visible
  render_() {
    super.render_();
    if (this.htmlInput_) {
      this.htmlInput_.type = "text";
      this.htmlInput_.style.display = "block";
      this.htmlInput_.style.width = "100%";
      this.htmlInput_.placeholder = "YYYY-MM-DD (e.g., 2024-01-15)";
    }
  }
}

// Register the field
Blockly.fieldRegistry.register("field_date_picker", DatePickerField);
