import { useEffect } from "react";
import { javascriptGenerator } from "blockly/javascript";

import { chainSelectionGenerator } from "../blocks/default_blocks";

import { timeBasedJobWrapperGenerator } from "../blocks/job-type/time_based_job_wrapper";
import { eventBasedJobWrapperGenerator } from "../blocks/job-type/event_based_job_wrapper";
import { conditionBasedJobWrapperGenerator } from "../blocks/job-type/condition_based_job_wrapper";

import { timeframeJobGenerator } from "../blocks/utility/timeframe_job";
import { recurringJobGenerator } from "../blocks/utility/recurring_job";
import { manualAbiInputGenerator } from "../blocks/utility/manual_abi_input";
import { specificDatetimeGenerator } from "../blocks/utility/time/specific_datetime";
import { cronExpressionGenerator } from "../blocks/utility/time/cron_expression";
import { timeIntervalAtJobGenerator } from "../blocks/utility/time/time_interval_at_job";
import { eventListenerGenerator } from "../blocks/utility/event/event_listener";
import { eventFilterGenerator } from "../blocks/utility/event/event_filter";
import { conditionMonitorGenerator } from "../blocks/utility/condition/condition_monitor";
import { executeFunctionGenerator } from "../blocks/utility/contract/execute_function";
import { staticArgumentsGenerator } from "../blocks/utility/contract/static_arguments";
import { dynamicArgumentsGenerator } from "../blocks/utility/contract/dynamic_arguments";
import { createSafeWalletGenerator } from "../blocks/utility/safe-wallet/create_safe_wallet";
import { importSafeWalletGenerator } from "../blocks/utility/safe-wallet/import_safe_wallet";
import { selectSafeWalletGenerator } from "../blocks/utility/safe-wallet/select_safe_wallet";
import { executeThroughSafeWalletGenerator } from "../blocks/utility/safe-wallet/execute_through_safe_wallet";
import { safeTransactionGenerator } from "../blocks/utility/safe-wallet/safe_transaction";

// Custom hook to register all Blockly block generators
export function useBlocklyGenerators() {
  useEffect(() => {
    // Default blocks
    javascriptGenerator.forBlock["chain_selection"] = chainSelectionGenerator;

    // Job type blocks
    javascriptGenerator.forBlock["time_based_job_wrapper"] =
      timeBasedJobWrapperGenerator;
    javascriptGenerator.forBlock["event_based_job_wrapper"] =
      eventBasedJobWrapperGenerator;
    javascriptGenerator.forBlock["condition_based_job_wrapper"] =
      conditionBasedJobWrapperGenerator;

    // Utility blocks
    javascriptGenerator.forBlock["timeframe_job"] = timeframeJobGenerator;
    javascriptGenerator.forBlock["recurring_job"] = recurringJobGenerator;
    javascriptGenerator.forBlock["manual_abi_input"] = manualAbiInputGenerator;
    javascriptGenerator.forBlock["specific_datetime"] =
      specificDatetimeGenerator;
    javascriptGenerator.forBlock["cron_expression"] = cronExpressionGenerator;
    javascriptGenerator.forBlock["time_interval_at_job"] =
      timeIntervalAtJobGenerator;
    javascriptGenerator.forBlock["event_listener"] = eventListenerGenerator;
    javascriptGenerator.forBlock["event_filter"] = eventFilterGenerator;
    javascriptGenerator.forBlock["condition_monitor"] =
      conditionMonitorGenerator;
    javascriptGenerator.forBlock["execute_function"] = executeFunctionGenerator;
    javascriptGenerator.forBlock["static_arguments"] = staticArgumentsGenerator;
    javascriptGenerator.forBlock["dynamic_arguments"] =
      dynamicArgumentsGenerator;
    javascriptGenerator.forBlock["create_safe_wallet"] =
      createSafeWalletGenerator;
    javascriptGenerator.forBlock["import_safe_wallet"] =
      importSafeWalletGenerator;
    javascriptGenerator.forBlock["select_safe_wallet"] =
      selectSafeWalletGenerator;
    javascriptGenerator.forBlock["execute_through_safe_wallet"] =
      executeThroughSafeWalletGenerator;
    javascriptGenerator.forBlock["safe_transaction"] = safeTransactionGenerator;
  }, []);
}
