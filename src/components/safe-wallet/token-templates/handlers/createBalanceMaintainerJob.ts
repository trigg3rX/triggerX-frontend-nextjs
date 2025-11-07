import { JobType, ArgType } from "@/types/sdk-job";
import type { TimeBasedJobInput } from "@/types/sdk-job";

type CreateJobFn = (
  input: TimeBasedJobInput & {
    jobType: JobType.Time;
    argType: ArgType.Dynamic;
  },
) => Promise<{ success: boolean; error?: string }>;

export async function createBalanceMaintainerJob(params: {
  createJob: CreateJobFn;
  tokenSymbol?: string;
  chainId: number | string;
  safeAddress: string;
  autotopupTG: boolean;
  fetchTGBalance: () => Promise<void>;
  userBalance: number | string | null | undefined;
}) {
  const {
    createJob,
    tokenSymbol,
    chainId,
    safeAddress,
    autotopupTG,
    fetchTGBalance,
    userBalance,
  } = params;

  if (!safeAddress) {
    return { success: false, error: "Safe wallet address is required" };
  }

  if (!autotopupTG) {
    await fetchTGBalance();
    const tg = Number(userBalance || 0);
    if (!Number.isFinite(tg) || tg <= 0) {
      return { success: false, error: "Error: Insufficient TG balance." };
    }
  }

  const balanceMaintainerContractAddress =
    process.env.NEXT_PUBLIC_BALANCE_MAINTAINER_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000";

  const jobInput: TimeBasedJobInput & {
    jobType: JobType.Time;
    argType: ArgType.Dynamic;
  } = {
    jobType: JobType.Time,
    argType: ArgType.Dynamic,
    jobTitle: `Balance Maintainer Job - ${tokenSymbol || "Token"}`,
    timeFrame: 60,
    scheduleType: "interval",
    timeInterval: 40,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    chainId: typeof chainId === "number" ? String(chainId) : chainId,
    targetContractAddress: balanceMaintainerContractAddress,
    targetFunction: "maintainBalances()",
    abi: JSON.stringify([
      {
        inputs: [],
        name: "maintainBalances",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ]),
    dynamicArgumentsScriptUrl:
      "https://teal-random-koala-993.mypinata.cloud/ipfs/bafkreiamtrzx3w2wa6s4vs4bbxbhbtwbzuoxoylijjrdy2ezglm6xrdcuu",
    walletMode: "safe",
    safeAddress,
    isImua: false,
    autotopupTG,
  };

  return await createJob(jobInput);
}
