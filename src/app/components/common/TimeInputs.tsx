import { useState } from "react";
import { Typography } from "../ui/Typography";
import { TextInput } from "../ui/TextInput";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { ErrorMessage } from "./ErrorMessage";

interface TimeFieldConfig<T extends string> {
  label: string;
  field: T;
  max?: number;
}

interface TimeInputsProps<T extends string> {
  title: string;
  fields: TimeFieldConfig<T>[];
  values: Record<T, number>;
  onChange: (field: T, value: string) => void;
  error: string | null;
  className?: string;
}

export function TimeInputs<T extends string>(
  props: TimeInputsProps<T> & { ref?: React.Ref<HTMLDivElement> },
) {
  const { title, fields, values, onChange, error, className = "", ref } = props;
  const [focusedField, setFocusedField] = useState<T | null>(null);
  const [hoveredField, setHoveredField] = useState<T | null>(null);

  const handleIncrement = (field: T, max?: number) => {
    const currentValue = values[field];
    const newValue = currentValue + 1;
    if (max === undefined || newValue <= max) {
      onChange(field, newValue.toString());
    }
  };

  const handleDecrement = (field: T) => {
    const currentValue = values[field];
    if (currentValue > 0) {
      onChange(field, (currentValue - 1).toString());
    }
  };

  return (
    <div className={className}>
      <Typography
        variant="h3"
        color="secondary"
        align="left"
        className="mb-4 sm:mb-6"
      >
        {title}
      </Typography>

      <ErrorMessage error={error} ref={ref} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {fields.map((fieldConfig) => (
          <div
            key={fieldConfig.field}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-all duration-300 relative"
            onMouseEnter={() => setHoveredField(fieldConfig.field)}
            onMouseLeave={() => setHoveredField(null)}
          >
            <label className="block text-xs sm:text-sm pb-3 tracking-wider">
              {fieldConfig.label}
            </label>
            <TextInput
              type="number"
              value={values[fieldConfig.field].toString()}
              onChange={(value) => onChange(fieldConfig.field, value)}
              placeholder="0"
              onFocus={() => setFocusedField(fieldConfig.field)}
              onBlur={() => setFocusedField(null)}
            />
            {(focusedField === fieldConfig.field ||
              hoveredField === fieldConfig.field) && (
              <div className="absolute right-8 top-[65%] -translate-y-1/2 flex flex-col space-y-0.5">
                <button
                  type="button"
                  onClick={() =>
                    handleIncrement(fieldConfig.field, fieldConfig.max)
                  }
                  onMouseEnter={() => setHoveredField(fieldConfig.field)}
                >
                  <IoIosArrowUp className="w-3 h-3 text-gray-400 hover:text-white text-base" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDecrement(fieldConfig.field)}
                  onMouseEnter={() => setHoveredField(fieldConfig.field)}
                >
                  <IoIosArrowDown className="w-3 h-3 text-gray-400 hover:text-white text-base" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

TimeInputs.displayName = "TimeInputs";
