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

import {
  controlsIfGenerator,
  logicCompareEqualityGenerator,
  logicCompareGreaterThanGenerator,
  logicNotGenerator,
} from "../blocks/logic_blocks";

import {
  controlsForeverGenerator,
  controlsRepeatEveryIntervalGenerator,
  controlsRepeatUntilGenerator,
} from "../blocks/loop_blocks";

import { mathNumberGenerator, mathRoundGenerator } from "../blocks/math_blocks";

import {
  getCurrentTimeGenerator,
  getPriceGenerator,
  jobTargetTimeGenerator,
} from "../blocks/dynamic_data_blocks";

import { operatorAddGenerator } from "../blocks/operators/operator_add_block";
import { operatorSubtractGenerator } from "../blocks/operators/operator_subtract_block";
import { operatorMultiplyGenerator } from "../blocks/operators/operator_multiply_block";
import { operatorDivideGenerator } from "../blocks/operators/operator_divide_block";
import { operatorLtGenerator } from "../blocks/operators/operator_lt_block";
import { operatorEqualsGenerator } from "../blocks/operators/operator_equals_block";
import { operatorGtGenerator } from "../blocks/operators/operator_gt_block";

/**
 * Custom hook to register all Blockly block generators
 */
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

    // Logic blocks
    javascriptGenerator.forBlock["logic_not"] = logicNotGenerator;
    javascriptGenerator.forBlock["logic_compare_equality"] =
      logicCompareEqualityGenerator;
    javascriptGenerator.forBlock["logic_compare_greater_than"] =
      logicCompareGreaterThanGenerator;
    javascriptGenerator.forBlock["controls_if"] = controlsIfGenerator;

    // Loop blocks
    javascriptGenerator.forBlock["controls_repeat_until"] =
      controlsRepeatUntilGenerator;
    javascriptGenerator.forBlock["controls_forever"] = controlsForeverGenerator;
    javascriptGenerator.forBlock["controls_repeat_every_interval"] =
      controlsRepeatEveryIntervalGenerator;

    // Math blocks
    javascriptGenerator.forBlock["math_round"] = mathRoundGenerator;
    javascriptGenerator.forBlock["math_number"] = mathNumberGenerator;

    // Dynamic data blocks
    javascriptGenerator.forBlock["get_current_time"] = getCurrentTimeGenerator;
    javascriptGenerator.forBlock["job_target_time"] = jobTargetTimeGenerator;
    javascriptGenerator.forBlock["get_price"] = getPriceGenerator;

    // Operator blocks
    javascriptGenerator.forBlock["operator_add"] = operatorAddGenerator;
    javascriptGenerator.forBlock["operator_subtract"] =
      operatorSubtractGenerator;
    javascriptGenerator.forBlock["operator_multiply"] =
      operatorMultiplyGenerator;
    javascriptGenerator.forBlock["operator_divide"] = operatorDivideGenerator;
    javascriptGenerator.forBlock["operator_lt"] = operatorLtGenerator;
    javascriptGenerator.forBlock["operator_equals"] = operatorEqualsGenerator;
    javascriptGenerator.forBlock["operator_gt"] = operatorGtGenerator;
  }, []);
}
