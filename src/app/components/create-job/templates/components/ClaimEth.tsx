import React, { useState } from "react";
import ClaimModal from "./ClaimModal";
import { SiEthereum } from "react-icons/si";
import { Button } from "@/app/components/ui/Button";

const ClaimEth: React.FC = () => {
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleClaim = () => {
    setShowClaimModal(true);
  };

  return (
    <>
      <Button onClick={handleClaim} color="yellow">
        <SiEthereum className="inline-block mr-2 -mt-0.5 text-gray-900" />
        Claim ETH
      </Button>
      <ClaimModal
        isOpen={showClaimModal}
        onClose={() => {
          setShowClaimModal(false);
        }}
      />
    </>
  );
};

export default ClaimEth;
