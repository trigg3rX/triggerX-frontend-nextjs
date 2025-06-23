import React, { useState } from "react";
import { useWalletConnectionContext } from "@/contexts/WalletConnectionContext";

import TemplateInfoSection from "./components/TemplateInfoSection";

const StakingRewards = () => {
  const { isConnected } = useWalletConnectionContext();

  // Local state for balances, modal, and loading
  const [hasSufficientBalance] = useState(true);
  const [hasSufficientTokenBalance] = useState(false);
  const [isClaimingToken] = useState(false);

  // Placeholder for network check
  const isOptimismSepoliaNetwork = () => true;

  // Placeholder handlers
  const showStakeTokenClaimModal = () => {};

  return (
    <div className=" ">
      <div className="max-w-[1600px] mx-auto ">
        {/* Static Content */}
        <TemplateInfoSection
          title="StakingReward Template"
          description="Stake ERC20 tokens and earn rewards based on your participation. Once the staking threshold is reached, you'll automatically receive Reward NFTs and points. No manual setup required—the job will be auto-created for you."
          steps={[
            "Claim Tokens - Click to receive ERC20 tokens.",
            "Choose Action - Select 'Stake' or 'Unstake.'",
            "Stake - Enter amount to lock tokens.",
            "Unstake - Only if you've staked before.",
            "Job Auto-Created - TriggerX creates the job based on your stake status.",
            "Earn Rewards - Receive NFTs + points once the threshold is met.",
          ]}
        />

        {/* Network Warning */}
        {isConnected && !isOptimismSepoliaNetwork() && (
          <div className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 p-3 sm:p-5 rounded-xl mt-4 sm:mt-6">
            <div className="flex items-center mb-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm sm:text-base text-yellow-400">
                Please switch to Optimism Sepolia network to claim tokens.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-[#A2A2A2] ml-6 sm:ml-7">
              Make sure you&apos;re connected to the correct network in your
              wallet.
            </p>
          </div>
        )}

        {/* Conditional Content - Only show if not connected or on the correct network */}
        {(!isConnected || isOptimismSepoliaNetwork()) && (
          <>
            <div className="rounded-xl ">
              <div className="text-[#A2A2A2]">
                {!isConnected ? (
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
                    <p className="text-sm sm:text-lg mb-2">
                      Wallet Not Connected
                    </p>
                    <p className="text-sm sm:text-base text-center text-[#666666] mb-4 tracking-wide">
                      Please connect your wallet to interact with the contract
                    </p>
                  </div>
                ) : (
                  <div className="">
                    <div className="flex flex-wrap gap-4">
                      {hasSufficientBalance ? (
                        !hasSufficientTokenBalance && (
                          <button
                            onClick={showStakeTokenClaimModal}
                            className="bg-[#C07AF6] text-white lg:px-8 lg:py-3 px-4 py-2 my-5 rounded-full transition-all text-md lg:text-lg flex items-center hover:bg-[#B15AE6] hover:shadow-md hover:shadow-[#C07AF6]/20 hover:-translate-y-0.5"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 mr-2"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {isClaimingToken ? "Claiming..." : "Claim Token"}
                          </button>
                        )
                      ) : (
                        <></>
                      )}
                    </div>
                    {!hasSufficientBalance && (
                      <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-sm sm:text-base tracking-wide">
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
                        You need to claim ETH before Stake/Unstake Tokens.
                      </span>
                    )}
                    {hasSufficientBalance && !hasSufficientTokenBalance && (
                      <span className="bg-[#141414] backdrop-blur-xl rounded-2xl p-5 border border-white/10  space-y-8 flex items-start justify-start gap-2 text-sm sm:text-base tracking-wide">
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
                        You need to claim tokens before staking them.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* ...rest of the code for staking/unstaking, job config, ABI, etc. ... */}
          </>
        )}
      </div>
    </div>
  );
};

export default StakingRewards;
