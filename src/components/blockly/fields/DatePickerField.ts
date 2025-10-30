import * as Blockly from "blockly/core";

type CalendarState = {
  activeDate: Date;
};

export class DatePickerField extends Blockly.FieldTextInput {
  private calendarState_: CalendarState;
  private dropdownContent_: HTMLElement | null = null;
  private wasMovable_: boolean | null = null;

  constructor(value?: string) {
    super(value);
    const initial = this.parseDateStrict_(value) || new Date();
    this.calendarState_ = { activeDate: initial };
    this.setValue(value || "");
  }

  showEditor_() {
    super.showEditor_();
    // Immediately hide the default text editor to avoid focus/gesture conflicts.
    try {
      Blockly.WidgetDiv.hide();
    } catch {}
    // We won't use the text input; ensure no handlers rely on it.
    this.htmlInput_ = undefined as unknown as HTMLInputElement;
    // Cancel any gesture that may have started from the click that opened the editor
    this.cancelGesture_();
    // Temporarily prevent the block from being dragged while the calendar is open
    if (this.sourceBlock_) {
      this.wasMovable_ = this.sourceBlock_.isMovable();
      try {
        this.sourceBlock_.setMovable(false);
      } catch {}
    }
    // No text input events; using only the dropdown calendar.

    const content = this.buildCalendar_();
    // Stop events inside dropdown from bubbling to Blockly and starting drags
    ["mousedown", "pointerdown", "pointermove", "touchstart", "wheel"].forEach(
      (evt) => {
        content.addEventListener(
          evt,
          (e) => {
            e.stopPropagation();
            if (evt !== "mousedown") {
              try {
                (e as Event & { preventDefault: () => void }).preventDefault();
              } catch {}
            }
          },
          { passive: false },
        );
      },
    );
    this.dropdownContent_ = content;

    Blockly.DropDownDiv.hideWithoutAnimation();
    Blockly.DropDownDiv.clearContent();
    Blockly.DropDownDiv.getContentDiv().appendChild(content);
    Blockly.DropDownDiv.setColour(
      // Colors tuned to match a typical dark/light theme; DropDownDiv will style the container.
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
    if (this.htmlInput_) {
      this.htmlInput_.type = "text";
      this.htmlInput_.style.display = "block";
      this.htmlInput_.style.width = "100%";
      this.htmlInput_.placeholder = "YYYY-MM-DD (e.g., 2024-01-15)";
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
    // Try to cancel any lingering gesture so the block doesn't keep dragging
    this.cancelGesture_();
    type BlocklyWithTouch = typeof Blockly & {
      Touch?: { clearTouchIdentifier?: () => void };
    };
    const B = Blockly as BlocklyWithTouch;
    try {
      B.Touch?.clearTouchIdentifier?.();
    } catch {}
    this.dropdownContent_ = null;
  };

  private cancelGesture_() {
    type WorkspaceWithCancel = Blockly.WorkspaceSvg & {
      cancelCurrentGesture?: () => void;
    };
    const ws = this.sourceBlock_?.workspace as WorkspaceWithCancel | undefined;
    try {
      ws?.cancelCurrentGesture?.();
    } catch {}
  }

  private buildCalendar_(): HTMLElement {
    const container = document.createElement("div");
    container.style.minWidth = "260px";
    container.style.maxWidth = "300px";
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

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "‹";
    prevBtn.style.padding = "4px 8px";
    prevBtn.style.borderRadius = "8px";
    prevBtn.style.border = "1px solid transparent";
    prevBtn.style.background = "transparent";
    prevBtn.style.color = "inherit";
    prevBtn.style.cursor = "pointer";
    prevBtn.addEventListener("click", () => this.changeMonth_(-1));

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "›";
    nextBtn.style.padding = "4px 8px";
    nextBtn.style.borderRadius = "8px";
    nextBtn.style.border = "1px solid transparent";
    nextBtn.style.background = "transparent";
    nextBtn.style.color = "inherit";
    nextBtn.style.cursor = "pointer";
    nextBtn.addEventListener("click", () => this.changeMonth_(1));

    const title = document.createElement("div");
    title.style.fontWeight = "600";
    title.style.fontSize = "14px";
    title.textContent = this.formatMonthYear_(this.calendarState_.activeDate);

    header.appendChild(prevBtn);
    header.appendChild(title);
    header.appendChild(nextBtn);

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(7, 1fr)";
    grid.style.gap = "4px";

    // Weekday labels
    ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].forEach((d) => {
      const el = document.createElement("div");
      el.textContent = d;
      el.style.opacity = "0.7";
      el.style.fontSize = "12px";
      el.style.textAlign = "center";
      grid.appendChild(el);
    });

    // Days grid
    this.renderDays_(grid, title);

    container.appendChild(header);
    container.appendChild(grid);
    return container;
  }

  private renderDays_(grid: HTMLElement, titleEl: HTMLElement) {
    // Remove old day cells (keep weekday headers: first 7 children)
    while (grid.children.length > 7) {
      grid.removeChild(grid.lastChild as ChildNode);
    }

    const shown = new Date(this.calendarState_.activeDate.getTime());
    shown.setDate(1);
    const firstWeekday = shown.getDay();
    const month = shown.getMonth();
    const year = shown.getFullYear();

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Leading blanks
    for (let i = 0; i < firstWeekday; i++) {
      const blank = document.createElement("div");
      grid.appendChild(blank);
    }

    const today = new Date();
    const currentValue = this.parseDateStrict_(this.getValue() || undefined);

    for (let day = 1; day <= daysInMonth; day++) {
      const btn = document.createElement("button");
      btn.textContent = String(day);
      btn.style.padding = "6px 0";
      btn.style.borderRadius = "8px";
      btn.style.border = "1px solid transparent";
      btn.style.background = "transparent";
      btn.style.color = "inherit";
      btn.style.cursor = "pointer";

      const date = new Date(year, month, day);

      // Style for today
      if (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      ) {
        btn.style.border = `1px solid ${
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff"
        }`;
      }

      // Style for selected
      if (
        currentValue &&
        date.getFullYear() === currentValue.getFullYear() &&
        date.getMonth() === currentValue.getMonth() &&
        date.getDate() === currentValue.getDate()
      ) {
        btn.style.background =
          getComputedStyle(document.documentElement).getPropertyValue(
            "--tg-primary",
          ) || "#7c5cff";
        btn.style.color = "#0b0f1a";
      }

      btn.addEventListener("click", () => {
        const formatted = this.formatDate_(date);
        this.setEditorValue_(formatted);
        this.setValue(formatted);
        if (this.htmlInput_) this.htmlInput_.value = formatted;
        Blockly.DropDownDiv.hideIfOwner(this);
      });

      grid.appendChild(btn);
    }

    titleEl.textContent = this.formatMonthYear_(this.calendarState_.activeDate);
  }

  private changeMonth_(delta: number) {
    const d = new Date(this.calendarState_.activeDate.getTime());
    d.setMonth(d.getMonth() + delta);
    this.calendarState_.activeDate = d;
    if (this.dropdownContent_) {
      const grid = this.dropdownContent_.querySelector(
        "div:nth-child(2)",
      ) as HTMLElement; // header is first, grid is second
      const title = this.dropdownContent_.querySelector(
        "div:nth-child(1) > div:nth-child(2)",
      ) as HTMLElement;
      if (grid && title) this.renderDays_(grid, title);
    }
  }

  private formatDate_(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private formatMonthYear_(date: Date): string {
    return date.toLocaleString(undefined, { month: "long", year: "numeric" });
  }

  private parseDateStrict_(value?: string): Date | null {
    if (!value) return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (
      dt.getFullYear() === y &&
      dt.getMonth() === mo - 1 &&
      dt.getDate() === d
    ) {
      return dt;
    }
    return null;
  }
}

Blockly.fieldRegistry.register("field_date_picker", DatePickerField);
