"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChainId } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/common/Dailog";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { TokenBalance } from "@/utils/fetchTokenBalances";
import templatesData from "@/data/templates.json";
import { Template } from "@/types/job";
import { useCreateJob } from "@/hooks/useCreateJob";
import toast from "react-hot-toast";
import { useTGBalance } from "@/contexts/TGBalanceContext";
import { filterTemplatesForToken } from "@/utils/tokenTemplateMap";
import scrollbarStyles from "@/app/styles/scrollbar.module.css";
import EmptyState from "@/components/common/EmptyState";
import ExpandableTemplateSection from "@/components/safe-wallet/safe-tokens/ExpandJobData";
import {
  hasTemplateHandler,
  runTemplateHandler,
} from "@/components/safe-wallet/token-templates/handlers";
import {
  TemplateParams,
  ValidationErrors,
  validateTemplateParams,
  isValidTemplateParams,
} from "@/components/safe-wallet/parameterValidation";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenBalance | null;
  safeAddress: string | null;
}

const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  token,
  safeAddress,
}) => {
  const router = useRouter();
  const chainId = useChainId();
  const { createJob, isLoading, resetError } = useCreateJob();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const { fetchTGBalance, userBalance } = useTGBalance();
  const [autotopupTG, setAutotopupTG] = useState<boolean>(true);
  const [templateParams, setTemplateParams] = useState<
    Record<string, TemplateParams>
  >({});
  const [templateErrors, setTemplateErrors] = useState<
    Record<string, ValidationErrors>
  >({});

  const handleTemplateParamsChange = (
    templateId: string,
    params: TemplateParams,
  ) => {
    setTemplateParams((prev) => ({
      ...prev,
      [templateId]: params,
    }));
    // Validate params on change
    const errors = validateTemplateParams(templateId, params);
    setTemplateErrors((prev) => ({
      ...prev,
      [templateId]: errors,
    }));
  };

  const handleContinue = async () => {
    if (!selectedTemplate) return;

    // Validate safe address is available
    if (!safeAddress) {
      toast.error("Safe wallet address is required");
      return;
    }

    // Validate template parameters
    const params = templateParams[selectedTemplate.id];
    if (params && !isValidTemplateParams(selectedTemplate.id, params)) {
      toast.error("Please fill all required parameters");
      return;
    }

    // If we have a handler for the selected template, use it.
    if (hasTemplateHandler(selectedTemplate.id)) {
      setIsCreating(true);
      try {
        const result = await runTemplateHandler(selectedTemplate.id, {
          createJob,
          tokenSymbol: token?.symbol,
          chainId,
          safeAddress,
          autotopupTG,
          fetchTGBalance,
          userBalance,
          templateParams: templateParams[selectedTemplate.id],
        });

        if (result.success) {
          toast.success("Job created successfully!");
          onClose();
          setTimeout(() => {
            router.refresh();
          }, 1000);
        } else {
          const message = result.error || "Failed to create job";
          if (
            message.toLowerCase().includes("rejected") &&
            message.toLowerCase().includes("transaction") &&
            message.toLowerCase().includes("denied")
          ) {
            toast.error(`Transaction denied by user`);
          } else if (
            message.toLowerCase().includes("insufficient") &&
            message.toLowerCase().includes("tg")
          ) {
            toast.error(`Insufficient TG balance`);
          } else {
            toast.error(message);
          }
        }
      } catch (error) {
        console.error("Error handling template:", error);
        toast.error("Failed to create job");
      } finally {
        setIsCreating(false);
      }
      return;
    }

    // Fallback: route to generic create job page for templates without a handler
    router.push(`/`);
    onClose();
  };

  // Reset error and params when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      resetError();
    } else {
      // Reset params when modal closes
      setTemplateParams({});
      setTemplateErrors({});
      setSelectedTemplate(null);
      setExpandedTemplate(null);
    }
  }, [isOpen, resetError]);

  // Handle template select
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Auto-expand if not already expanded
    if (expandedTemplate !== template.id) {
      setExpandedTemplate(template.id);
    }
    // Initialize params if not already set
    if (!templateParams[template.id]) {
      setTemplateParams((prev) => ({
        ...prev,
        [template.id]: {},
      }));
    }
  };

  // Handle template toggle
  const handleTemplateToggle = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  // Filter templates for token
  const filteredTemplates = filterTemplatesForToken(
    token?.symbol,
    templatesData.templates,
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        {/* Header */}
        <DialogHeader>
          <DialogTitle>Create Job for {token?.symbol || "Token"}</DialogTitle>
        </DialogHeader>

        <hr className="border-[#C07AF6]" />

        {/* Template Selection */}
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <EmptyState type="template" />
          ) : (
            <>
              <Typography variant="h3" color="white" align="left">
                Select a Job Template
              </Typography>
              <div
                className={`space-y-4 ${filteredTemplates.length > 3 ? `max-h-[70vh] overflow-y-auto ${scrollbarStyles.whiteScrollbar}` : ""}`}
              >
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`cursor-pointer transition-all  ${
                      selectedTemplate?.id === template.id
                        ? "border border-white rounded-lg "
                        : ""
                    }`}
                  >
                    <ExpandableTemplateSection
                      template={template}
                      isExpanded={expandedTemplate === template.id}
                      onToggle={() => handleTemplateToggle(template.id)}
                      token={token}
                      autotopupTG={autotopupTG}
                      onToggleAutotopup={() => setAutotopupTG((v) => !v)}
                      params={templateParams[template.id]}
                      onParamsChange={(params) =>
                        handleTemplateParamsChange(template.id, params)
                      }
                      errors={templateErrors[template.id]}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {filteredTemplates.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              onClick={onClose}
              color="white"
              className="w-full"
              disabled={isCreating || isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleContinue}
              disabled={
                !selectedTemplate ||
                isCreating ||
                isLoading ||
                (selectedTemplate &&
                  templateParams[selectedTemplate.id] &&
                  !isValidTemplateParams(
                    selectedTemplate.id,
                    templateParams[selectedTemplate.id],
                  ))
              }
              color="purple"
              className="w-full"
            >
              {isCreating || isLoading ? "Creating..." : "Create Job"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobModal;
