"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";
import { ChevronDownIcon, ExternalLink } from "lucide-react";
import { Pagination } from "../ui/Pagination";
import { useState, useMemo, useEffect } from "react";
import { LucideCopyButton } from "../ui/CopyButton";
import { MobileTableGrid } from "./MobileTableGrid";
import { Typography } from "../ui/Typography";
import EmptyState from "../common/EmptyState";
import HighlightedData from "./HighlightedData";
import styles from "@/app/styles/scrollbar.module.css";
import { TabType, TableData } from "@/types/leaderboard";
import useTruncateAddress from "@/hooks/useTruncateAddress";
import { Card } from "../ui/Card";
import { ErrorMessage } from "../common/ErrorMessage";
import useCountUp from "@/hooks/useCountUp";
import { TableSkeleton } from "../skeleton/TableSkeleton";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}
interface MainTableProps {
  activeTab: string;
  data?: TableData[];
  onViewProfile?: (address: string) => void;
  userAddress?: string | null;
  error?: string | null;
  onRetry?: () => void;
  isLoading?: boolean;
  apiLoading?: boolean;
}

// Column configurations for each tab
const TAB_COLUMNS: Record<TabType, Column[]> = {
  keeper: [
    { key: "name", label: "Operator", sortable: false },
    { key: "address", label: "Address", sortable: false },
    { key: "jobPerformed", label: "Job Performed", sortable: true },
    { key: "jobAttested", label: "Job Attested", sortable: true },
    { key: "points", label: "Points", sortable: true },
    { key: "profile", label: "Profile", sortable: false },
  ],
  developer: [
    { key: "address", label: "Address", sortable: false },
    { key: "totalJobs", label: "Total Jobs", sortable: true },
    { key: "taskPerformed", label: "Task Executed", sortable: true },
    { key: "points", label: "Points", sortable: true },
  ],
  contributor: [],
};

// PointsCounter component for animating points
function PointsCounter({ points }: { points: number }) {
  const animatedPoints = useCountUp(points, 1000);
  return <>{animatedPoints.toFixed(2)}</>;
}

export default function MainTable({
  activeTab = "keeper",
  data = [],
  onViewProfile,
  userAddress,
  error,
  apiLoading,
  onRetry,
}: MainTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>("points");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const columns = TAB_COLUMNS[activeTab as TabType] || [];

  // Filter out the developer row for the current user if activeTab is 'developer'
  const filteredData = useMemo(() => {
    return data;
  }, [data]);

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const sortedAndPaginatedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, sortField, sortDirection, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const truncateAddress = useTruncateAddress();

  const highlightedData = useMemo(() => {
    if (!userAddress) return null;
    return data.find(
      (item) => item.address.toLowerCase() === userAddress.toLowerCase(),
    );
  }, [data, userAddress]);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;

    if (apiLoading) {
      setIsLoading(true);
    } else {
      // Wait at least 2 seconds before hiding the skeleton
      timeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [apiLoading]);

  return (
    <>
      {highlightedData && (
        <HighlightedData data={highlightedData} type={activeTab as TabType} />
      )}

      {/* Desktop View */}
      <Card
        className={`hidden md:block w-full whitespace-nowrap ${styles.customScrollbar}`}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorMessage
            error={error}
            className="mt-4"
            retryText="Try Again"
            onRetry={onRetry}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState type={activeTab as TabType} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 ">
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className="h-14 px-6 cursor-pointer "
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <Typography variant="h4" color="primary" align="left">
                        {column.label}
                      </Typography>
                      {column.sortable && (
                        <ChevronDownIcon
                          className={`h-4 w-4 transition-transform ${
                            sortField === column.key && sortDirection === "asc"
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndPaginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={
                    userAddress &&
                    item.address.toLowerCase() === userAddress.toLowerCase()
                      ? "!bg-yellow-100/20 !border-yellow-300"
                      : ""
                  }
                >
                  {/* Only show name for keeper tab */}
                  {activeTab === "keeper" && (
                    <TableCell className="px-6 py-4">
                      <Typography variant="body" color="primary" align="left">
                        {item.name}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center">
                      <Typography variant="body" color="gray" align="left">
                        {truncateAddress(item.address)}
                      </Typography>
                      <LucideCopyButton text={item.address} />
                    </div>
                  </TableCell>
                  {columns
                    .slice(
                      activeTab === "keeper" ? 2 : 1,
                      columns.length - (activeTab === "keeper" ? 1 : 0),
                    )
                    .map((column) => (
                      <TableCell key={column.key} className="px-6 py-4">
                        <Typography
                          variant="body"
                          color="primary"
                          align="left"
                          className={
                            column.key === "points"
                              ? "bg-[#976fb93e] text-[#C07AF6] rounded-full py-1 w-[90px] text-center font-bold "
                              : ""
                          }
                        >
                          {column.key === "points" ? (
                            <PointsCounter
                              points={Number(
                                item[column.key as keyof typeof item],
                              )}
                            />
                          ) : (
                            item[column.key as keyof typeof item]
                          )}
                        </Typography>
                      </TableCell>
                    ))}
                  {/* Only show profile for keeper tab */}
                  {activeTab === "keeper" && (
                    <TableCell className="px-6 py-4">
                      <Typography
                        variant="body"
                        color="primary"
                        align="left"
                        className="underline underline-offset-2 hover:text-[#F8ff7c]/80 "
                      >
                        <span
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onViewProfile) onViewProfile(item.address);
                          }}
                        >
                          <ExternalLink className="inline w-5 h-5 align-middle" />
                        </span>
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!error && filteredData.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            className="mt-6"
          />
        )}
      </Card>

      {/* Mobile View */}
      <Card
        className={`md:hidden w-full overflow-auto ${styles.customScrollbar}`}
      >
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <ErrorMessage
            error={"Something went wrong"}
            className="mt-4"
            retryText="Try Again"
            onRetry={onRetry}
          />
        ) : activeTab === "contributor" || filteredData.length === 0 ? (
          <EmptyState type={activeTab as TabType} />
        ) : (
          <MobileTableGrid
            data={sortedAndPaginatedData}
            activeTab={activeTab as TabType}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onItemClick={(item) => onViewProfile?.(item.address)}
            pagination={
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                  totalItems={filteredData.length}
                />
              </div>
            }
          />
        )}
      </Card>
    </>
  );
}
