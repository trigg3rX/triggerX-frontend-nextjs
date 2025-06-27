"use client";

import { MainContainer } from "../ui/MainContainer";
import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { useState } from "react";
import MainJobs from "./MainJobs";
// import eventBasedSvg from "@/app/assets/common/event-based.svg";
// import conditionBasedSvg from "@/app/assets/common/condition-based.svg";
// import timeBasedSvg from "@/app/assets/common/time-based.svg";

const dropdownOptions: DropdownOption[] = [
  { id: "all", name: "All Types" },
  { id: "time", name: "Time-based" },
  { id: "event", name: "Event-based" },
  { id: "condition", name: "Condition-based" },
];

// const dropdownIcons = {
//   "All Types": null,
//   "Time-based": timeBasedSvg,
//   "Event-based": eventBasedSvg,
//   "Condition-based": conditionBasedSvg,
// };

const ActiveJobs = () => {
  const [selectedType, setSelectedType] = useState<string>("All Types");

  return (
    <MainContainer>
      <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-3 md:flex-row">
        <Typography variant="h2" color="white" align="left">
          Active Jobs
        </Typography>
        <div className="mb-5 w-56">
          <Dropdown
            label=""
            options={dropdownOptions}
            selectedOption={selectedType}
            onChange={(option) => setSelectedType(option.name)}
            className="gap-0"
            // icons={dropdownIcons}
          />
        </div>
      </div>
      <div className="mb-10">
        <MainJobs selectedType={selectedType} />
      </div>
    </MainContainer>
  );
};

export default ActiveJobs;
