"use client";

import React, { useState } from "react";
import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { InputField } from "../ui/InputField";
import { Card } from "../ui/Card";
import TaskStats from "./TaskStats";
import TaskTable, { TaskData } from "./TaskTable";
import {
  fetchTasksByUserAddress,
  fetchTasksByJobId,
  fetchTaskById,
  fetchTasksByApiKey,
  fetchTasksBySafeAddress,
} from "@/utils/taskApi";
import { Button } from "../ui/Button";

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
  const [taskData, setTaskData] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const totalTasks = taskData.length;
  const totalUsers = 0;
  const totalKeepers = 0;
  const totalJobs = 0;

  const handleFilterChange = (option: DropdownOption) => {
    setSelectedFilter(option.name);
    setSearchValue("");
    setTaskData([]);
    setError("");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      setError("Please enter a search value");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let tasks: TaskData[] = [];

      switch (selectedFilter) {
        case "User Address":
          tasks = await fetchTasksByUserAddress(searchValue.trim());
          break;
        case "Job ID":
          tasks = await fetchTasksByJobId(searchValue.trim());
          break;
        case "Task ID":
          tasks = await fetchTaskById(searchValue.trim());
          break;
        case "API Key":
          tasks = await fetchTasksByApiKey(searchValue.trim());
          break;
        case "Safe Address":
          tasks = await fetchTasksBySafeAddress(searchValue.trim());
          break;
        default:
          setError("Invalid filter type");
          return;
      }

      setTaskData(tasks);
      if (tasks.length === 0) {
        setError("No tasks found for the given search criteria");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch tasks. Please try again.",
      );
      setTaskData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
            onKeyPress={handleKeyPress}
            placeholder={`Enter ${selectedFilter.toLowerCase()}...`}
            type="text"
          />
          <div className="flex justify-center">
            <Button
              onClick={handleSearch}
              disabled={loading || !searchValue.trim()}
              className="w-fit !px-12"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
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
      <TaskTable tasks={taskData} error={error} />
    </div>
  );
};

export default MainTaskPage;
