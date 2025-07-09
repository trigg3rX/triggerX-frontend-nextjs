import { Typography } from "../ui/Typography";
import { TextInput } from "../ui/TextInput";
import { FormErrorMessage } from "./FormErrorMessage";

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
  onClearError?: () => void;
}

export function TimeInputs<T extends string>(
  props: TimeInputsProps<T> & { ref?: React.Ref<HTMLDivElement> },
) {
  const { title, fields, values, onChange, error, ref, onClearError } = props;

  // Clear error on any input change
  const onAnyInputChange = (field: T, value: string) => {
    if (onClearError) onClearError();
    onChange(field, value);
  };

  return (
    <div className={`className space-y-0`}>
      <Typography
        variant="h3"
        color="secondary"
        align="left"
        className="mb-2 sm:mb-4"
      >
        {title}
      </Typography>

      <FormErrorMessage error={error} ref={ref} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {fields.map((fieldConfig) => (
          <div
            key={fieldConfig.field}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-white/20 transition-all duration-300 relative"
          >
            <label className="block text-xs sm:text-sm pb-3 tracking-wider">
              {fieldConfig.label}
            </label>
            <TextInput
              type="number"
              value={values[fieldConfig.field].toString()}
              onChange={(value) => onAnyInputChange(fieldConfig.field, value)}
              placeholder="0"
              min={0}
              max={fieldConfig.max}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

TimeInputs.displayName = "TimeInputs";
