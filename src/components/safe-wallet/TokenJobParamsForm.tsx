"use client";

import React from "react";
import { InputField } from "@/components/ui/InputField";
import { Typography } from "@/components/ui/Typography";

export type ParamFieldType = "text" | "number" | "boolean";

export interface ParamField {
  name: string;
  label: string;
  type?: ParamFieldType;
  placeholder?: string;
}

export interface ParamsFormProps<
  TValues extends Record<string, string | undefined>,
> {
  fields: ParamField[];
  values: TValues;
  onChange: (values: TValues) => void;
  errors?: Partial<Record<keyof TValues, string>> | Record<string, string>;
  disabled?: boolean;
}

export function TokenJobParamsForm<
  TValues extends Record<string, string | undefined>,
>({
  fields,
  values,
  onChange,
  errors,
  disabled = false,
}: ParamsFormProps<TValues>) {
  const handleChange = (name: string, value: string) => {
    if (disabled) return;
    onChange({
      ...(values as Record<string, string | undefined>),
      [name]: value,
    } as TValues);
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const inputType = field.type === "number" ? "number" : "text";
        return (
          <div key={field.name} className="flex flex-col gap-1">
            <label className="block">
              <Typography variant="body" color="secondary" align="left">
                {field.label}
              </Typography>
            </label>
            {field.type === "boolean" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(values[field.name] ?? "") === "true"}
                  onChange={(e) =>
                    handleChange(
                      field.name,
                      e.target.checked ? "true" : "false",
                    )
                  }
                  disabled={disabled}
                  className="w-4 h-4"
                />
                {errors && (errors as Record<string, string>)[field.name] && (
                  <span className="text-red-500 text-xs">
                    {(errors as Record<string, string>)[field.name]}
                  </span>
                )}
              </div>
            ) : (
              <InputField
                value={values[field.name] ?? ""}
                onChange={(value) => handleChange(field.name, value)}
                placeholder={field.placeholder}
                type={inputType}
                error={
                  errors
                    ? (errors as Record<string, string>)[field.name] ||
                      undefined
                    : undefined
                }
                readOnly={disabled}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
