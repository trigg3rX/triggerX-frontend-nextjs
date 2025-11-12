import {
  templateFields,
  ParamFieldWithRules,
} from "./token-templates/validations/templateFields";
import type { ParamField } from "@/components/safe-wallet/TokenJobParamsForm";
import { ethers } from "ethers";

export type TemplateParams = Record<string, string | undefined>;

export interface ValidationErrors {
  [key: string]: string | undefined;
}

const ADDRESS_REGEX = {
  test: (address: string) => ethers.isAddress(address),
};

function validateByRule(
  value: string | undefined,
  field: ParamFieldWithRules,
): string | undefined {
  const { rules, label, name, type } = field;
  if (!rules) return undefined;

  const fieldLabel = label || name;

  // required
  if (rules.required && (!value || value.trim() === "")) {
    return `${fieldLabel} is required`;
  }
  if (!value || value.trim() === "") return undefined; // don't run further rules if empty and not required

  // explicit type checks
  if (rules.type === "address") {
    if (!ADDRESS_REGEX.test(value.trim())) {
      return `Invalid ${fieldLabel} format`;
    }
  }
  if (rules.type === "number" || rules.type === "numberPositive") {
    const num = Number(value);
    if (Number.isNaN(num)) return `${fieldLabel} must be a number`;
    if (rules.type === "numberPositive" && num <= 0) {
      return `${fieldLabel} must be a positive number`;
    }
    if (typeof rules.min === "number" && num < rules.min) {
      return `${fieldLabel} must be ≥ ${rules.min}`;
    }
    if (typeof rules.max === "number" && num > rules.max) {
      return `${fieldLabel} must be ≤ ${rules.max}`;
    }
  }

  // pattern
  if (rules.pattern && !rules.pattern.test(value)) {
    return `${fieldLabel} is invalid`;
  }

  // custom validator
  if (rules.custom) {
    const res = rules.custom(value);
    if (res) return res;
  }

  // boolean as string "true"/"false"
  if (
    (rules.type === "boolean" || type === "boolean") &&
    !/^(true|false)$/i.test(value)
  ) {
    return `${fieldLabel} must be true or false`;
  }

  return undefined;
}

export function validateWithFields(
  fields: (ParamField | ParamFieldWithRules)[],
  params: TemplateParams,
): ValidationErrors {
  const errors: ValidationErrors = {};
  for (const field of fields as ParamFieldWithRules[]) {
    errors[field.name] = validateByRule(params[field.name], field);
  }
  return errors;
}

export function validateTemplateParams(
  templateId: string,
  params: TemplateParams,
): ValidationErrors {
  const templateFieldGroups = templateFields[templateId];
  if (!templateFieldGroups) return {};

  // Flatten all fields from all parameter sections
  const allFields: ParamFieldWithRules[] = [];
  for (const sectionKey in templateFieldGroups) {
    const sectionFields = templateFieldGroups[sectionKey];
    if (Array.isArray(sectionFields)) {
      allFields.push(...sectionFields);
    }
  }

  return validateWithFields(allFields, params);
}

export function isValidTemplateParams(
  templateId: string,
  params: TemplateParams,
): boolean {
  const errors = validateTemplateParams(templateId, params);
  return !Object.values(errors).some(Boolean);
}
