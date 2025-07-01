import React, { ElementType } from "react";
import { twMerge } from "tailwind-merge";

type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "body"
  | "button"
  | "badge"
  | "caption"
  | "span"
  | "badgeYellow"
  | "put"
  | "post"
  | "get"
  | "badgeWhite";

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
    | "white"
    | "black"
    | "blue"
    | "put"
    | "post"
    | "get"
    | "gray"
    | "yellow"
    | "inherit";
  bgColor?: string;
  align?: "left" | "center" | "right" | "justify";
  noWrap?: boolean;
  maxWidth?: "none" | "200" | "300" | "400" | "500" | "600" | "800" | "full";
  centered?: boolean;
};

const variantStyles: Record<TypographyVariant, string> = {
  h1: "font-sharp text-3xl sm:text-4xl lg:text-7xl",
  h2: "font-actay-wide text-sm sm:text-lg md:text-xl",
  h3: "text-sm sm:text-base text-nowrap",
  h4: "text-xs md:text-base",
  h5: "text-[10px] md:text-[20px] font-actay-wide ",
  body: "text-[10px] xs:text-xs sm:text-sm",
  span: "text-[13px] md:text-[15px] font-bold tracking-wider",
  button: "text-[10px] xs:text-xs lg:text-sm xl:text-base",
  badge:
    "text-xs md:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full tracking-wider",
  caption: "text-xs",
  badgeYellow: "text-xs font-medium  py-3 px-4  rounded-full  bg-[#F8FF7C]",
  badgeWhite: "text-xs font-medium py-3 px-4 rounded-full bg-[#FFFFFF]",
  put: "px-2 py-1 rounded-full text-[10px] lg:text-xs text-center min-w-[50px] lg:min-w-[60px] bg-yellow-500",
  post: "bg-blue-500 px-2 py-1 rounded-full text-[10px] lg:text-xs text-center min-w-[50px] lg:min-w-[60px]",
  get: "bg-green-500 px-2 py-1 rounded-full text-[10px] lg:text-xs text-center min-w-[50px] lg:min-w-[60px]",
};

const colorStyles: Record<string, string> = {
  primary: "text-white",
  secondary: "text-gray-300",
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
  button: "span",
  span: "span",
  badge: "span",
  caption: "p",
  badgeYellow: "span",
  badgeWhite: "span",
  put: "span",
  post: "span",
  get: "span",
};

export const Typography: React.FC<TypographyProps> = ({
  variant = "body",
  children,
  className = "",
  as,
  color = "primary",
  bgColor,
  align = "center",
  maxWidth = "none",
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
  const bgStyle = variant === "badge" && bgColor ? bgColor : "";

  const combinedClassName = twMerge(
    baseStyles,
    colorStyle,
    alignStyle,
    maxWidthStyle,
    noWrapStyle,
    bgStyle,
    className,
  );

  return <Component className={combinedClassName}>{children}</Component>;
};
