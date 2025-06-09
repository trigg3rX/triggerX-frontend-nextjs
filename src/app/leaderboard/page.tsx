"use client";
import React, { useState } from "react";
import { Typography } from "../components/ui/Typography";
import SearchBar from "../components/ui/SearchBar";
import { useAccount } from "wagmi";
import AnimatedTabs from "../components/leaderboard/AnimatedTabs";

type TabType = "keeper" | "developer" | "contributor";

function Leaderboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("keeper");
  const { isConnected } = useAccount();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div>
      <Typography variant="h1" color="primary" className="mb-10">
        Leaderboard
      </Typography>
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6">
        <div className="w-full">
          <Typography
            variant="h2"
            color="blue"
            align="left"
            className="w-full mb-2"
          >
            Points & Fair Use
          </Typography>
          <div className="  mb-2 ">
            <Typography
              variant="h4"
              color="primary"
              align="left"
              className="w-full"
            >
              <li>
                Operator and developer points are tracked separately and do not
                affect each others rewards.
              </li>

              <li>
                Each wallet has a maximum point cap to ensure fair participation
                and prevent scripted job farming.
              </li>
            </Typography>
          </div>
          <Typography color="gray" align="left" className="w-full">
            The system is designed to reward genuine contributions.
          </Typography>
        </div>
        <div className="flex justify-center items-end w-full sm:w-auto lg:mb-8">
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onClearSearch={() => setSearchTerm("")}
          />
        </div>
      </div>
      <AnimatedTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {!isConnected && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-black/40 to-white/5 border border-white/10 px-4 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-center gap-1 lg:gap-2 text-[10px] xs:text-xs md:text-sm lg:text-base rounded-xl w-full sm:text-nowrap text-center">
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
                  stroke-miterlimit="10"
                />
                <path
                  d="M11.4124 9.78125C10.9021 9.17687 10.5418 8.92281 10.5418 7.25625C10.5418 5.72937 9.73618 5.18656 9.07305 4.92281C9.02733 4.90371 8.98609 4.87528 8.95197 4.83933C8.91786 4.80339 8.89162 4.76072 8.87493 4.71406C8.75899 4.33125 8.43368 4 7.99993 4C7.56618 4 7.24024 4.33125 7.12493 4.71438C7.10836 4.76105 7.0822 4.80374 7.04813 4.8397C7.01406 4.87565 6.97284 4.90407 6.92712 4.92312C6.26337 5.1875 5.45837 5.72938 5.45837 7.25656C5.45837 8.92313 5.09774 9.17719 4.58743 9.78156C4.37587 10.0316 4.56712 10.5003 4.93712 10.5003H11.0624C11.4302 10.5 11.6231 10.0312 11.4124 9.78125ZM6.88243 11C6.86485 10.9999 6.84745 11.0035 6.83136 11.0106C6.81527 11.0177 6.80085 11.0281 6.78906 11.0411C6.77726 11.0542 6.76835 11.0695 6.7629 11.0863C6.75745 11.103 6.75558 11.1206 6.75743 11.1381C6.82774 11.7231 7.34712 12 7.99993 12C8.64587 12 9.16055 11.7141 9.2393 11.14C9.24144 11.1224 9.23979 11.1045 9.23447 11.0875C9.22915 11.0706 9.22028 11.055 9.20845 11.0417C9.19662 11.0285 9.18211 11.0179 9.16588 11.0107C9.14964 11.0035 9.13206 10.9999 9.1143 11H6.88243Z"
                  fill="#A2A2A2"
                />
              </svg>
            </div>
            <span className="mt-0">
              Please connect your wallet to see your performance metrics in the
              leaderboard
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
