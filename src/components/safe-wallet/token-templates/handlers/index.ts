/* eslint-disable @typescript-eslint/no-explicit-any */
import { createBalanceMaintainerJob } from "./createBalanceMaintainerJob";

type HandlerResult = Promise<{ success: boolean; error?: string }>;

export function hasTemplateHandler(templateId: string): boolean {
  return templateId in handlerMap;
}

export async function runTemplateHandler(
  templateId: string,
  ctx: {
    createJob: (input: any) => Promise<{ success: boolean; error?: string }>;
    tokenSymbol?: string;
    chainId: number | string;
    safeAddress: string;
    autotopupTG: boolean;
    fetchTGBalance: () => Promise<void>;
    userBalance: number | string | null | undefined;
  },
): HandlerResult {
  const handler = handlerMap[templateId];
  if (!handler) {
    return Promise.resolve({ success: false, error: "No handler found" });
  }
  return handler(ctx);
}

const handlerMap: Record<string, (ctx: any) => HandlerResult> = {
  "balance-maintainer": createBalanceMaintainerJob,
};
