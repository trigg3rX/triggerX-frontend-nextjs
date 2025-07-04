import React from "react";
import { JobForm } from "./JobForm";
import { useJob } from "@/contexts/JobContext";
import BalanceMaintainer from "./templates/BalanceMaintainer";
import PriceOracle from "./templates/PriceOracle";
import StakingRewards from "./templates/StakingRewards";

export const JobFormSection: React.FC = () => {
  const { selectedJob } = useJob();

  const renderSelectedTemplate = () => {
    if (!selectedJob) return null;

    switch (selectedJob.id) {
      case "balance-maintainer":
        return <BalanceMaintainer />;
      case "price-oracle":
        return <PriceOracle />;
      case "staking-rewards":
        return <StakingRewards />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">{renderSelectedTemplate() || <JobForm />}</div>
  );
};
