import { createBalanceMaintainerJob } from "@/components/safe-wallet/token-templates/handlers/createBalanceMaintainerJob";
import type { CreateJobInput } from "sdk-triggerx";

type HandlerResult = Promise<{ success: boolean; error?: string }>;

export interface TemplateHandlerContext {
  createJob: (
    input: CreateJobInput,
  ) => Promise<{ success: boolean; error?: string }>;
  tokenSymbol?: string;
  chainId: number | string;
  safeAddress: string; // Required - always use safe wallet in safe-wallet directory
  autotopupETH: boolean;
  fetchBalance: () => Promise<void>;
  userBalance: number | string | null | undefined;
  templateParams?: Record<string, string | undefined>;
}

export function hasTemplateHandler(templateId: string): boolean {
  return templateId in handlerMap;
}

export async function runTemplateHandler(
  templateId: string,
  ctx: TemplateHandlerContext,
): HandlerResult {
  const handler = handlerMap[templateId];
  if (!handler) {
    return Promise.resolve({ success: false, error: "No handler found" });
  }
  return handler(ctx);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlerMap: Record<string, (ctx: any) => HandlerResult> = {
  "balance-maintainer": createBalanceMaintainerJob,
};
