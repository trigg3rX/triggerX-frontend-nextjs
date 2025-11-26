"use client";

import React, { useState } from "react";
import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { InputField } from "../ui/InputField";
import { Card } from "../ui/Card";
import TaskStats from "./TaskStats";
import TaskTable, { TaskData } from "./TaskTable";

const filterOptions: DropdownOption[] = [
  { id: "user_address", name: "User Address" },
  { id: "api_key", name: "API Key" },
  { id: "safe_address", name: "Safe Address" },
  { id: "job_id", name: "Job ID" },
  { id: "task_id", name: "Task ID" },
];

const MainTaskPage = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>("User Address");
  const [searchValue, setSearchValue] = useState<string>("");

  // TODO: Replace these with actual data from your API/context
  //   const [totalTasks, setTotalTasks] = useState<number>(0);
  //   const [totalUsers, setTotalUsers] = useState<number>(0);
  //   const [totalKeepers, setTotalKeepers] = useState<number>(0);
  //   const [totalJobs, setTotalJobs] = useState<number>(0);

  const totalTasks = 0;
  const totalUsers = 0;
  const totalKeepers = 0;
  const totalJobs = 0;

  // TODO: Replace with actual task data from your API
  //   const [taskData, setTaskData] = useState<TaskData[]>([
  // Example data structure - replace with real data
  // {
  //   id: '1',
  //   taskNumber: 1001,
  //   txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  //   txUrl: 'https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  //   timestamp: new Date().toISOString(),
  //   status: 'completed',
  //   operationCost: 0.001234,
  // }
  //   ]);
  const taskData: TaskData[] = [
    {
      id: "1",
      taskNumber: 1001,
      txHash:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      txUrl:
        "https://etherscan.io/tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      timestamp: new Date().toISOString(),
      status: "completed",
      operationCost: 0.001234,
    },
  ];

  const handleFilterChange = (option: DropdownOption) => {
    setSelectedFilter(option.name);
    // Optionally clear the search value when filter type changes
    // setSearchValue('');
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  return (
    <div className="">
      <Typography variant="h1" color="primary">
        Task Table
      </Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        View all your jobs, logs, triggers, and automation status in one place.
      </Typography>

      {/* Filter */}
      <Card className="mb-6 relative z-10">
        <div className="space-y-4">
          <Dropdown
            label="Filter By"
            options={filterOptions}
            selectedOption={selectedFilter}
            onChange={handleFilterChange}
            color="primary"
          />
          <InputField
            label="Search Value"
            value={searchValue}
            onChange={handleSearchChange}
            placeholder={`Enter ${selectedFilter.toLowerCase()}...`}
            type="text"
          />
        </div>
      </Card>

      {/* Total Value */}
      <TaskStats
        totalTasks={totalTasks}
        totalUsers={totalUsers}
        totalKeepers={totalKeepers}
        totalJobs={totalJobs}
      />

      {/* Table Of Data */}
      <TaskTable tasks={taskData} />
    </div>
  );
};

export default MainTaskPage;
