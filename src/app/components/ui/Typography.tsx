import React, { ElementType } from "react";
import { twMerge } from "tailwind-merge";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "body"
  | "span"
  | "button"
  | "badgeYellow"
  | "badgeGreen"
  | "badgeWhite";

type TypographyProps = {
  variant?: TypographyVariant;
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  color?:
    | "primary"
    | "white"
    | "black"
    | "secondary"
    | "error"
    | "warning"
    | "info"
    | "success"
    | "blue"
    | "gray"
    | "yellow"
    | "inherit";
  align?: "left" | "center" | "right" | "justify";
  noWrap?: boolean;
  maxWidth?: "none" | "200" | "300" | "400" | "500" | "600" | "800" | "full";
  centered?: boolean;
};

const variantStyles: Record<TypographyVariant, string> = {
  h1: "font-sharp text-3xl sm:text-4xl lg:text-7xl ",
  h2: "text-[16px] md:text-[20px] font-actay-wide ",
  h3: "text-2xl md:text-3xl font-semibold ",
  h4: "text-[14px] md:text-[16px] font-semibold ",
  h5: "text-[10px] md:text-[20px] font-actay-wide ",
  body: "text-[13px] md:text-[14px] font-bold tracking-wider",
  span: "text-[13px] md:text-[15px] font-bold tracking-wider",
  button: "text-sm font-medium uppercase tracking-wide ",
  badgeYellow: "text-xs font-medium  py-3 px-4  rounded-full  bg-[#F8FF7C]",
  badgeWhite: "text-xs font-medium  py-3 px-4  rounded-full  bg-[#FFFFFF]",
  badgeGreen: "px-3 py-1 bg-green-500/20 rounded-full tracking-wider ",
};

const colorStyles: Record<string, string> = {
  primary: "text-[#EDEDED]",
  secondary: "text-[D9D9D9] ",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  success: "text-green-600",
  blue: "text-[#C07AF6]",
  gray: "text-[#A2A2A2]",
  white: "text-white",
  black: "text-black",
  yellow: "text-[#F8FF7C]",
};

const alignStyles: Record<string, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

const maxWidthStyles: Record<string, string> = {
  none: "",
  "200": "max-w-[200px]",
  "300": "max-w-[300px]",
  "400": "max-w-[400px]",
  "500": "max-w-[500px]",
  "600": "max-w-[600px]",
  "800": "max-w-[800px]",
  full: "max-w-full",
};

const defaultElements: Record<TypographyVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  body: "p",
  span: "span",
  button: "span",
  badgeYellow: "span",
  badgeWhite: "span",
  badgeGreen: "p",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  children,
  className = "",
  as,
  color = "primary",
  align = "center",
  maxWidth = "none",
  centered = false,
  noWrap = false,
}) => {
  const Component = (as || defaultElements[variant]) as ElementType;

  const baseStyles = variantStyles[variant];
  const colorStyle = colorStyles[color];
  const alignStyle = alignStyles[align];
  const maxWidthStyle = maxWidthStyles[maxWidth];
  const noWrapStyle = noWrap
    ? "whitespace-nowrap overflow-hidden text-ellipsis"
    : "";
  const centeredStyle = centered ? "mx-auto" : "";

  const combinedClassName = twMerge(
    baseStyles,
    colorStyle,
    alignStyle,
    maxWidthStyle,
    centeredStyle,
    noWrapStyle,
    className,
  );

  return <Component className={combinedClassName}>{children}</Component>;
};
