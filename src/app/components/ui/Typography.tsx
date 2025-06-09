import React, { ElementType } from "react";
import { twMerge } from "tailwind-merge";

type TypographyVariant = "h1" | "h2" | "h3" | "h4" | "body" | "button";

type TypographyProps = {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success"
    | "blue"
    | "gray"
    | "inherit";

  align?: "left" | "center" | "right" | "justify";
  noWrap?: boolean;
};

const variantStyles: Record<TypographyVariant, string> = {
  h1: "font-sharp text-3xl sm:text-4xl lg:text-7xl mx-auto w-max",
  h2: "text-[16px] md:text-[20px] font-actay-wide mx-auto w-max",
  h3: "text-2xl md:text-3xl font-semibold mx-auto w-max",
  h4: "text-[14px] md:text-[16px] font-semibold mx-auto w-max",
  body: "text-[13px] md:text-[14px] mx-auto w-max",
  button: "text-sm font-medium uppercase tracking-wide mx-auto w-max",
};

const colorStyles: Record<string, string> = {
  primary: "text-[#EDEDED]",
  secondary: "text-gray-600 ",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  success: "text-green-600",
  blue: "text-[#C07AF6]",
  gray: "text-[#A2A2A2]",
};

const alignStyles: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const defaultElements: Record<TypographyVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  button: "span",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  children,
  className = "",
  as,
  color = "primary",
  align = "center",
  noWrap = false,
}) => {
  const Component = (as || defaultElements[variant]) as ElementType;

  const baseStyles = variantStyles[variant];
  const colorStyle = colorStyles[color];
  const alignStyle = alignStyles[align];
  const noWrapStyle = noWrap
    ? "whitespace-nowrap overflow-hidden text-ellipsis"
    : "";

  const combinedClassName = twMerge(
    baseStyles,
    colorStyle,
    alignStyle,
    noWrapStyle,
    className,
  );

  return <Component className={combinedClassName}>{children}</Component>;
};
