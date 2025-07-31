import React, { useState } from "react";
import ClaimModal from "./ClaimModal";
import { SiEthereum } from "react-icons/si";
import { Button } from "@/components/ui/Button";

interface ClaimEthProps {
  onClaimSuccess?: () => void;
}

const ClaimEth: React.FC<ClaimEthProps> = ({ onClaimSuccess }) => {
  const [showClaimModal, setShowClaimModal] = useState(false);

  const handleClaim = () => {
    setShowClaimModal(true);
  };

  const handleClose = () => {
    setShowClaimModal(false);
  };

  const handleClaimSuccess = () => {
    if (onClaimSuccess) {
      onClaimSuccess();
    }
  };

  return (
    <>
      <Button onClick={handleClaim} color="yellow">
        <SiEthereum className="inline-block mr-2 -mt-0.5 text-gray-900" />
        Claim ETH
      </Button>
      <ClaimModal
        isOpen={showClaimModal}
        onClose={handleClose}
        onClaimSuccess={handleClaimSuccess}
      />
    </>
  );
};

export default ClaimEth;
