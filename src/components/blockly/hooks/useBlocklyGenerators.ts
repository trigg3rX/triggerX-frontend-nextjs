import { useEffect } from "react";
import { javascriptGenerator } from "blockly/javascript";

import {
  chainSelectionGenerator,
  walletSelectionGenerator,
} from "../blocks/default_blocks";

import { fixedTimeJobGenerator } from "../blocks/job-type/fixed_time_job";
import { intervalTimeJobGenerator } from "../blocks/job-type/interval_time_job";
import { cronTimeJobGenerator } from "../blocks/job-type/cron_time_job";
import { eventJobGenerator } from "../blocks/job-type/event_job";
import { conditionJobGenerator } from "../blocks/job-type/condition_job";

import { contractActionGenerator } from "../blocks/utility/contract_action";
import { timeframeJobGenerator } from "../blocks/utility/timeframe_job";
import { recurringJobGenerator } from "../blocks/utility/recurring_job";
import { manualAbiInputGenerator } from "../blocks/utility/manual_abi_input";

// Custom hook to register all Blockly block generators
export function useBlocklyGenerators() {
  useEffect(() => {
    // Default blocks
    javascriptGenerator.forBlock["chain_selection"] = chainSelectionGenerator;
    javascriptGenerator.forBlock["wallet_selection"] = walletSelectionGenerator;

    // Job type blocks
    javascriptGenerator.forBlock["fixed_time_job"] = fixedTimeJobGenerator;
    javascriptGenerator.forBlock["interval_time_job"] =
      intervalTimeJobGenerator;
    javascriptGenerator.forBlock["cron_time_job"] = cronTimeJobGenerator;
    javascriptGenerator.forBlock["event_job"] = eventJobGenerator;
    javascriptGenerator.forBlock["condition_job"] = conditionJobGenerator;

    // Utility blocks
    javascriptGenerator.forBlock["contract_action"] = contractActionGenerator;
    javascriptGenerator.forBlock["timeframe_job"] = timeframeJobGenerator;
    javascriptGenerator.forBlock["recurring_job"] = recurringJobGenerator;
    javascriptGenerator.forBlock["manual_abi_input"] = manualAbiInputGenerator;
  }, []);
}
