"use client";

import { useState, useMemo, useCallback } from "react";
import { Typography } from "@/components/ui/Typography";
import JobParamIcons from "@/components/safe-wallet/helpers/JobParamIconsStrip";
import { TokenJobParamsForm } from "@/components/safe-wallet/TokenJobParamsForm";
import {
  templateFields,
  ParamFieldWithRules,
} from "@/components/safe-wallet/token-templates/validations/templateFields";

export type BalanceMaintainerParams = {
  contractAddress?: string;
  minimumBalance?: string;
  timeFrame?: string; // Store as string for form inputs
  timeInterval?: string; // Store as string for form inputs
  targetFunction?: string;
};

interface BalanceMaintainerTokenTemplateProps {
  params?: BalanceMaintainerParams;
  onParamsChange?: (params: BalanceMaintainerParams) => void;
  errors?: {
    contractAddress?: string;
    minimumBalance?: string;
    timeFrame?: string;
    timeInterval?: string;
  };
}

export const BalanceMaintainerTokenTemplate: React.FC<
  BalanceMaintainerTokenTemplateProps
> = ({ params: externalParams, onParamsChange, errors }) => {
  const [internalParams, setInternalParams] = useState<BalanceMaintainerParams>(
    {
      contractAddress: "",
      minimumBalance: "",
      timeFrame: "",
      timeInterval: "",
    },
  );

  const params = externalParams || internalParams;
  const handleParamsChange = onParamsChange || setInternalParams;

  const handleParamsChangeWrapper = useCallback(
    (newParams: Record<string, string | undefined>) => {
      handleParamsChange(newParams as BalanceMaintainerParams);
    },
    [handleParamsChange],
  );

  // Get fields for different parameter sections
  const { contractFields, timeFrameFields, timeIntervalFields } =
    useMemo(() => {
      const balanceFields = templateFields["balance-maintainer"] || {};

      return {
        contractFields: (balanceFields["targetFunction"] ||
          []) as ParamFieldWithRules[],
        timeFrameFields: (balanceFields["timeFrame"] ||
          []) as ParamFieldWithRules[],
        timeIntervalFields: (balanceFields["timeInterval"] ||
          []) as ParamFieldWithRules[],
      };
    }, []);

  const contractParamsContent = (paramKey: string, isDisabled: boolean) => {
    if (paramKey === "targetFunction") {
      return (
        <TokenJobParamsForm<Record<string, string | undefined>>
          fields={contractFields}
          values={params as Record<string, string | undefined>}
          onChange={handleParamsChangeWrapper}
          errors={errors as Record<string, string> | undefined}
          disabled={isDisabled}
        />
      );
    }

    if (paramKey === "timeFrame") {
      return (
        <TokenJobParamsForm<Record<string, string | undefined>>
          fields={timeFrameFields}
          values={params as Record<string, string | undefined>}
          onChange={handleParamsChangeWrapper}
          errors={errors as Record<string, string> | undefined}
          disabled={isDisabled}
        />
      );
    }

    if (paramKey === "timeInterval") {
      return (
        <TokenJobParamsForm<Record<string, string | undefined>>
          fields={timeIntervalFields}
          values={params as Record<string, string | undefined>}
          onChange={handleParamsChangeWrapper}
          errors={errors as Record<string, string> | undefined}
          disabled={isDisabled}
        />
      );
    }

    return null;
  };

  const timeFrameNumber = Number(params.timeFrame ?? NaN);
  const timeIntervalNumber = Number(params.timeInterval ?? NaN);

  return (
    <>
      <Typography variant="body" color="white" align="left" className="mb-4">
        Maintain Minimum ETH Balance for a smart contract
      </Typography>
      {/* Parameter icons - only show necessary user input fields */}
      <JobParamIcons
        timeFrame={timeFrameNumber}
        timeInterval={timeIntervalNumber}
        targetFunction={
          params.targetFunction ||
          "execJobFromHub(address,address,uint256,bytes,uint8)"
        }
        size="sm"
        customContent={contractParamsContent}
        activeIconKey={null}
        autoExpandIconKey={timeIntervalFields[0].name}
      />
    </>
  );
};
