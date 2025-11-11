import React, { useState, useEffect } from "react";
import { Typography } from "@/components/ui/Typography";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";
import { Card } from "@/components/ui/Card";
import { buildIconItems } from "@/components/safe-wallet/helpers/buildIconItems";
import { IconSpec, JobParamIconsProps } from "@/types/icon-strip-parameter";

export const JobParamIconsStrip: React.FC<JobParamIconsProps> = ({
  timeFrame,
  recurring,
  scheduleType,
  timeInterval,
  cronExpression,
  specificSchedule,
  targetContractAddress,
  targetFunction,
  abi,
  dynamicArgumentsScriptUrl,
  triggerChainId,
  triggerContractAddress,
  triggerEvent,
  conditionType,
  upperLimit,
  lowerLimit,
  valueSourceType,
  valueSourceUrl,
  className,
  onIconClick,
  customContent,
  activeIconKey,
  disabledIcons = [],
  autoExpandIconKey,
}) => {
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const items: IconSpec[] = buildIconItems({
    scheduleType,
    timeInterval,
    cronExpression,
    specificSchedule,
    triggerChainId,
    triggerContractAddress,
    triggerEvent,
    conditionType,
    upperLimit,
    lowerLimit,
    valueSourceType,
    valueSourceUrl,
    timeFrame,
    dynamicArgumentsScriptUrl,
    recurring,
    abi,
    targetContractAddress,
    targetFunction,
  });

  // Auto-expand the specified icon on mount if it exists and is not disabled
  useEffect(() => {
    if (autoExpandIconKey && !selectedIcon && items.length > 0) {
      const iconToExpand = items.find(
        (it) => it.key === autoExpandIconKey && !disabledIcons.includes(it.key),
      );
      if (iconToExpand) {
        setSelectedIcon(autoExpandIconKey);
        if (onIconClick) {
          onIconClick(iconToExpand.key, iconToExpand.value ?? "");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExpandIconKey]);

  if (items.length === 0) {
    return null;
  }

  // Handle icon click
  const handleIconClick = (item: IconSpec) => {
    const newSelected = selectedIcon === item.key ? null : item.key;
    setSelectedIcon(newSelected);
    if (onIconClick && newSelected) {
      onIconClick(item.key, item.value ?? "");
    }
  };

  // Get selected item
  const selectedItem = items.find((it) => it.key === selectedIcon);
  const isSelectedDisabled = selectedItem
    ? disabledIcons.includes(selectedItem.key)
    : false;

  // Get custom content if available, otherwise null
  const customContentResult =
    selectedItem && customContent
      ? customContent(selectedItem.key, isSelectedDisabled)
      : null;

  return (
    <div className={`w-full ${className || ""}`}>
      {/* Icon Strip */}
      <div
        className={`flex items-center gap-2 sm:gap-1.5 md:gap-2 lg:gap-3 overflow-x-auto no-scrollbar mb-0`}
      >
        {items.map((it) => {
          const isDisabled = disabledIcons.includes(it.key);
          const isActive = activeIconKey === it.key || selectedIcon === it.key;
          const activeClasses = isActive
            ? "border border-[#C07AF6] bg-[#C07AF6]/20 text-[#C07AF6] brightness-110"
            : "border border-white/15 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10 transition-all cursor-pointer";

          return (
            // Not using Button component from UI section as i want to show button as icon
            <button
              key={`${it.key}-${it.value ?? "yes"}`}
              onClick={() => handleIconClick(it)}
              className="flex items-center focus:outline-none"
              title={`${it.value ? `: ${it.value}` : ""}${isDisabled ? "Read-only" : ""}`}
              type="button"
            >
              <span
                className={`${activeClasses} inline-flex items-center justify-center rounded-full w-8 h-8 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10`}
              >
                {it.icon}
              </span>
            </button>
          );
        })}
      </div>

      {/* Parameter Details Section - Below Icon Strip */}
      {selectedItem && (
        <div className="mt-2">
          <hr className="border-white/50 mb-4" />
          <Typography
            variant="body"
            color="white"
            align="left"
            className="mb-1"
          >
            {selectedItem.value ?? ""}
          </Typography>

          {/* Content Area with Scrollbar */}
          <div
            className={`max-h-[50vh] overflow-y-auto ${scrollbarStyles.whiteScrollbar} pr-2 ${isSelectedDisabled ? "opacity-60" : ""}`}
          >
            {customContentResult ? (
              <div className={isSelectedDisabled ? "pointer-events-none" : ""}>
                {customContentResult}
              </div>
            ) : (
              <>
                {selectedItem.value !== undefined ? (
                  <Card variant="soft" className="!p-3 !sm:p-6">
                    <Typography variant="body" color="white" align="left">
                      {String(selectedItem.value)}
                    </Typography>
                  </Card>
                ) : (
                  <Typography variant="body" color="secondary" align="left">
                    No value provided
                  </Typography>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobParamIconsStrip;
