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

  return (
    <div ref={permissionCheckboxRef}>
      <Card className="flex flex-col items-start gap-2 mt-4">
        <div className="flex items-start gap-2">
          <input
            id="blockly-permission-checkbox"
            type="checkbox"
            checked={hasConfirmedPermission}
            onChange={(e) => {
              setHasConfirmedPermission(e.target.checked);
              if (e.target.checked) setPermissionError(null);
            }}
            className="w-4 h-4 mt-1"
          />
          <label
            htmlFor="blockly-permission-checkbox"
            className="text-sm select-none text-gray-400 cursor-pointer"
          >
            If your target function contains a modifier or requires certain
            address for calling the function, then make sure that this
            <span className="ml-2 text-white break-all">{triggerAddress}</span>
            <LucideCopyButton
              text={triggerAddress}
              className="align-middle inline-block !px-2"
            />
            address have role/permission to call that function.
          </label>
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
