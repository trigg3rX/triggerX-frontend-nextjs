import React from "react";
import Image from "next/image";
import landingImg from "@/assets/navbar-landing.svg";

interface LandingImageProps {
  width: number;
  height: number;
  className?: string;
  alt: string;
  style?: React.CSSProperties;
  priority?: boolean;
}

export const LandingImage: React.FC<LandingImageProps> = ({
  width,
  height,
  className,
  alt,
  priority = false,
}) => {
  return (
    <>
      <Image
        src={landingImg}
        alt={alt}
        width={width}
        height={height}
        className={className}
        quality={75}
        priority={priority}
      />
    </>
  );
};
