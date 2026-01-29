import { CreateJobInput, JobType, ArgType } from "sdk-triggerx";
import type { TemplateHandlerContext } from "./index";
import SafeModuleAbi from "@/artifacts/TriggerXSafeModule.json";
import { buildBalanceMaintainerScript } from "@/components/safe-wallet/token-templates/dynamic-scripts/balanceMaintainer";
import { uploadTextToPinata } from "@/utils/uploadToPinata";
import { getPublicRpcUrl, getContractAddress } from "@/utils/contractAddresses";

const DEFAULT_TIME_FRAME = 2629746;
const DEFAULT_TIME_INTERVAL = 3600;

const parsePositiveInt = (
  value: string | undefined,
  fallback: number,
): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export async function createBalanceMaintainerJob({
  createJob,
  chainId,
  safeAddress,
  autotopupETH,
  fetchBalance,
  userBalance,
  templateParams,
}: TemplateHandlerContext) {
  if (!safeAddress) {
    return { success: false, error: "Safe wallet address is required" };
  }

  if (!autotopupETH) {
    await fetchBalance();
    const eth = Number(userBalance || 0);
    if (!Number.isFinite(eth) || eth <= 0) {
      return { success: false, error: "Error: Insufficient ETH balance." };
    }
  }

  // Read template params - user inputs
  if (!templateParams) {
    return { success: false, error: "Template parameters are required." };
  }

  const { contractAddress, minimumBalance, timeFrame, timeInterval } =
    templateParams;

  if (!contractAddress) {
    return { success: false, error: "Target contract address is required." };
  }
  if (!minimumBalance) {
    return { success: false, error: "Minimum balance is required." };
  }
  const actionTarget = contractAddress;
  const minimumBalanceEth = minimumBalance;

  // Parse timeFrame and timeInterval from template params (stored as strings)
  const timeFrameDays = parsePositiveInt(timeFrame, DEFAULT_TIME_FRAME);

  const timeIntervalSeconds = parsePositiveInt(
    timeInterval,
    DEFAULT_TIME_INTERVAL,
  );

  // Get RPC URL from chainId
  const chainIdNum = typeof chainId === "number" ? chainId : Number(chainId);
  const rpcUrl = getPublicRpcUrl(chainIdNum);
  if (!rpcUrl) {
    return {
      success: false,
      error: "RPC URL not configured for this network.",
    };
  }

  // Build Go script for dynamic args and upload to IPFS
  let ipfsUrl = "";
  try {
    const script = buildBalanceMaintainerScript({
      safeAddress,
      actionTarget,
      minimumBalanceEth,
      rpcUrl,
      actionData: "0x",
      operation: 0,
    });
    ipfsUrl = await uploadTextToPinata(script, "balanceMaintainer.go");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Failed to upload script: ${msg}` };
  }

  // Get Safe Module address from chain-specific config
  const safeModuleAddress = getContractAddress(
    chainIdNum,
    "SAFE_MODULE_ADDRESS",
  );
  if (!safeModuleAddress) {
    return {
      success: false,
      error: "Safe Module address not configured for this network.",
    };
  }

  // Fixed job title
  const jobTitle = `ETH Balance Maintainer for ${actionTarget}`;

  // Fixed parameters
  const scheduleType = "interval" as const;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const walletMode = "safe" as const;
  const language = "go";

  // Build job input with all required parameters
  const jobInput: CreateJobInput = {
    jobType: JobType.Time,
    argType: ArgType.Dynamic,
    jobTitle,
    timeFrame: timeFrameDays,
    scheduleType,
    timeInterval: timeIntervalSeconds,
    timezone,
    chainId: String(chainIdNum),
    targetContractAddress: safeModuleAddress,
    targetFunction:
      "execJobFromHub(address,address,uint256,bytes,uint8,address)",
    abi: JSON.stringify(SafeModuleAbi),
    dynamicArgumentsScriptUrl: ipfsUrl,
    safeAddress: safeAddress,
    autotopupTG: Boolean(autotopupETH),
    walletMode,
    language,
  };

  return await createJob(jobInput);
}
