"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Typography } from "../ui/Typography";
import { Dropdown, DropdownOption } from "../ui/Dropdown";
import { Card } from "../ui/Card";
import TaskStats from "./TaskStats";
import TaskTable, { TaskData } from "./TaskTable";
import {
  fetchTasksByUserAddress,
  fetchTasksByJobId,
  fetchTaskById,
  fetchTasksByApiKey,
  fetchTasksBySafeAddress,
  fetchRecentTasks,
} from "@/utils/taskApi";

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
  const [allRecentTasks, setAllRecentTasks] = useState<TaskData[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Calculate stats from filtered task data (data displayed in table)
  const { totalTasks, totalJobs, totalUsers, totalKeepers } = useMemo(() => {
    // Calculate total tasks from filtered data
    const totalTasks = taskData.length;

    // Calculate unique jobs from filtered data
    const uniqueJobs = new Set(
      taskData.map((task) => task.jobId).filter((id) => id !== undefined),
    );
    const totalJobs = uniqueJobs.size;

    // Calculate unique performers (users/keepers who performed tasks) from filtered data
    const uniquePerformers = new Set(
      taskData.map((task) => task.performerId).filter((id) => id !== undefined),
    );
    const totalUsers = uniquePerformers.size;

    // Calculate unique attesters (keepers who attested tasks) from filtered data
    const uniqueAttesters = new Set(
      taskData
        .flatMap((task) => task.attesterIds || [])
        .filter((id) => id !== undefined),
    );
    const totalKeepers = uniqueAttesters.size;

    return { totalTasks, totalJobs, totalUsers, totalKeepers };
  }, [taskData]);

  // Fetch recent tasks on initial load
  useEffect(() => {
    const loadRecentTasks = async () => {
      setLoading(true);
      setError("");
      try {
        const tasks = await fetchRecentTasks();
        console.log("[MainTaskPage] Recent tasks loaded:", {
          count: tasks.length,
          tasks: tasks.slice(0, 5), // Log first 5 tasks
          allJobIds: [...new Set(tasks.map((t) => t.jobId).filter(Boolean))],
          uniqueJobsCount: new Set(tasks.map((t) => t.jobId).filter(Boolean))
            .size,
        });
        setAllRecentTasks(tasks);
        setTaskData(tasks);
        if (tasks.length === 0) {
          setError("No recent tasks found.");
        }
      } catch (err) {
        console.error("[MainTaskPage] Error loading recent tasks:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load recent tasks. Please try again.",
        );
        setTaskData([]);
        setAllRecentTasks([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentTasks();
  }, []);

  const handleFilterChange = (option: DropdownOption) => {
    console.log("[MainTaskPage] Filter changed:", {
      from: selectedFilter,
      to: option.name,
      allRecentTasksCount: allRecentTasks.length,
    });
    setSelectedFilter(option.name);
    setSearchValue("");
    // Reset to show all recent tasks when filter changes
    setTaskData(allRecentTasks);
    setError("");
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Validate search value based on filter type
  const isValidSearchValue = (value: string, filter: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;

    switch (filter) {
      case "User Address":
      case "Safe Address":
        // Ethereum addresses: allow partial addresses while typing (at least 3 chars for "0x" + 1 hex)
        // But require valid hex format if it starts with 0x
        if (trimmed.length < 3) return false;
        if (trimmed.startsWith("0x")) {
          return /^0x[a-fA-F0-9]*$/.test(trimmed) && trimmed.length >= 3;
        }
        // Allow partial addresses without 0x prefix
        return trimmed.length >= 3;
      case "Job ID":
        // Job IDs should be at least 3 characters to avoid too many API calls
        return trimmed.length >= 3;
      case "Task ID":
        // Task IDs should be numeric and at least 1 digit
        return trimmed.length >= 1 && /^\d+$/.test(trimmed);
      case "API Key":
        // API keys should be at least 10 characters
        return trimmed.length >= 10;
      default:
        return trimmed.length >= 1;
    }
  };

  // Perform search when searchValue or selectedFilter changes
  useEffect(() => {
    console.log("[MainTaskPage] Search effect triggered:", {
      searchValue,
      selectedFilter,
      allRecentTasksCount: allRecentTasks.length,
    });

    // If search is empty, show all recent tasks
    if (!searchValue.trim()) {
      console.log("[MainTaskPage] Search empty, showing all recent tasks");
      setTaskData(allRecentTasks);
      setError("");
      return;
    }

    // Validate search value before making API call
    if (!isValidSearchValue(searchValue, selectedFilter)) {
      console.log(
        "[MainTaskPage] Search value too short or invalid, waiting for more input",
      );
      const getValidationMessage = () => {
        switch (selectedFilter) {
          case "User Address":
          case "Safe Address":
            return "Please enter a valid address (minimum 3 characters)";
          case "Job ID":
            return "Please enter a valid Job ID (minimum 3 characters)";
          case "Task ID":
            return "Please enter a valid Task ID (numeric)";
          case "API Key":
            return "Please enter a valid API Key (minimum 10 characters)";
          default:
            return "Please enter a valid value";
        }
      };
      setError(getValidationMessage());
      setLoading(false);
      return;
    }

    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(async () => {
      console.log("[MainTaskPage] Executing search:", {
        filter: selectedFilter,
        searchValue: searchValue.trim(),
      });
      setLoading(true);
      setError("");

      try {
        let tasks: TaskData[] = [];

        switch (selectedFilter) {
          case "User Address":
            console.log(
              "[MainTaskPage] Fetching by User Address:",
              searchValue.trim(),
            );
            tasks = await fetchTasksByUserAddress(searchValue.trim());
            break;
          case "Job ID":
            console.log(
              "[MainTaskPage] Fetching by Job ID:",
              searchValue.trim(),
            );
            tasks = await fetchTasksByJobId(searchValue.trim());
            break;
          case "Task ID":
            console.log(
              "[MainTaskPage] Fetching by Task ID:",
              searchValue.trim(),
            );
            tasks = await fetchTaskById(searchValue.trim());
            break;
          case "API Key":
            console.log(
              "[MainTaskPage] Fetching by API Key:",
              searchValue.trim(),
            );
            tasks = await fetchTasksByApiKey(searchValue.trim());
            break;
          case "Safe Address":
            console.log(
              "[MainTaskPage] Fetching by Safe Address:",
              searchValue.trim(),
            );
            tasks = await fetchTasksBySafeAddress(searchValue.trim());
            break;
          default:
            console.error(
              "[MainTaskPage] Invalid filter type:",
              selectedFilter,
            );
            setError("Invalid filter type");
            setLoading(false);
            return;
        }

        console.log("[MainTaskPage] Search results:", {
          filter: selectedFilter,
          searchValue: searchValue.trim(),
          tasksCount: tasks.length,
          tasks: tasks.slice(0, 3), // Log first 3 tasks
        });

        setTaskData(tasks);
        if (tasks.length === 0) {
          setError(
            "No tasks found. Please check your search value and try again.",
          );
        } else {
          setError("");
        }
      } catch (err) {
        console.error("[MainTaskPage] Search error:", {
          filter: selectedFilter,
          searchValue: searchValue.trim(),
          error: err,
        });

        // Handle 404 as "no results" rather than an error
        if (err instanceof Error && err.message.includes("404")) {
          setTaskData([]);
          setError(
            "No tasks found. Please check your search value and try again.",
          );
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch tasks. Please try again.",
          );
          setTaskData([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchValue, selectedFilter, allRecentTasks]);

  return (
    <div className="">
      <Typography variant="h1" color="primary">
        Task Table
      </Typography>
      <Typography variant="h4" color="secondary" className="my-6">
        View all your jobs, logs, triggers, and automation status in one place.
      </Typography>

      {/* Total Value */}
      <TaskStats
        totalTasks={totalTasks}
        totalUsers={totalUsers}
        totalKeepers={totalKeepers}
        totalJobs={totalJobs}
      />

      {/* Filter */}
      <Card className="relative z-10 flex flex-col sm:flex-row items-center gap-6 w-full mb-4">
        {/* Dropdown */}
        <div className="w-full sm:w-[20%] ">
          <Dropdown
            options={filterOptions}
            selectedOption={selectedFilter}
            onChange={handleFilterChange}
            color="primary"
            className="!w-full"
          />
        </div>

        {/* Input and Button Container */}
        <div className="w-full sm:w-[80%] flex items-center">
          <input
            type="text"
            placeholder={`Enter ${selectedFilter.toLowerCase()}...`}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="bg-[#181818] text-[#EDEDED] border border-[#A2A2A2] placeholder-[#A2A2A2] rounded-l-full px-6 py-2.5 focus:outline-none text-xs xs:text-sm sm:text-base w-full"
          />
          <button
            type="button"
            className="bg-[#C07AF6] hover:bg-[#a46be0] transition-colors w-12 h-12 sm:w-12 sm:h-12 flex items-center justify-center -ml-6 z-10 border border-[#A2A2A2] rounded-full flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#fff"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </Card>

      {/* Table Of Data */}
      <TaskTable tasks={taskData} error={error} loading={loading} />
    </div>
  );
};

export default MainTaskPage;
