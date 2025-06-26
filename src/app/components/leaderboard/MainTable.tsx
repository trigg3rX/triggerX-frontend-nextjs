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
import { CopyButton } from "../ui/CopyButton";
import { TablePagination } from "../ui/TablePagination";
import { MobileTableGrid } from "./MobileTableGrid";
import { Typography } from "../ui/Typography";
import EmptyState from "../common/EmptyState";
import HighlightedData from "./HighlightedData";
import styles from "@/app/styles/scrollbar.module.css";
import { MainContainer } from "../ui/MainContainer";
import { TabType, TableData } from "@/types/leaderboard";

// Re-add Column and MainTableProps interfaces, as they are not shared types
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface MainTableProps {
  activeTab: string;
  data?: TableData[];
  onViewProfile?: (address: string) => void;
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
    { key: "name", label: "Developer", sortable: true },
    { key: "address", label: "Address", sortable: false },
    { key: "totalJobs", label: "Total Jobs", sortable: true },
    { key: "taskPerformed", label: "Task Performed", sortable: true },
    { key: "points", label: "Points", sortable: true },
    { key: "profile", label: "Profile", sortable: false },
  ],
  contributor: [
    { key: "name", label: "Contributor", sortable: true },
    { key: "address", label: "Address", sortable: false },
    { key: "contributions", label: "Contributions", sortable: true },
    { key: "communityPoints", label: "Community Points", sortable: true },
    { key: "points", label: "Points", sortable: true },
    { key: "profile", label: "Profile", sortable: false },
  ],
};

export default function MainTable({
  activeTab = "keeper",
  data = [],
}: MainTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("points");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedItem, setSelectedItem] = useState<TableData | null>(
    data.length > 0 ? data[0] : null,
  );
  const itemsPerPage = 5;

  const columns = TAB_COLUMNS[activeTab as TabType] || [];

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAndPaginatedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
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
  }, [data, sortField, sortDirection, currentPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const handleRowClick = (item: TableData) => {
    setSelectedItem(item);
  };

  return (
    <>
      {selectedItem && (
        <div className="mb-6">
          <HighlightedData data={selectedItem} type={activeTab as TabType} />
        </div>
      )}

      {/* Desktop View */}
      <MainContainer
        className={`hidden md:block w-full overflow-auto whitespace-nowrap ${styles.customScrollbar}`}
      >
        {data.length === 0 ? (
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
                  className=""
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell className="px-6 py-4">
                    <Typography variant="body" color="primary" align="left">
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Typography
                        variant="body"
                        color="gray"
                        align="left"
                        className="font-mono"
                      >
                        {item.address}
                      </Typography>
                      <CopyButton text={item.address} />
                    </div>
                  </TableCell>
                  {columns.slice(2, -1).map((column) => (
                    <TableCell key={column.key} className="px-6 py-4">
                      <Typography
                        variant="body"
                        color="primary"
                        align="left"
                        className={
                          column.key === "points"
                            ? "bg-[#F8FF7C] px-3 py-1 rounded-full text-black w-[90px] text-center "
                            : ""
                        }
                      >
                        {column.key === "points"
                          ? Number(
                              item[column.key as keyof typeof item],
                            ).toFixed(2)
                          : item[column.key as keyof typeof item]}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell className="px-6 py-4">
                    <Typography
                      variant="body"
                      color="primary"
                      align="left"
                      className="underline underline-offset-2"
                    >
                      View
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </MainContainer>

      {/* Mobile View */}
      <MainContainer
        className={`md:hidden w-full overflow-auto ${styles.customScrollbar}`}
      >
        {data.length === 0 ? (
          <EmptyState type={activeTab as TabType} />
        ) : (
          <MobileTableGrid
            data={sortedAndPaginatedData}
            activeTab={activeTab as TabType}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onItemClick={handleRowClick}
          />
        )}
      </MainContainer>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
