import React from "react";
import { Card } from "../../ui/Card";
import { LucideCopyButton } from "../../ui/CopyButton";
import networksData from "@/utils/networks.json";

interface PermissionCardProps {
  hasConfirmedPermission: boolean;
  setHasConfirmedPermission: (confirmed: boolean) => void;
  permissionError: string | null;
  setPermissionError: (error: string | null) => void;
  permissionCheckboxRef: React.RefObject<HTMLDivElement | null>;
  selectedNetwork: string;
}

export function PermissionCard({
  hasConfirmedPermission,
  setHasConfirmedPermission,
  permissionError,
  setPermissionError,
  permissionCheckboxRef,
  selectedNetwork,
}: PermissionCardProps) {
  const triggerAddress =
    networksData.supportedNetworks.find((n) => n.name === selectedNetwork)
      ?.type === "mainnet"
      ? "0x3509F38e10eB3cDcE7695743cB7e81446F4d8A33"
      : "0x179c62e83c3f90981B65bc12176FdFB0f2efAD54";

  const handleToggle = () => {
    const newValue = !hasConfirmedPermission;
    setHasConfirmedPermission(newValue);
    if (newValue) setPermissionError(null);
  };

  return (
    <div ref={permissionCheckboxRef} data-tour-id="permission-card">
      <Card
        className="flex flex-col items-start gap-2 mt-4 cursor-pointer hover:border-white/20"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-2">
          <input
            id="blockly-permission-checkbox"
            type="checkbox"
            checked={hasConfirmedPermission}
            onChange={() => {}}
            className="w-4 h-4 mt-1 pointer-events-none"
          />
          <div className="text-sm select-none text-gray-400">
            If your target function contains a modifier or requires certain
            address for calling the function, then make sure that this
            <span className="ml-2 text-white break-all">{triggerAddress}</span>
            <span onClick={(e) => e.stopPropagation()} className="inline-block">
              <LucideCopyButton
                text={triggerAddress}
                className="align-middle inline-block !px-2"
              />
            </span>
            address have role/permission to call that function.
          </div>
        </div>
        {permissionError && (
          <div className="text-red-500 text-xs sm:text-sm ml-6">
            {permissionError}
          </div>
        )}
      </Card>
    </div>
  );
}
