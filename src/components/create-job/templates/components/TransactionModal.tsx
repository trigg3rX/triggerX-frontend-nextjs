import React from "react";
import Modal from "@/components/ui/Modal";
import { FiInfo } from "react-icons/fi";
import { Typography } from "@/components/ui/Typography";
import Tooltip from "@/components/ui/Tooltip";
import { Button } from "@/components/ui/Button";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modalType?: string;
  modalData: {
    amount: string;
    networkFee: string;
    speed: string;
    contractAddress: string;
    contractMethod: string;
  };
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  modalData,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Typography variant="h2" className="mb-6">
        Transaction Request
      </Typography>

      <div className="space-y-4 sm:space-y-6 ">
        <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-lg flex justify-between items-center">
          <Typography variant="body">Interacting with</Typography>
          <Typography variant="body" color="secondary">
            {modalData.contractAddress}
          </Typography>
        </div>

        <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <div className="flex items-center">
              <Typography variant="body">Required ETH</Typography>
              <Tooltip title="Extra ETH held in the contract, will be used automatically to top up the address if its balance falls below the set minimum.">
                <FiInfo
                  className="text-gray-400 hover:text-white cursor-pointer ml-2 mb-1"
                  size={15}
                />
              </Tooltip>
            </div>
            <Typography variant="body" color="secondary">
              {modalData.amount} ETH
            </Typography>
          </div>

          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <Typography variant="body">Network Fee</Typography>
            <Typography variant="body" color="secondary">
              {modalData.networkFee}
            </Typography>
          </div>

          <div className="flex justify-between items-center">
            <Typography variant="body">Speed</Typography>
            <div className="flex items-center">
              <Typography variant="body" className="text-orange-400 mr-2">
                <span className="mr-1">🦊</span>
                <span>Market</span>
              </Typography>
              <Typography variant="body">~{modalData.speed}</Typography>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-3 sm:p-4 rounded-lg">
          <div className="flex items-start gap-3 justify-start sm:justify-between">
            <Typography variant="body">Method:</Typography>
            <Typography variant="body" color="secondary">
              {modalData.contractMethod}
            </Typography>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 flex justify-between gap-3 sm:gap-5">
        <Button onClick={onClose} color="white" className="flex-1">
          <Typography variant="body" className="text-black">
            Cancel
          </Typography>
        </Button>
        <Button onClick={onConfirm} color="purple" className="flex-1">
          <Typography variant="body">Confirm</Typography>
        </Button>
      </div>
    </Modal>
  );
};

export default TransactionModal;
