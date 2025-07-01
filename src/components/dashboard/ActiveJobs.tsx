"use client";

import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { useState } from "react";
import MainJobs from "./MainJobs";
import { Card } from "../ui/Card";

const dropdownOptions: DropdownOption[] = [
  { id: "all", name: "All Types" },
  { id: "time", name: "Time-based" },
  { id: "event", name: "Event-based" },
  { id: "condition", name: "Condition-based" },
];

const ActiveJobs = () => {
  const [selectedType, setSelectedType] = useState<string>("All Types");

  return (
    <Card>
      <div className="flex justify-between items-center mb-6 flex-col lg:flex-row gap-3 md:flex-row">
        <Typography variant="h3" color="white" align="left">
          Active Jobs
        </Typography>
        <div className="mb-5 w-56">
          <Dropdown
            label=""
            options={dropdownOptions}
            selectedOption={selectedType}
            onChange={(option) => setSelectedType(option.name)}
            className="gap-0 w-full"
          />
        </div>
      </div>
      <div className="mb-10">
        <MainJobs selectedType={selectedType} />
      </div>
    </Card>
  );
};

export default ActiveJobs;
