import type { TokenBalance } from "@/utils/fetchTokenBalances";
import { BalanceMaintainerTokenTemplate } from "@/components/safe-wallet/token-templates/balanceMaintainer";

export interface TemplateRenderContext {
  token?: TokenBalance | null;
}

export const renderTemplateExample = (templateId: string) => {
  switch (templateId) {
    case "balance-maintainer":
      return <BalanceMaintainerTokenTemplate />;
    default:
      return null;
  }
};
