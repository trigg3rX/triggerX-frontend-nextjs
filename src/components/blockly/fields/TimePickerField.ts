import * as Blockly from "blockly/core";

export class TimePickerField extends Blockly.FieldTextInput {
  constructor(value?: string) {
    super(value);
    this.setValue(value || "");
  }

  showEditor_() {
    super.showEditor_();
    if (this.htmlInput_) {
      // Use simple text input instead of time picker
      this.htmlInput_.type = "text";
      this.htmlInput_.value = this.getValue() || "";
      this.htmlInput_.style.width = "100%";
      this.htmlInput_.style.display = "block";
      this.htmlInput_.placeholder = "HH:MM (e.g., 14:30)";
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
      this.htmlInput_.placeholder = "HH:MM (e.g., 14:30)";
    }
  }
}

// Register the field
Blockly.fieldRegistry.register("field_time_picker", TimePickerField);
