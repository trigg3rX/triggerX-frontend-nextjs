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
import { timeBasedJobWrapperGenerator } from "../blocks/job-type/time_based_job_wrapper";
import { eventBasedJobWrapperGenerator } from "../blocks/job-type/event_based_job_wrapper";
import { conditionBasedJobWrapperGenerator } from "../blocks/job-type/condition_based_job_wrapper";

import { contractActionGenerator } from "../blocks/utility/contract_action";
import { timeframeJobGenerator } from "../blocks/utility/timeframe_job";
import { recurringJobGenerator } from "../blocks/utility/recurring_job";
import { manualAbiInputGenerator } from "../blocks/utility/contract/manual_abi_input";
import { specificDatetimeGenerator } from "../blocks/utility/time/specific_datetime";
import { cronExpressionGenerator } from "../blocks/utility/time/cron_expression";
import { timeIntervalAtJobGenerator } from "../blocks/utility/time/time_interval_at_job";
import { eventListenerGenerator } from "../blocks/utility/event/event_listener";
import { conditionMonitorGenerator } from "../blocks/utility/condition/condition_monitor";
import { executeFunctionGenerator } from "../blocks/utility/contract/execute_function";
import { argumentTypeGenerator } from "../blocks/utility/contract/argument_type";
import { staticArgumentsGenerator } from "../blocks/utility/contract/static_arguments";
import { dynamicArgumentsGenerator } from "../blocks/utility/contract/dynamic_arguments";

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
    javascriptGenerator.forBlock["time_based_job_wrapper"] =
      timeBasedJobWrapperGenerator;
    javascriptGenerator.forBlock["event_based_job_wrapper"] =
      eventBasedJobWrapperGenerator;
    javascriptGenerator.forBlock["condition_based_job_wrapper"] =
      conditionBasedJobWrapperGenerator;

    // Utility blocks
    javascriptGenerator.forBlock["contract_action"] = contractActionGenerator;
    javascriptGenerator.forBlock["timeframe_job"] = timeframeJobGenerator;
    javascriptGenerator.forBlock["recurring_job"] = recurringJobGenerator;
    javascriptGenerator.forBlock["manual_abi_input"] = manualAbiInputGenerator;
    javascriptGenerator.forBlock["specific_datetime"] =
      specificDatetimeGenerator;
    javascriptGenerator.forBlock["cron_expression"] = cronExpressionGenerator;
    javascriptGenerator.forBlock["time_interval_at_job"] =
      timeIntervalAtJobGenerator;
    javascriptGenerator.forBlock["event_listener"] = eventListenerGenerator;
    javascriptGenerator.forBlock["condition_monitor"] =
      conditionMonitorGenerator;
    javascriptGenerator.forBlock["execute_function"] = executeFunctionGenerator;
    javascriptGenerator.forBlock["argument_type"] = argumentTypeGenerator;
    javascriptGenerator.forBlock["static_arguments"] = staticArgumentsGenerator;
    javascriptGenerator.forBlock["dynamic_arguments"] =
      dynamicArgumentsGenerator;
  }, []);
}
