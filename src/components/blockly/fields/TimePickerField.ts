import * as Blockly from "blockly/core";

type TimeState = {
  hour12: number; // 1-12
  minute: number; // 0-59
  isPM: boolean;
};

export class TimePickerField extends Blockly.FieldTextInput {
  private state_: TimeState;
  private dropdownContent_: HTMLElement | null = null;
  private wasMovable_: boolean | null = null;

  constructor(value?: string) {
    super(value);
    const parsed =
      TimePickerField.parseTimeFlexible_(value) ?? TimePickerField.now_();
    this.state_ = parsed;
    this.setValue(
      TimePickerField.formatTime_(parsed.hour12, parsed.minute, parsed.isPM),
    );
  }

  showEditor_() {
    super.showEditor_();
    // Hide default text editor to avoid focus/gesture conflicts
    try {
      Blockly.WidgetDiv.hide();
    } catch {}
    // We won't use the text input
    this.htmlInput_ = undefined as unknown as HTMLInputElement;
    // Cancel any gesture that may have started from the click that opened the editor
    this.cancelGesture_();
    // Temporarily prevent the block from being dragged while the picker is open
    if (this.sourceBlock_) {
      this.wasMovable_ = this.sourceBlock_.isMovable();
      try {
        this.sourceBlock_.setMovable(false);
      } catch {}
    }

    const content = this.buildTimePicker_();
    // Stop events inside dropdown from bubbling to Blockly and starting drags,
    // but DO NOT preventDefault so scrolling still works.
    [
      "mousedown",
      "pointerdown",
      "click",
      "touchstart",
      "touchmove",
      "wheel",
    ].forEach((evt) => {
      content.addEventListener(
        evt,
        (e) => {
          e.stopPropagation();
        },
        { passive: true },
      );
    });
    this.dropdownContent_ = content;

    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    Blockly.DropDownDiv.getContentDiv().appendChild(content);
    Blockly.DropDownDiv.setColour(
      "var(--tg-card-bg, #0b0f1a)",
      "var(--tg-card-border, #2a3142)",
    );
    Blockly.DropDownDiv.showPositionedByField(this, this.onDropdownHide_);
  }

  doValueUpdate_(newValue: string) {
    if (newValue !== this.getValue()) {
      super.doValueUpdate_(newValue);
    }
  }

  render_() {
    super.render_();
    // Ensure we don't rely on a text input
    if (this.htmlInput_) {
      this.htmlInput_.readOnly = true;
    }
  }

  private onDropdownHide_ = () => {
    // Restore block movability
    if (this.sourceBlock_ && this.wasMovable_ !== null) {
      try {
        this.sourceBlock_.setMovable(this.wasMovable_);
      } catch {}
      this.wasMovable_ = null;
    }
    // Cancel any lingering gesture
    this.cancelGesture_();
    // Clear touch identifier if present
    type BlocklyWithTouch = typeof Blockly & {
      Touch?: { clearTouchIdentifier?: () => void };
    };
    const B = Blockly as BlocklyWithTouch;
    try {
      B.Touch?.clearTouchIdentifier?.();
    } catch {}
    this.dropdownContent_ = null;
  };

  private buildTimePicker_(): HTMLElement {
    const container = document.createElement("div");
    container.style.minWidth = "280px";
    container.style.maxWidth = "320px";
    container.style.padding = "12px";
    container.style.borderRadius = "12px";
    container.style.background =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--tg-card-bg",
      ) || "#0b0f1a";
    container.style.color =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--tg-text-primary",
      ) || "#e2e8f0";
    container.style.border = `1px solid ${
      getComputedStyle(document.documentElement).getPropertyValue(
        "--tg-card-border",
      ) || "#2a3142"
    }`;

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "space-between";
    header.style.marginBottom = "8px";

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.fontSize = "14px";
    title.textContent = TimePickerField.formatTime_(
      this.state_.hour12,
      this.state_.minute,
      this.state_.isPM,
    );

    header.appendChild(title);

    const body = document.createElement("div");
    body.style.display = "grid";
    body.style.gridTemplateColumns = "1fr 1fr 80px"; // hours, minutes, am/pm
    body.style.gap = "12px";
    body.style.alignItems = "start";

    // Hours grid (1-12)
    const hoursCol = document.createElement("div");
    const hoursLabel = document.createElement("div");
    hoursLabel.textContent = "Hours";
    hoursLabel.style.opacity = "0.7";
    hoursLabel.style.fontSize = "12px";
    hoursLabel.style.marginBottom = "6px";
    const hoursGrid = document.createElement("div");
    hoursGrid.style.display = "grid";
    hoursGrid.style.gridTemplateColumns = "1fr"; // single column
    hoursGrid.style.gap = "4px";
    hoursGrid.style.maxHeight = "220px"; // fixed height with its own scroll
    hoursGrid.style.overflowY = "auto";
    hoursGrid.style.overscrollBehavior = "contain";
    hoursGrid.style.touchAction = "pan-y";
    hoursGrid.style.scrollbarGutter = "stable";
    hoursGrid.style.paddingRight = "4px";
    (hoursGrid as HTMLElement).tabIndex = 0; // focusable for wheel/keyboard
    hoursGrid.addEventListener(
      "wheel",
      (e) => {
        // Let it scroll, but ensure it scrolls even if buttons capture focus
        const el = hoursGrid as HTMLElement;
        el.scrollTop += (e as WheelEvent).deltaY;
        e.stopPropagation();
      },
      { passive: true },
    );
    for (let h = 1; h <= 12; h++) {
      const btn = document.createElement("button");
      btn.textContent = String(h).padStart(2, "0");
      btn.style.padding = "6px 0";
      btn.style.borderRadius = "9999px"; // circular pill
      btn.style.border = "1px solid transparent";
      btn.style.background = "transparent";
      btn.style.color = "inherit";
      btn.style.cursor = "pointer";
      btn.style.height = "32px";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      if (h === this.state_.hour12) {
        btn.style.background =
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff";
        btn.style.color = "#0b0f1a";
      }
      btn.addEventListener("click", () => {
        this.state_.hour12 = h;
        // Rerender hours highlighting
        title.textContent = TimePickerField.formatTime_(
          this.state_.hour12,
          this.state_.minute,
          this.state_.isPM,
        );
        this.updateHoursHighlight_(hoursGrid);
      });
      hoursGrid.appendChild(btn);
    }
    hoursCol.appendChild(hoursLabel);
    hoursCol.appendChild(hoursGrid);

    // Minutes grid (0-59 step 1)
    const minsCol = document.createElement("div");
    const minsLabel = document.createElement("div");
    minsLabel.textContent = "Minutes";
    minsLabel.style.opacity = "0.7";
    minsLabel.style.fontSize = "12px";
    minsLabel.style.marginBottom = "6px";
    const minsGrid = document.createElement("div");
    minsGrid.style.display = "grid";
    minsGrid.style.gridTemplateColumns = "1fr"; // single column
    minsGrid.style.gap = "4px";
    minsGrid.style.maxHeight = "220px"; // fixed height with its own scroll
    minsGrid.style.overflowY = "auto";
    minsGrid.style.overscrollBehavior = "contain";
    minsGrid.style.touchAction = "pan-y";
    minsGrid.style.scrollbarGutter = "stable";
    minsGrid.style.paddingRight = "4px";
    (minsGrid as HTMLElement).tabIndex = 0;
    minsGrid.addEventListener(
      "wheel",
      (e) => {
        const el = minsGrid as HTMLElement;
        el.scrollTop += (e as WheelEvent).deltaY;
        e.stopPropagation();
      },
      { passive: true },
    );
    for (let m = 0; m < 60; m += 1) {
      const btn = document.createElement("button");
      btn.textContent = String(m).padStart(2, "0");
      btn.style.padding = "6px 0";
      btn.style.borderRadius = "9999px"; // circular pill
      btn.style.border = "1px solid transparent";
      btn.style.background = "transparent";
      btn.style.color = "inherit";
      btn.style.cursor = "pointer";
      btn.style.height = "32px";
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      if (m === this.state_.minute) {
        btn.style.background =
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff";
        btn.style.color = "#0b0f1a";
      }
      btn.addEventListener("click", () => {
        this.state_.minute = m;
        // Update title and minute highlights, but do NOT close yet
        title.textContent = TimePickerField.formatTime_(
          this.state_.hour12,
          this.state_.minute,
          this.state_.isPM,
        );
        this.updateMinutesHighlight_(minsGrid);
      });
      minsGrid.appendChild(btn);
    }
    minsCol.appendChild(minsLabel);
    minsCol.appendChild(minsGrid);

    // AM/PM column
    const merCol = document.createElement("div");
    const merLabel = document.createElement("div");
    merLabel.textContent = "AM/PM";
    merLabel.style.opacity = "0.7";
    merLabel.style.fontSize = "12px";
    merLabel.style.marginBottom = "6px";
    const merBox = document.createElement("div");
    merBox.style.display = "grid";
    merBox.style.gridTemplateColumns = "1fr";
    merBox.style.gap = "6px";
    merBox.style.maxHeight = "220px";

    const amBtn = document.createElement("button");
    amBtn.textContent = "AM";
    amBtn.style.padding = "8px 0";
    amBtn.style.borderRadius = "9999px";
    amBtn.style.border = "1px solid transparent";
    amBtn.style.background = this.state_.isPM
      ? "transparent"
      : getComputedStyle(document.documentElement).getPropertyValue(
          "--tg-primary",
        ) || "#7c5cff";
    amBtn.style.color = this.state_.isPM ? "inherit" : "#0b0f1a";
    amBtn.style.cursor = "pointer";
    amBtn.style.height = "36px";
    amBtn.style.display = "flex";
    amBtn.style.alignItems = "center";
    amBtn.style.justifyContent = "center";
    amBtn.addEventListener("click", () => {
      this.state_.isPM = false;
      title.textContent = TimePickerField.formatTime_(
        this.state_.hour12,
        this.state_.minute,
        this.state_.isPM,
      );
      this.updateMerHighlight_(amBtn, pmBtn);
      const formatted = TimePickerField.formatTime_(
        this.state_.hour12,
        this.state_.minute,
        this.state_.isPM,
      );
      this.setEditorValue_(formatted);
      this.setValue(formatted);
      Blockly.DropDownDiv.hideIfOwner(this);
    });

    const pmBtn = document.createElement("button");
    pmBtn.textContent = "PM";
    pmBtn.style.padding = "8px 0";
    pmBtn.style.borderRadius = "9999px";
    pmBtn.style.border = "1px solid transparent";
    pmBtn.style.background = this.state_.isPM
      ? getComputedStyle(document.documentElement).getPropertyValue(
          "--tg-primary",
        ) || "#7c5cff"
      : "transparent";
    pmBtn.style.color = this.state_.isPM ? "#0b0f1a" : "inherit";
    pmBtn.style.cursor = "pointer";
    pmBtn.style.height = "36px";
    pmBtn.style.display = "flex";
    pmBtn.style.alignItems = "center";
    pmBtn.style.justifyContent = "center";
    pmBtn.addEventListener("click", () => {
      this.state_.isPM = true;
      title.textContent = TimePickerField.formatTime_(
        this.state_.hour12,
        this.state_.minute,
        this.state_.isPM,
      );
      this.updateMerHighlight_(amBtn, pmBtn);
      const formatted = TimePickerField.formatTime_(
        this.state_.hour12,
        this.state_.minute,
        this.state_.isPM,
      );
      this.setEditorValue_(formatted);
      this.setValue(formatted);
      Blockly.DropDownDiv.hideIfOwner(this);
    });

    merBox.appendChild(amBtn);
    merBox.appendChild(pmBtn);
    merCol.appendChild(merLabel);
    merCol.appendChild(merBox);

    body.appendChild(hoursCol);
    body.appendChild(minsCol);
    body.appendChild(merCol);

    container.appendChild(header);
    container.appendChild(body);
    return container;
  }

  private updateHoursHighlight_(grid: HTMLElement) {
    const buttons = Array.from(grid.querySelectorAll("button"));
    buttons.forEach((btn, idx) => {
      const isSelected = idx + 1 === this.state_.hour12; // idx is 0-based
      (btn as HTMLButtonElement).style.background = isSelected
        ? getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff"
        : "transparent";
      (btn as HTMLButtonElement).style.color = isSelected
        ? "#0b0f1a"
        : "inherit";
    });
  }

  private updateMinutesHighlight_(grid: HTMLElement) {
    const buttons = Array.from(grid.querySelectorAll("button"));
    buttons.forEach((btn) => {
      const value = Number((btn as HTMLButtonElement).textContent || 0);
      const isSelected = value === this.state_.minute;
      (btn as HTMLButtonElement).style.background = isSelected
        ? getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff"
        : "transparent";
      (btn as HTMLButtonElement).style.color = isSelected
        ? "#0b0f1a"
        : "inherit";
    });
  }

  private updateMerHighlight_(
    amBtn: HTMLButtonElement,
    pmBtn: HTMLButtonElement,
  ) {
    const primary =
      getComputedStyle(document.documentElement).getPropertyValue(
        "--tg-primary",
      ) || "#7c5cff";
    if (this.state_.isPM) {
      pmBtn.style.background = primary;
      pmBtn.style.color = "#0b0f1a";
      amBtn.style.background = "transparent";
      amBtn.style.color = "inherit";
    } else {
      amBtn.style.background = primary;
      amBtn.style.color = "#0b0f1a";
      pmBtn.style.background = "transparent";
      pmBtn.style.color = "inherit";
    }
  }

  private cancelGesture_() {
    type WorkspaceWithCancel = Blockly.WorkspaceSvg & {
      cancelCurrentGesture?: () => void;
    };
    const ws = this.sourceBlock_?.workspace as WorkspaceWithCancel | undefined;
    try {
      ws?.cancelCurrentGesture?.();
    } catch {}
  }

  private static now_(): TimeState {
    const d = new Date();
    const isPM = d.getHours() >= 12;
    const hour12 = d.getHours() % 12 || 12;
    return { hour12, minute: d.getMinutes(), isPM };
  }

  private static formatTime_(
    hour12: number,
    minute: number,
    isPM: boolean,
  ): string {
    return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${isPM ? "PM" : "AM"}`;
  }

  private static parseTimeFlexible_(value?: string): TimeState | null {
    if (!value) return null;
    const trimmed = value.trim();
    // 12h with meridiem, e.g., 01:05 PM
    let m = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m) {
      const hour12 = Math.min(Math.max(parseInt(m[1], 10), 1), 12);
      const minute = Math.min(Math.max(parseInt(m[2], 10), 0), 59);
      const isPM = m[3].toUpperCase() === "PM";
      return { hour12, minute, isPM };
    }
    // 24h, e.g., 14:30
    m = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (m) {
      const h24 = Math.min(Math.max(parseInt(m[1], 10), 0), 23);
      const minute = Math.min(Math.max(parseInt(m[2], 10), 0), 59);
      const isPM = h24 >= 12;
      const hour12 = h24 % 12 || 12;
      return { hour12, minute, isPM };
    }
    return null;
  }
}

Blockly.fieldRegistry.register("field_time_picker", TimePickerField);
