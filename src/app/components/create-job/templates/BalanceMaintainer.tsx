import React, { useState } from "react";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";
import { useAccount } from "wagmi";
import { useJob } from "@/contexts/JobContext";
import { Modal } from "@/app/components/ui/Modal";
import JobProcessing from "../JobProcessing";
import { FiCheck, FiCopy } from "react-icons/fi";
import TemplateInfoSection from "./components/TemplateInfoSection";

// Define a type for address entries
interface AddressEntry {
  key: string;
  address: string;
  currentBalance: string;
  minimumBalance: string;
}

const BalanceMaintainer = () => {
  // Contexts/hooks
  const { isConnected } = useWalletConnectionContext();
  const { address: ownerAddress } = useAccount();
  const { setSelectedJob } = useJob();

  // Local state
  const [isPageLoading] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [hasSufficientBalance, setHasSufficientBalance] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [contractAddress, setContractAddress] = useState("");
  const [chainId] = useState(11155420); // Use number instead of BigInt
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [copiedAddresses, setCopiedAddresses] = useState<{
    [addr: string]: boolean;
  }>({});

  // Placeholder deploy/claim logic
  const showDeployModal = () => {
    setModalType("deploy");
    setShowModal(true);
  };
  const showAddAddressModal = () => {
    setModalType("addAddress");
    setShowModal(true);
  };
  const handleConfirm = () => {
    setShowModal(false);
    if (modalType === "deploy") {
      setIsLoading(true);
      setTimeout(() => {
        setIsDeployed(true);
        setIsInitialized(true);
        setContractAddress("0x1234567890abcdef1234567890abcdef12345678");
        setIsLoading(false);
      }, 1500);
    } else if (modalType === "addAddress") {
      setIsLoading(true);
      setTimeout(() => {
        setAddresses((prev) => [
          ...prev,
          {
            key: `${newAddress}-${newBalance}`,
            address: newAddress,
            currentBalance: (Math.random() * 0.05).toFixed(4),
            minimumBalance: newBalance,
          },
        ]);
        setNewAddress("");
        setNewBalance("");
        setIsLoading(false);
      }, 1000);
    }
  };
  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddresses((prev) => ({ ...prev, [addr]: true }));
    setTimeout(
      () => setCopiedAddresses((prev) => ({ ...prev, [addr]: false })),
      1200,
    );
  };

  return (
    <div className="">
      <div className="max-w-[1600px] mx-auto ">
        {/* Template Info Section */}
        <TemplateInfoSection
          title="BalanceMaintainer Template"
          description="This template automatically monitors and refills ETH for selected addresses when their balance drops below a set threshold."
          steps={[
            "On contract deployment, extra ETH will be held to cover future top-ups when balances dip.",
            "Add the address you want to monitor",
            "Set the minimum balance to maintain (for testnet, keep it below 0.02 ETH)",
            "Confirm the transaction to save your settings",
            "Click on Create Job.",
            "Once set, top-ups happen automatically—no manual checks required.",
          ]}
        />

        {/* Contract Info Section */}
        <div className="rounded-lg">
          <div className="text-[#A2A2A2]">
            {isPageLoading ? (
              <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-lg mt-4 sm:mt-6">
                <span className="text-white text-center text-sm lg:text-md">
                  Loading contract details...
                </span>
              </div>
            ) : !isConnected ? (
              <div className="flex flex-col items-center justify-center h-[150px] sm:h-[200px] text-[#A2A2A2] my-3">
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mb-3"
                >
                  <path
                    d="M12 17C12.2833 17 12.521 16.904 12.713 16.712C12.905 16.52 13.0007 16.2827 13 16C12.9993 15.7173 12.9033 15.48 12.712 15.288C12.5207 15.096 12.2833 15 12 15C11.7167 15 11.4793 15.096 11.288 15.288C11.0967 15.48 11.0007 15.7173 11 16C10.9993 16.2827 11.0953 16.5203 11.288 16.713C11.4807 16.9057 11.718 17.0013 12 17ZM12 13C12.2833 13 12.521 12.904 12.713 12.712C12.905 12.52 13.0007 12.2827 13 12V8C13 7.71667 12.904 7.47933 12.712 7.288C12.52 7.09667 12.2827 7.00067 12 7C11.7173 6.99933 11.48 7.09533 11.288 7.288C11.096 7.48067 11 7.718 11 8V12C11 12.2833 11.096 12.521 11.288 12.713C11.48 12.905 11.7173 13.0007 12 13ZM12 22C10.6167 22 9.31667 21.7373 8.1 21.212C6.88334 20.6867 5.825 19.9743 4.925 19.075C4.025 18.1757 3.31267 17.1173 2.788 15.9C2.26333 14.6827 2.00067 13.3827 2 12C1.99933 10.6173 2.262 9.31733 2.788 8.1C3.314 6.88267 4.02633 5.82433 4.925 4.925C5.82367 4.02567 6.882 3.31333 8.1 2.788C9.318 2.26267 10.618 2 12 2C13.382 2 14.682 2.26267 15.9 2.788C17.118 3.31333 18.1763 4.02567 19.075 4.925C19.9737 5.82433 20.6863 6.88267 21.213 8.1C21.7397 9.31733 22.002 10.6173 22 12C21.998 13.3827 21.7353 14.6827 21.212 15.9C20.6887 17.1173 19.9763 18.1757 19.075 19.075C18.1737 19.9743 17.1153 20.687 15.9 21.213C14.6847 21.739 13.3847 22.0013 12 22Z"
                    fill="#A2A2A2"
                  />
                </svg>
                <p className="text-sm sm:text-lg mb-2">Wallet Not Connected</p>
                <p className="text-sm sm:text-base text-center text-[#666666] mb-4 tracking-wide">
                  Please connect your wallet to interact with the contract
                </p>
              </div>
            ) : !isDeployed ? (
              <>
                <div className="flex flex-wrap gap-4">
                  {hasSufficientBalance ? (
                    <button
                      onClick={showDeployModal}
                      disabled={isLoading && modalType === "deploy"}
                      className="bg-[#77E8A3] text-black rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      {isLoading && modalType === "deploy"
                        ? "Deploying..."
                        : "Deploy Contract"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setHasSufficientBalance(true)}
                      className="bg-[#F8FF7C] text-black rounded-full px-4 sm:px-6 py-2 sm:py-3 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      Claim ETH
                    </button>
                  )}
                </div>
                {hasSufficientBalance && (
                  <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4 sm:space-y-8 flex items-center justify-start gap-2 text-sm sm:text-base tracking-wide ">
                    <div className="mb-1">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 16 16"
                        fill=""
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z"
                          stroke="#A2A2A2"
                          strokeMiterlimit="10"
                        />
                        <path
                          d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z"
                          fill="#A2A2A2"
                        />
                      </svg>
                    </div>
                    You need to deploy contract before create the job.
                  </span>
                )}
                {!hasSufficientBalance && (
                  <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 space-y-4 sm:space-y-8 flex items-center justify-start gap-2 text-sm sm:text-base tracking-wide ">
                    <div className="mb-1">
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 16 16"
                        fill=""
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14 8C14 4.6875 11.3125 2 8 2C4.6875 2 2 4.6875 2 8C2 11.3125 4.6875 14 8 14C11.3125 14 14 11.3125 14 8Z"
                          stroke="#A2A2A2"
                          strokeMiterlimit="10"
                        />
                        <path
                          d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z"
                          fill="#A2A2A2"
                        />
                      </svg>
                    </div>
                    You need to claim ETH before create the job.
                  </span>
                )}
              </>
            ) : (
              <>
                <h2 className="text-lg sm:text-xl text-white my-4 sm:my-6">
                  Contract Information
                </h2>

                <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-lg">
                  <p className="text-white py-2 text-sm sm:text-base">
                    Status :{" "}
                    <span className="text-[#A2A2A2] font-semibold pl-2">
                      {isInitialized ? "Deployed Successfully" : "Deploying..."}
                    </span>
                  </p>
                  <p className="text-white py-2 text-sm sm:text-base">
                    Owner :{" "}
                    <span className="text-[#A2A2A2] font-semibold pl-2">
                      <span className="hidden sm:inline break-all">
                        {ownerAddress}
                      </span>
                      <span className="sm:hidden">
                        {ownerAddress
                          ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
                          : "-"}
                      </span>
                    </span>
                  </p>
                  <p className="text-white py-2 text-sm sm:text-base">
                    Contract Address :{" "}
                    <a
                      href={`$${
                        chainId === 11155420
                          ? "https://sepolia-optimism.etherscan.io/address/"
                          : "https://sepolia.basescan.org/address/"
                      }${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#77E8A3] underline pl-2 break-all"
                    >
                      <span className="hidden sm:inline break-all">
                        {contractAddress}
                      </span>
                      <span className="sm:hidden">
                        {contractAddress
                          ? `${contractAddress.slice(0, 12)}...${contractAddress.slice(-6)}`
                          : "-"}
                      </span>
                    </a>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
          {isLoading ? (
            <JobProcessing />
          ) : (
            <div className="text-white text-center">
              <h3 className="text-lg mb-4">
                {modalType === "deploy" ? "Deploy Contract" : "Add Address"}
              </h3>
              <p className="mb-4">Are you sure you want to proceed?</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleConfirm}
                  className="bg-[#77E8A3] text-black rounded-full px-6 py-2"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-white/10 text-white rounded-full px-6 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Add Addresses - Only visible after deployment */}
        {isPageLoading
          ? null
          : isDeployed && (
              <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-lg my-4 sm:my-6">
                <h2 className="text-lg sm:text-xl text-white mb-3">
                  Add Addresses
                </h2>
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <input
                    type="text"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="Enter wallet address"
                    className="bg-white/5 border border-white/10 rounded-lg text-white px-4 py-3 sm:py-4 text-sm sm:text-base flex-1 placeholder-gray-400 focus:outline-none"
                    disabled={isLoading}
                  />
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="Min balance"
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 sm:py-4 text-sm sm:text-base w-full sm:w-48"
                    step="0.1"
                    min="0"
                    disabled={isLoading}
                  />
                  <button
                    onClick={showAddAddressModal}
                    disabled={isLoading || !newAddress || !newBalance}
                    className={`bg-[#FFFFFF] text-black rounded-full px-4 sm:px-6 py-2 sm:py-3  transition-colors whitespace-nowrap text-sm sm:text-base ${isLoading || !newAddress || !newBalance ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoading && modalType === "addAddress"
                      ? "Adding..."
                      : "Add Address"}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-500/50 rounded text-red-200 text-sm sm:text-base">
                    {error}
                  </div>
                )}
              </div>
            )}

        {/* Addresses Table */}
        {isPageLoading
          ? null
          : isDeployed &&
            addresses.length > 0 && (
              <div className="p-2 sm:p-4 rounded-lg mb-4 sm:mb-6 ">
                <h2 className="text-base sm:text-lg md:text-xl text-white mb-2 sm:mb-3">
                  Configured Addresses
                </h2>
                <div className="overflow-x-auto w-full -mx-2 sm:mx-0">
                  <div className="border border-white/10 rounded-lg overflow-hidden min-w-[600px]">
                    <table className="w-full border-collapse">
                      <thead className="bg-white/5">
                        <tr>
                          <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 text-left text-white text-xs sm:text-sm md:text-base">
                            Address
                          </th>
                          <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 text-left text-white  text-xs sm:text-sm md:text-base">
                            Current Balance
                          </th>
                          <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 text-left text-white  text-xs sm:text-sm md:text-base">
                            Min Balance (ETH)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {addresses.map((item) => (
                          <tr key={item.key} className="bg-[#1A1A1A]">
                            <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 text-[#A2A2A2]  truncate text-xs sm:text-sm md:text-base">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="block truncate">
                                  <span className="s">{`${item.address.slice(0, 4)}...${item.address.slice(-15)}`}</span>
                                </span>
                                <button
                                  onClick={() => copyAddress(item.address)}
                                  className="p-0.5 sm:p-1 hover:bg-white/10 rounded transition-colors"
                                  title="Copy address"
                                >
                                  {copiedAddresses[item.address] ? (
                                    <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                  ) : (
                                    <FiCopy className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 ">
                              <span className="px-1.5 sm:px-2 md:px-4 py-0.5 sm:py-1 md:py-2 bg-[#4CAF50] text-white rounded whitespace-nowrap text-xs sm:text-sm">
                                {item.currentBalance} ETH
                              </span>
                            </td>
                            <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-5 ">
                              <span className="px-1.5 sm:px-2 md:px-4 py-0.5 sm:py-1 md:py-2 bg-[#C07AF6] text-white rounded whitespace-nowrap text-xs sm:text-sm">
                                {item.minimumBalance} ETH
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

        {/* Deploy Button */}
        <div className="flex justify-center">
          {isPageLoading
            ? null
            : isDeployed && (
                <button
                  onClick={() => {
                    setSelectedJob(null);
                    const jobState = {
                      jobType: 1,
                      jobTitle: "Test",
                      contractAddress: contractAddress,
                      abi: JSON.stringify([
                        {
                          inputs: [],
                          name: "maintainBalances",
                          outputs: [],
                          stateMutability: "nonpayable",
                          type: "function",
                        },
                      ]),
                      timeframe: { days: 1, hours: 0, minutes: 0 },
                      timeInterval: { hours: 1, minutes: 0, seconds: 0 },
                    };
                    window.history.pushState(
                      jobState,
                      "",
                      window.location.pathname,
                    );
                    window.dispatchEvent(
                      new PopStateEvent("popstate", { state: jobState }),
                    );
                  }}
                  className="relative bg-[#F8FF7C] text-[#000000] border border-[#222222] px-4 sm:px-6 py-2 sm:py-3 rounded-full group transition-transform"
                >
                  <span className="absolute inset-0 bg-[#222222] border border-[#FFFFFF80]/50 rounded-full scale-100 translate-y-0 transition-all duration-300 ease-out group-hover:translate-y-2"></span>
                  <span className="absolute inset-0 bg-[#F8FF7C] rounded-full scale-100 translate-y-0 group-hover:translate-y-0"></span>
                  <span className="bottom-[2px] font-actayRegular relative z-10 px-0 py-2 sm:py-3 sm:px-3 md:px-6 lg:px-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-all duration-300 ease-out text-xs sm:text-base">
                    Create Job
                  </span>
                </button>
              )}
        </div>
      </div>
    </div>
  );
};

export default BalanceMaintainer;
