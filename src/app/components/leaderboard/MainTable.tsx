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
import { ChevronDownIcon, CopyIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/Pagination";
import { useState, useMemo } from "react";
// import { Button } from "@/components/ui/button";

// Data type matching your table structure
interface Operator {
  id: number;
  name: string;
  address: string;
  jobPerformed: number;
  jobAttested: number;
  points: number;
}

// Sample data matching your image
const operatorData: Operator[] = [
  {
    id: 1,
    name: "ITRocket",
    address: "0xfee8f29af67cb...5dc7",
    jobPerformed: 0,
    jobAttested: 0,
    points: 1360.0,
  },
  {
    id: 2,
    name: "Genznodes",
    address: "0x19abadfbb70e6...2667",
    jobPerformed: 1,
    jobAttested: 0,
    points: 1360.0,
  },
  {
    id: 3,
    name: "EigenYields",
    address: "0x5acce90436492...676d",
    jobPerformed: 2,
    jobAttested: 0,
    points: 1360.0,
  },
  {
    id: 4,
    name: "Staking4All",
    address: "0xc511461589b32...e113",
    jobPerformed: 3,
    jobAttested: 0,
    points: 1360.0,
  },
  {
    id: 5,
    name: "nairetestnet",
    address: "0x47f1dffd865cf...f1b3",
    jobPerformed: 4,
    jobAttested: 0,
    points: 1320.0,
  },
  {
    id: 6,
    name: "Node.Monster",
    address: "0x0905a5e6dab3e...41a7",
    jobPerformed: 5,
    jobAttested: 0,
    points: 1240.0,
  },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export default function MainTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof Operator>("points");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 5;

  const handleSort = (field: keyof Operator) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedAndPaginatedData = useMemo(() => {
    const sorted = [...operatorData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDirection === "asc"
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [operatorData, sortField, sortDirection, currentPage]);

  const totalPages = Math.ceil(operatorData.length / itemsPerPage);

  return (
    <div className="w-full bg-gray-900 rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-800 hover:bg-gray-800/50">
            <TableHead
              className="text-gray-300 font-medium text-base h-14 px-6 cursor-pointer"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-1">
                Operator
                {sortField === "name" && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`}
                  />
                )}
              </div>
            </TableHead>
            <TableHead className="text-gray-300 font-medium text-base h-14 px-6">
              Address
            </TableHead>
            <TableHead
              className="text-gray-300 font-medium text-base h-14 px-6 cursor-pointer"
              onClick={() => handleSort("jobPerformed")}
            >
              <div className="flex items-center gap-1">
                Job Performed
                {sortField === "jobPerformed" && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`}
                  />
                )}
              </div>
            </TableHead>
            <TableHead
              className="text-gray-300 font-medium text-base h-14 px-6 cursor-pointer"
              onClick={() => handleSort("jobAttested")}
            >
              <div className="flex items-center gap-1">
                Job Attested
                {sortField === "jobAttested" && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`}
                  />
                )}
              </div>
            </TableHead>
            <TableHead
              className="text-gray-300 font-medium text-base h-14 px-6 cursor-pointer"
              onClick={() => handleSort("points")}
            >
              <div className="flex items-center gap-1">
                Points
                {sortField === "points" && (
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${sortDirection === "asc" ? "rotate-180" : ""}`}
                  />
                )}
              </div>
            </TableHead>
            <TableHead className="text-gray-300 font-medium text-base h-14 px-6">
              Profile
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAndPaginatedData.map((operator) => (
            <TableRow
              key={operator.id}
              className="border-gray-800 hover:bg-gray-800/30 transition-colors"
            >
              <TableCell className="px-6 py-4">
                <div className="text-gray-200 font-medium text-base">
                  {operator.name}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-mono text-sm">
                    {operator.address}
                  </span>
                  <button
                    onClick={() => copyToClipboard(operator.address)}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <span className="text-gray-300 text-base">
                  {operator.jobPerformed}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4">
                <span className="text-gray-300 text-base">
                  {operator.jobAttested}
                </span>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold text-sm min-w-[80px] justify-center">
                  {operator.points.toFixed(2)}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <button className="text-gray-300 hover:text-white font-medium text-base underline underline-offset-2 transition-colors">
                  View
                </button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-center py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
