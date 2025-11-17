import React from "react";
import {
  Timer,
  SlidersHorizontalIcon,
  Braces,
  FunctionSquare,
  ChevronUp,
  ChevronDown,
  AlarmClock,
  CalendarCog,
  Repeat2,
  Link2,
  ScrollTextIcon,
  BellDot,
  Ampersand,
  SquareArrowOutUpRightIcon,
  Cable,
  RotateCcw,
  RefreshCwOff,
  FileCode,
  Scroll,
} from "lucide-react";
import { BuildIconItemsArgs, IconSpec } from "@/types/icon-strip-parameter";

export function buildIconItems(args: BuildIconItemsArgs): IconSpec[] {
  const {
    // Time based
    scheduleType,
    timeInterval,
    cronExpression,
    specificSchedule,
    // Event based
    triggerChainId,
    triggerContractAddress,
    triggerEvent,
    // Condition based
    conditionType,
    upperLimit,
    lowerLimit,
    valueSourceType,
    valueSourceUrl,
    // Common
    timeFrame,
    dynamicArgumentsScriptUrl,
    recurring,
    abi,
    // Contract based
    targetContractAddress,
    targetFunction,
  } = args;

  const items: IconSpec[] = [];

  const add = (
    condition: boolean,
    key: string,
    value: string | undefined,
    icon: React.ReactNode,
  ) => {
    if (condition) {
      items.push({ key, value, icon });
    }
  };

  // Time based parameters
  add(
    !!scheduleType,
    "scheduleType",
    scheduleType ? scheduleType : undefined,
    <SlidersHorizontalIcon size={16} />,
  );
  add(
    typeof timeInterval === "number",
    "timeInterval",
    Number.isFinite(timeInterval) ? String(timeInterval) : undefined,
    <Repeat2 size={16} />,
  );
  add(
    !!cronExpression,
    "cronExpression",
    cronExpression ? cronExpression : undefined,
    <CalendarCog size={16} />,
  );
  add(
    !!specificSchedule,
    "specificSchedule",
    typeof specificSchedule === "number"
      ? String(specificSchedule)
      : specificSchedule,
    <AlarmClock size={16} />,
  );

  // Event based parameters
  add(
    !!triggerChainId,
    "triggerChainId",
    typeof triggerChainId === "number" ? String(triggerChainId) : undefined,
    <Link2 size={16} />,
  );
  add(
    !!triggerContractAddress,
    "triggerContractAddress",
    triggerContractAddress ? triggerContractAddress : undefined,
    <ScrollTextIcon size={16} />,
  );
  add(
    !!triggerEvent,
    "triggerEvent",
    triggerEvent ? triggerEvent : undefined,
    <BellDot size={16} />,
  );

  // Condition based parameters
  add(
    !!conditionType,
    "conditionType",
    conditionType ? conditionType : undefined,
    <Ampersand size={16} />,
  );
  add(
    typeof upperLimit === "number",
    "upperLimit",
    typeof upperLimit === "number" ? String(upperLimit) : undefined,
    <ChevronUp size={16} />,
  );
  add(
    typeof lowerLimit === "number",
    "lowerLimit",
    typeof lowerLimit === "number" ? String(lowerLimit) : undefined,
    <ChevronDown size={16} />,
  );
  add(
    !!valueSourceType,
    "valueSourceType",
    valueSourceType ? valueSourceType : undefined,
    <Cable size={16} />,
  );
  add(
    !!valueSourceUrl,
    "valueSourceUrl",
    valueSourceUrl ? valueSourceUrl : undefined,
    <SquareArrowOutUpRightIcon size={16} />,
  );

  // Common parameters
  add(
    typeof timeFrame === "number",
    "timeFrame",
    Number.isFinite(timeFrame) ? String(timeFrame) : undefined,
    <Timer size={16} />,
  );
  add(
    !!dynamicArgumentsScriptUrl,
    "dynamicArgumentsScriptUrl",
    dynamicArgumentsScriptUrl ? "Script" : undefined,
    <FileCode size={16} />,
  );
  add(
    recurring !== undefined,
    "recurring",
    recurring ? "Yes" : "No",
    recurring ? <RotateCcw size={16} /> : <RefreshCwOff size={16} />,
  );
  add(!!abi, "abi", abi, <Braces size={16} />);

  // Contract based parameters
  add(
    !!targetContractAddress,
    "targetContractAddress",
    targetContractAddress ? targetContractAddress : undefined,
    <Scroll size={16} />,
  );
  add(
    !!targetFunction,
    "targetFunction",
    targetFunction ? targetFunction : undefined,
    <FunctionSquare size={16} />,
  );

  return items;
}
