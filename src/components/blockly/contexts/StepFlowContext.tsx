"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import { StepId, StepState } from "../components/StepFlowPanel";
import { WorkspaceStepSnapshot } from "../components/BlocklyWorkspaceSection";

interface StepCompletionState {
  jobTitleComplete: boolean;
  chainComplete: boolean;
  jobTypeComplete: boolean;
  triggerComplete: boolean;
  executionComplete: boolean;
  functionValueComplete: boolean;
  walletComplete: boolean;
  usesSafeExecution: boolean;
}

interface StepFlowContextValue {
  // State
  steps: StepState[];
  activeStep: StepState | undefined;
  activeHint: string | null;

  // Actions
  handleStepClick: (stepId: StepId) => void;
  handleHintClick: (stepId: StepId) => void;

  // Update methods
  updateJobTitle: (jobTitle: string) => void;
  updateWorkspaceSteps: (snapshot: WorkspaceStepSnapshot) => void;
}

const StepFlowContext = createContext<StepFlowContextValue | undefined>(
  undefined,
);

interface StepFlowProviderProps {
  children: ReactNode;
  jobTitleInputRef: React.RefObject<HTMLInputElement | null>;
  onFocusToolboxCategory?: (dataId: string | null) => void;
  onScrollToSelector?: (selector: string) => void;
}

function composeStepStates(state: StepCompletionState): StepState[] {
  // 1. Define the raw requirements for each step in order
  const rawDefinitions = [
    {
      id: "jobTitle" as StepId,
      label: "Job Title",
      description: "Name your automation job.",
      isRequired: true,
      check: state.jobTitleComplete,
    },
    {
      id: "chain" as StepId,
      label: "Chain",
      description: "Choose the network where it runs.",
      isRequired: true,
      check: state.chainComplete,
    },
    {
      id: "jobType" as StepId,
      label: "Job Type",
      description: "Time, event, or condition trigger.",
      isRequired: true,
      check: state.jobTypeComplete,
    },
    {
      id: "trigger" as StepId,
      label: "Trigger / Schedule",
      description: "Define when this job executes.",
      isRequired: true,
      check: state.triggerComplete,
    },
    {
      id: "execution" as StepId,
      label: "Execution",
      description: state.usesSafeExecution
        ? "Runs via Safe wallet."
        : "Runs a contract function.",
      isRequired: true,
      check: state.executionComplete,
    },
    {
      id: "functionValue" as StepId,
      label: "Function Value",
      description: state.usesSafeExecution
        ? "Add Safe transactions."
        : "Attach static or dynamic arguments.",
      isRequired: true,
      check: state.functionValueComplete,
    },
  ];

  // 2. Process the steps linearly
  const finalSteps: StepState[] = [];
  let allPreviousStepsComplete = true;

  for (const def of rawDefinitions) {
    // A step is truly complete only if all previous steps were complete AND this one is met
    const isActuallyComplete: boolean = allPreviousStepsComplete && def.check;

    finalSteps.push({
      id: def.id as StepId,
      label: def.label,
      description: def.description,
      optional: !def.isRequired as boolean,
      complete: isActuallyComplete as boolean,
    });

    allPreviousStepsComplete = isActuallyComplete;
  }

  // 3. Handle the "Ready" step (calculated based on the chain above)
  // The "ready" step should be complete if all required steps are complete
  const allRequiredStepsComplete = finalSteps.every((step) => step.complete);

  finalSteps.push({
    id: "ready",
    label: "Ready to Create",
    description: allRequiredStepsComplete
      ? "All required steps are complete."
      : "Finish the required steps to continue.",
    complete: allRequiredStepsComplete,
  });

  return finalSteps;
}

function getStepHint(
  stepId: StepId,
  snapshot: WorkspaceStepSnapshot,
): string | null {
  switch (stepId) {
    case "jobTitle":
      return "Name your automation job so you can find it later.";
    case "chain":
      return "Connect the wallet block to the Chain block to lock in a network.";
    case "jobType":
      return "Pick Time, Event, or Condition from the Job Type category.";
    case "trigger": {
      if (snapshot.jobWrapperKind === "event") {
        return "Add an Event Listener block from the Event category.";
      }
      if (snapshot.jobWrapperKind === "condition") {
        return "Drop a Condition Monitor block from the Condition category.";
      }
      return "Add a scheduling block from the Time category.";
    }
    case "execution":
      return snapshot.usesSafeExecution
        ? "Use Execute through Safe Wallet from the Execute category."
        : "Add an Execute Function block from the Execute category.";
    case "functionValue":
      return snapshot.usesSafeExecution
        ? "Add Safe Transactions under Function Value."
        : "Attach Static or Dynamic Arguments from Function Value.";
    case "wallet":
      return snapshot.usesSafeExecution
        ? "Select which Safe wallet should execute the job."
        : null;
    case "ready":
      return "Review the blocks, then click Create Job.";
    default:
      return null;
  }
}

export function StepFlowProvider({
  children,
  jobTitleInputRef,
  onFocusToolboxCategory,
  onScrollToSelector,
}: StepFlowProviderProps) {
  const [jobTitle, setJobTitle] = React.useState<string>("");
  const [workspaceSteps, setWorkspaceSteps] =
    React.useState<WorkspaceStepSnapshot>({
      chainComplete: false,
      jobTypeComplete: false,
      triggerComplete: false,
      executionComplete: false,
      functionValueComplete: false,
      walletComplete: false,
      usesSafeExecution: false,
      jobWrapperKind: null,
    });

  const updateJobTitle = useCallback((newJobTitle: string) => {
    setJobTitle(newJobTitle);
  }, []);

  const updateWorkspaceSteps = useCallback(
    (snapshot: WorkspaceStepSnapshot) => {
      setWorkspaceSteps(snapshot);
    },
    [],
  );

  const stepCompletionState = useMemo<StepCompletionState>(() => {
    const jobTitleComplete = jobTitle.trim().length > 0;
    return {
      jobTitleComplete,
      chainComplete: workspaceSteps.chainComplete,
      jobTypeComplete: workspaceSteps.jobTypeComplete,
      triggerComplete: workspaceSteps.triggerComplete,
      executionComplete: workspaceSteps.executionComplete,
      functionValueComplete: workspaceSteps.functionValueComplete,
      walletComplete: workspaceSteps.walletComplete,
      usesSafeExecution: workspaceSteps.usesSafeExecution,
    };
  }, [jobTitle, workspaceSteps]);

  const steps = useMemo(
    () => composeStepStates(stepCompletionState),
    [stepCompletionState],
  );

  const activeStep = useMemo(() => {
    if (steps.length === 0) return undefined;
    const requiredSteps = steps.filter((step) => !step.optional);
    return (
      requiredSteps.find((step) => !step.complete) ||
      steps.find((step) => !step.complete) ||
      steps[steps.length - 1]
    );
  }, [steps]);

  const activeHint = useMemo(() => {
    if (!activeStep) return null;
    return getStepHint(activeStep.id, workspaceSteps);
  }, [activeStep, workspaceSteps]);

  const triggerCategoryId = useMemo(() => {
    if (workspaceSteps.jobWrapperKind === "event") return "event-category";
    if (workspaceSteps.jobWrapperKind === "condition")
      return "condition-category";
    if (workspaceSteps.jobWrapperKind === "time") return "time-category";
    return "duration-category";
  }, [workspaceSteps.jobWrapperKind]);

  const handleStepClick = useCallback(
    (stepId: StepId) => {
      switch (stepId) {
        case "jobTitle":
          if (jobTitleInputRef.current) {
            jobTitleInputRef.current.click();
            setTimeout(() => {
              jobTitleInputRef.current?.focus();
            }, 0);
          }
          break;
        case "chain":
          onFocusToolboxCategory?.("chain-category");
          break;
        case "jobType":
          onFocusToolboxCategory?.("job-type-category");
          break;
        case "trigger":
          onFocusToolboxCategory?.(triggerCategoryId);
          break;
        case "execution":
          onFocusToolboxCategory?.("execute-category");
          break;
        case "functionValue":
          onFocusToolboxCategory?.("function-values-category");
          break;
        case "wallet": {
          // Wallet step removed - this case should not be reached
          // Only Safe wallet selection remains, which is handled in execution step
          const usesSafe = workspaceSteps.usesSafeExecution;
          if (usesSafe) {
            onFocusToolboxCategory?.("safe-wallet-category");
          }
          break;
        }
        case "ready":
          onScrollToSelector?.('[data-tour-id="create-job-button"]');
          break;
        default:
          break;
      }
    },
    [
      jobTitleInputRef,
      onFocusToolboxCategory,
      onScrollToSelector,
      triggerCategoryId,
      workspaceSteps.usesSafeExecution,
    ],
  );

  const handleHintClick = useCallback(
    (stepId: StepId) => {
      handleStepClick(stepId);
    },
    [handleStepClick],
  );

  const value = useMemo<StepFlowContextValue>(
    () => ({
      steps,
      activeStep,
      activeHint,
      handleStepClick,
      handleHintClick,
      updateJobTitle,
      updateWorkspaceSteps,
    }),
    [
      steps,
      activeStep,
      activeHint,
      handleStepClick,
      handleHintClick,
      updateJobTitle,
      updateWorkspaceSteps,
    ],
  );

  return (
    <StepFlowContext.Provider value={value}>
      {children}
    </StepFlowContext.Provider>
  );
}

export function useStepFlow() {
  const context = useContext(StepFlowContext);
  if (context === undefined) {
    throw new Error("useStepFlow must be used within a StepFlowProvider");
  }
  return context;
}
