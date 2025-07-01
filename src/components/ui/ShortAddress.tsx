import React from "react";

interface ShortAddressProps {
  address?: string | null;
  className?: string;
}

const ShortAddress: React.FC<ShortAddressProps> = ({
  address,
  className = "",
}) => {
  if (!address) return <>{""}</>;
  return (
    <span className={className}>
      {address.substring(0, 7)}...{address.substring(address.length - 15)}
    </span>
  );
};

export default ShortAddress;
