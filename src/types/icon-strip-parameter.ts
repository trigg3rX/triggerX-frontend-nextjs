export type IconSpec = {
  key: string;
  value?: string;
  icon: React.ReactNode;
};

export type BuildIconItemsArgs = {
  // Time based
  scheduleType?: "cron" | "specific" | "interval";
  timeInterval?: number;
  cronExpression?: string; // cron or string
  specificSchedule?: string | number; // fixed time as number or string
  // Event based
  triggerChainId?: number; // chain id
  triggerContractAddress?: string;
  triggerEvent?: string;
  // Condition based
  conditionType?:
    | "greater_than"
    | "less_than"
    | "between"
    | "equals"
    | "not_equals"
    | "greater_equal"
    | "less_equal";
  upperLimit?: number;
  lowerLimit?: number;
  valueSourceType?: string;
  valueSourceUrl?: string; // url string
  // Common
  timeFrame?: number; // seconds
  dynamicArgumentsScriptUrl?: string; // url string
  recurring?: boolean; // boolean
  abi?: string; // JSON textarea content as string
  // Contract based
  targetContractAddress?: string; // contract address
  targetFunction?: string; // function name
};

export interface JobParamIconsProps {
  timeFrame?: number;
  recurring?: boolean;
  scheduleType?: "cron" | "specific" | "interval";
  timeInterval?: number;
  cronExpression?: string;
  specificSchedule?: string | number;
  targetContractAddress?: string;
  targetFunction?: string;
  abi?: string;
  dynamicArgumentsScriptUrl?: string;

  // Event-based
  triggerChainId?: number;
  triggerContractAddress?: string;
  triggerEvent?: string;

  // Condition-based
  conditionType?:
    | "greater_than"
    | "less_than"
    | "between"
    | "equals"
    | "not_equals"
    | "greater_equal"
    | "less_equal";
  upperLimit?: number;
  lowerLimit?: number;
  valueSourceType?: string;
  valueSourceUrl?: string;

  // UI
  className?: string;
  size?: "sm" | "md" | "lg";

  // Callbacks
  onIconClick?: (paramKey: string, paramValue?: string | number) => void;

  // Custom content for specific parameters (e.g., contract params form)
  // Receives paramKey and isDisabled flag
  customContent?: (paramKey: string, isDisabled: boolean) => React.ReactNode;

  // Active icon key (for highlighting)
  activeIconKey?: string | null;

  // Disabled icons (cannot be clicked/edited)
  disabledIcons?: string[];

  // Auto-expand icon key on mount (for user input sections)
  autoExpandIconKey?: string | null;
}
