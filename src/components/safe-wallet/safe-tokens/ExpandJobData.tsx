import { Typography } from "@/components/ui/Typography";
import { ChevronDown, ChevronUp } from "lucide-react";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";
import { renderTemplateExample } from "@/components/safe-wallet/safe-tokens/RenderTemplate";
import { TokenBalance } from "@/utils/fetchTokenBalances";
import { Template } from "@/types/job";
import {
  TemplateParams,
  ValidationErrors,
} from "@/components/safe-wallet/parameterValidation";

interface ExpandableTemplateSectionProps {
  template: Template;
  isExpanded: boolean;
  onToggle: () => void;
  token: TokenBalance | null;
  autotopupTG: boolean;
  onToggleAutotopup: () => void;
  params?: TemplateParams;
  onParamsChange?: (params: TemplateParams) => void;
  errors?: ValidationErrors;
}

const ExpandableTemplateSection: React.FC<ExpandableTemplateSectionProps> = ({
  template,
  isExpanded,
  onToggle,
  token,
  autotopupTG,
  onToggleAutotopup,
  params,
  onParamsChange,
  errors,
}) => {
  return (
    <div className="bg-background rounded-lg border border-white/10 hover:border-white/20 transition-colors">
      {/* Collapsed Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4"
      >
        <Typography
          variant="caption"
          color="white"
          className="font-bold text-base"
          align="left"
        >
          {template.tokenTemplateTitle}
        </Typography>

        {/* Expand/Collapse Icon */}
        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="pr-4 pl-4 pb-4">
          <div
            className={`max-h-56 overflow-y-auto ${scrollbarStyles.whiteScrollbar}`}
          >
            {renderTemplateExample(template.id, {
              token,
              params,
              onParamsChange,
              errors,
            })}
          </div>
          <div className="mt-4">
            <label className="flex items-start gap-2 p-2 rounded-md cursor-pointer">
              {/* Not used default checkbox */}
              <input
                type="checkbox"
                className="mt-0.5"
                checked={autotopupTG}
                onChange={onToggleAutotopup}
              />
              <Typography
                variant="body"
                color="white"
                align="left"
                className="!m-0"
              >
                Auto-topup TG if balance is insufficient
              </Typography>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpandableTemplateSection;
