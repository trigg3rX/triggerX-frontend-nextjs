import React from "react";
import Image from "next/image";
import { TriggerOption } from "@/types/job";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";

interface TriggerButtonProps {
  option: TriggerOption;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent<HTMLButtonElement>, value: number) => void;
  isDisabled?: boolean;
}

export const TriggerButton = ({
  option,
  isSelected,
  onSelect,
  isDisabled = false,
}: TriggerButtonProps) => {
  const { isConnected } = useWalletConnectionContext();
  const actuallyDisabled = isDisabled || !isConnected;

  return (
    <button
      key={`${option.value}-${isConnected}`}
      onClick={(e) => onSelect(e, option.value)}
      className={`${
        isSelected
          ? "bg-gradient-to-r from-[#D9D9D924] to-[#14131324] border border-white"
          : "bg-white/5 border border-white/10"
      } text-nowrap relative flex flex-wrap flex-col items-center justify-center w-full md:w-[33%] gap-2 px-4 pb-4 pt-8 rounded-lg transition-all duration-300 text-xs sm:text-sm ${
        actuallyDisabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={actuallyDisabled}
    >
      <div
        className={`${
          isSelected ? "bg-white border border-white/10" : ""
        } absolute top-2 left-2 rounded-full w-3 h-3 border`}
      ></div>
      {isSelected ? (
        <Image
          src={option.selectedIcon}
          alt={option.label}
          className="w-auto h-8"
          priority
        />
      ) : (
        <Image
          src={option.icon}
          alt={option.label}
          className="w-10 h-10"
          priority
        />
      )}
      <span>{option.label}</span>
    </button>
  );
};

TriggerButton.displayName = "TriggerButton";
