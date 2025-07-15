import { useJobFormContext } from "@/hooks/useJobFormContext";
import { RadioGroup } from "../../ui/RadioGroup";

export const RecurringInput = ({
  readOnly = false,
}: {
  readOnly?: boolean;
}) => {
  const { recurring, setRecurring } = useJobFormContext();

  const options = [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ];

  return (
    <RadioGroup
      label="Recurring"
      options={options}
      value={recurring}
      onChange={(value) => {
        if (!readOnly) setRecurring(value as boolean);
      }}
      name="recurring"
      disabled={readOnly}
    />
  );
};
