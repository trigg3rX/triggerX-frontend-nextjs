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
import { ChevronDownIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { LucideCopyButton } from "../ui/CopyButton";
import { TablePagination } from "../ui/TablePagination";
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
    { key: "taskPerformed", label: "Task Performed", sortable: true },
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
  onRetry,
}: MainTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("points");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const itemsPerPage = 5;
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
  }, [filteredData, sortField, sortDirection, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const truncateAddress = useTruncateAddress();

  const highlightedData = useMemo(() => {
    if (!userAddress) return null;
    return data.find(
      (item) => item.address.toLowerCase() === userAddress.toLowerCase(),
    );
  }, [data, userAddress]);

  return (
    <>
      {highlightedData && (
        <HighlightedData data={highlightedData} type={activeTab as TabType} />
      )}

      {/* Desktop View */}
      <Card
        className={`hidden md:block w-full overflow-auto whitespace-nowrap ${styles.customScrollbar}`}
      >
        {error && (
          <ErrorMessage
            error={error}
            className="mt-4"
            retryText="Try Again"
            onRetry={onRetry}
          />
        )}
        {!error && filteredData.length === 0 && (
          <EmptyState type={activeTab as TabType} />
        )}
        {!error && filteredData.length > 0 && (
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
                  // onClick={() => handleRowClick(item)}
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
                    <div className="flex items-center gap-2">
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
                              ? "bg-[#F8FF7C] p-2 rounded-full text-black w-[90px] text-center "
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
                          View
                        </span>
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Mobile View */}
      <Card
        className={`md:hidden w-full overflow-auto ${styles.customScrollbar}`}
      >
        {error && (
          <ErrorMessage
            error={"Something went wrong"}
            className="mt-4"
            emoji="😒"
            retryText="Try Again"
            onRetry={onRetry}
          />
        )}
        {!error && filteredData.length === 0 && (
          <EmptyState type={activeTab as TabType} />
        )}
        {!error && filteredData.length > 0 && (
          <MobileTableGrid
            data={sortedAndPaginatedData}
            activeTab={activeTab as TabType}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            // onItemClick={handleRowClick}
          />
        )}
      </Card>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
