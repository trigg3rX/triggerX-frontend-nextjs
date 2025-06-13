import React, { ElementType } from "react";
import { twMerge } from "tailwind-merge";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "button"
  | "badge"
  | "subtitle"
  | "caption";

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
    | "inherit";
  bgColor?: string;
  align?: "left" | "center" | "right" | "justify";
  noWrap?: boolean;
};

const variantStyles: Record<TypographyVariant, string> = {
  h1: "font-sharp text-3xl sm:text-4xl lg:text-7xl",
  h2: "font-actay-wide text-sm sm:text-lg md:text-xl",
  h3: "text-sm sm:text-base text-nowrap",
  h4: "text-xs md:text-base",
  body: "text-[10px] xs:text-xs sm:text-sm",
  button: "text-[10px] xs:text-xs lg:text-sm xl:text-base",
  badge:
    "text-xs md:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full tracking-wider",
  subtitle: "text-sm sm:text-base font-medium",
  caption: "text-xs text-gray-400",
};

const colorStyles: Record<string, string> = {
  primary: "text-white",
  secondary: "text-gray-300",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  success: "text-green-600",
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
  badge: "span",
  subtitle: "h5",
  caption: "span",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  children,
  className = "",
  as,
  color = "primary",
  bgColor,
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
  const bgStyle = variant === "badge" && bgColor ? bgColor : "";

  const combinedClassName = twMerge(
    baseStyles,
    colorStyle,
    alignStyle,
    noWrapStyle,
    bgStyle,
    className,
  );

  return <Component className={combinedClassName}>{children}</Component>;
};
