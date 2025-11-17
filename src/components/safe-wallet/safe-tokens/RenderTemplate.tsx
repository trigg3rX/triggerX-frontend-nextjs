import type { TokenBalance } from "@/utils/fetchTokenBalances";
import {
  BalanceMaintainerTokenTemplate,
  BalanceMaintainerParams,
} from "@/components/safe-wallet/token-templates/ui-templates/BalanceMaintainerTemplate";
import {
  TemplateParams,
  ValidationErrors,
} from "@/components/safe-wallet/parameterValidation";

export interface TemplateRenderContext {
  token?: TokenBalance | null;
  params?: TemplateParams;
  onParamsChange?: (params: TemplateParams) => void;
  errors?: ValidationErrors;
}

export const renderTemplateExample = (
  templateId: string,
  context?: TemplateRenderContext,
) => {
  switch (templateId) {
    case "balance-maintainer":
      return (
        <BalanceMaintainerTokenTemplate
          params={context?.params as BalanceMaintainerParams}
          onParamsChange={
            context?.onParamsChange as
              | ((params: BalanceMaintainerParams) => void)
              | undefined
          }
          errors={context?.errors}
        />
      );
    default:
      return null;
  }
};
