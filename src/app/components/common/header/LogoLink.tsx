import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/assets/logo.svg";

interface LogoLinkProps {
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export const LogoLink: React.FC<LogoLinkProps> = ({
  width,
  height,
  className,
  priority = false,
}) => {
  return (
    <Link
      href="https://www.triggerx.network/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <Image
        src={logo}
        alt="TriggerX"
        width={width}
        height={height}
        priority={priority}
        className={className}
      />
    </Link>
  );
};
