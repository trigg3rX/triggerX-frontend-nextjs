import * as Blockly from "blockly/core";

export interface BlockSuggestion {
  blockType: string;
  category: string;
  priority: number;
  reason: string;
  description: string;
}

export interface WorkspaceAnalysis {
  hasChain: boolean;
  hasWallet: boolean;
  hasJobType: boolean;
  jobType?: string;
  hasDuration: boolean;
  hasAction: boolean;
  hasExecuteFunction: boolean;
  hasExecuteThroughSafe: boolean;
  hasSafeWallet: boolean;
  hasArguments: boolean;
  hasTimeConfig: boolean;
  hasEventConfig: boolean;
  hasConditionConfig: boolean;
  hasRecurring: boolean;
}

/**
 * Analyzes the current workspace state and returns suggestions for next blocks
 */
export function analyzeWorkspaceAndSuggest(
  workspace: Blockly.Workspace,
): BlockSuggestion[] {
  const analysis = analyzeWorkspace(workspace);
  const suggestions: BlockSuggestion[] = [];

  // Priority 1: Required blocks
  if (!analysis.hasChain) {
    suggestions.push({
      blockType: "chain_selection",
      category: "Chain",
      priority: 1,
      reason: "required",
      description:
        "Start by adding a Chain block to specify the target blockchain",
    });
  }

  if (analysis.hasChain && !analysis.hasWallet) {
    suggestions.push({
      blockType: "wallet_selection",
      category: "Wallet",
      priority: 1,
      reason: "required",
      description: "Add a Wallet block to specify the wallet address",
    });
  }

  if (analysis.hasChain && analysis.hasWallet && !analysis.hasJobType) {
    suggestions.push({
      blockType: "time_based_job_wrapper",
      category: "Job Type",
      priority: 1,
      reason: "required",
      description:
        "Choose a job type: Time-based, Event-based, or Condition-based",
    });
  }

  // Priority 2: Job type specific requirements
  if (analysis.hasJobType) {
    if (!analysis.hasDuration) {
      suggestions.push({
        blockType: "timeframe_job",
        category: "Duration",
        priority: 2,
        reason: "required_for_job",
        description: "Add a Duration block to specify when the job should end",
      });
    }

    // Time-based job suggestions
    if (
      analysis.jobType === "time_based_job_wrapper" &&
      !analysis.hasTimeConfig
    ) {
      suggestions.push({
        blockType: "specific_datetime",
        category: "Time",
        priority: 2,
        reason: "required_for_time_job",
        description:
          "Add a time configuration block (Specific DateTime, Cron, or Interval)",
      });
    }

    // Event-based job suggestions
    if (
      analysis.jobType === "event_based_job_wrapper" &&
      !analysis.hasEventConfig
    ) {
      suggestions.push({
        blockType: "event_listener",
        category: "Event",
        priority: 2,
        reason: "required_for_event_job",
        description: "Add an Event Listener block to monitor on-chain events",
      });
    }

    // Condition-based job suggestions
    if (
      analysis.jobType === "condition_based_job_wrapper" &&
      !analysis.hasConditionConfig
    ) {
      suggestions.push({
        blockType: "condition_monitor",
        category: "Condition",
        priority: 2,
        reason: "required_for_condition_job",
        description:
          "Add a Condition Monitor block to check off-chain conditions",
      });
    }
  }

  // Priority 3: Action blocks
  if (
    analysis.hasJobType &&
    analysis.hasDuration &&
    !analysis.hasAction &&
    !analysis.hasExecuteFunction &&
    !analysis.hasExecuteThroughSafe
  ) {
    suggestions.push({
      blockType: "execute_function",
      category: "Contract",
      priority: 3,
      reason: "required_for_action",
      description:
        "Add an Execute Function block to define what the job should do",
    });
  }

  // Priority 4: Execute function requirements
  if (analysis.hasExecuteFunction && !analysis.hasArguments) {
    suggestions.push({
      blockType: "static_arguments",
      category: "Contract",
      priority: 4,
      reason: "required_for_execute",
      description:
        "Add a Static Arguments or Dynamic Arguments block to configure function parameters",
    });
  }

  // Priority 5: Safe wallet requirements
  if (analysis.hasExecuteThroughSafe && !analysis.hasSafeWallet) {
    suggestions.push({
      blockType: "select_safe_wallet",
      category: "Safe Wallet",
      priority: 5,
      reason: "required_for_safe_execute",
      description:
        "Add a Safe Wallet block (Select, Create, or Import) to use with Safe execution",
    });
  }

  // Priority 6: Optional enhancements
  if (
    analysis.hasJobType &&
    analysis.hasDuration &&
    analysis.hasAction &&
    !analysis.hasRecurring
  ) {
    suggestions.push({
      blockType: "recurring_job",
      category: "Recurring",
      priority: 6,
      reason: "optional_enhancement",
      description:
        "Optionally add a Recurring block to make the job repeat automatically",
    });
  }

  // Sort by priority
  return suggestions.sort((a, b) => a.priority - b.priority);
}

/**
 * Analyzes the current workspace to determine what blocks are present
 */
export function analyzeWorkspace(
  workspace: Blockly.Workspace,
): WorkspaceAnalysis {
  const allBlocks = workspace.getAllBlocks(false);
  const blockTypes = new Set(allBlocks.map((b) => b.type));

  const hasChain = blockTypes.has("chain_selection");
  const hasWallet = blockTypes.has("wallet_selection");
  const hasTimeBased = blockTypes.has("time_based_job_wrapper");
  const hasEventBased = blockTypes.has("event_based_job_wrapper");
  const hasConditionBased = blockTypes.has("condition_based_job_wrapper");
  const hasJobType = hasTimeBased || hasEventBased || hasConditionBased;
  const jobType = hasTimeBased
    ? "time_based_job_wrapper"
    : hasEventBased
      ? "event_based_job_wrapper"
      : hasConditionBased
        ? "condition_based_job_wrapper"
        : undefined;

  // Check for duration block
  const hasDuration = blockTypes.has("timeframe_job");

  // Check for action blocks
  const hasExecuteFunction = blockTypes.has("execute_function");
  const hasExecuteThroughSafe = blockTypes.has("execute_through_safe_wallet");
  const hasAction = hasExecuteFunction || hasExecuteThroughSafe;

  // Check for arguments
  const hasArguments =
    blockTypes.has("static_arguments") || blockTypes.has("dynamic_arguments");

  // Check for time configuration
  const hasTimeConfig =
    blockTypes.has("specific_datetime") ||
    blockTypes.has("cron_expression") ||
    blockTypes.has("time_interval_at_job");

  // Check for event configuration
  const hasEventConfig =
    blockTypes.has("event_listener") || blockTypes.has("event_filter");

  // Check for condition configuration
  const hasConditionConfig = blockTypes.has("condition_monitor");

  // Check for safe wallet
  const hasSafeWallet =
    blockTypes.has("create_safe_wallet") ||
    blockTypes.has("import_safe_wallet") ||
    blockTypes.has("select_safe_wallet");

  // Check for recurring
  const hasRecurring = blockTypes.has("recurring_job");

  return {
    hasChain,
    hasWallet,
    hasJobType,
    jobType,
    hasDuration,
    hasAction,
    hasExecuteFunction,
    hasExecuteThroughSafe,
    hasSafeWallet,
    hasArguments,
    hasTimeConfig,
    hasEventConfig,
    hasConditionConfig,
    hasRecurring,
  };
}

/**
 * Gets the category name for a block type
 */
export function getCategoryForBlockType(blockType: string): string {
  const categoryMap: Record<string, string> = {
    chain_selection: "Chain",
    wallet_selection: "Wallet",
    time_based_job_wrapper: "Job Type",
    event_based_job_wrapper: "Job Type",
    condition_based_job_wrapper: "Job Type",
    timeframe_job: "Duration",
    recurring_job: "Recurring",
    specific_datetime: "Time",
    cron_expression: "Time",
    time_interval_at_job: "Time",
    event_listener: "Event",
    event_filter: "Event",
    condition_monitor: "Condition",
    execute_function: "Contract",
    execute_through_safe_wallet: "Contract",
    static_arguments: "Contract",
    dynamic_arguments: "Contract",
    safe_transaction: "Contract",
    create_safe_wallet: "Safe Wallet",
    import_safe_wallet: "Safe Wallet",
    select_safe_wallet: "Safe Wallet",
  };

  return categoryMap[blockType] || "Unknown";
}
