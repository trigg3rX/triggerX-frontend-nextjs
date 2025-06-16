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
import { Card } from "../ui/Card";

// Data types for different tabs
interface BaseEntity {
  id: number;
  name: string;
  address: string;
  points: number;
}

interface KeeperData extends BaseEntity {
  jobPerformed: number;
  jobAttested: number;
}

interface DeveloperData extends BaseEntity {
  projectsCompleted: number;
  codeContributions: number;
  pullRequests: number;
}

interface ContributorData extends BaseEntity {
  contributions: number;
  communityPoints: number;
}

type TabType = "keeper" | "developer" | "contributor";
type TableData = KeeperData | DeveloperData | ContributorData;

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface MainTableProps {
  activeTab: TabType;
  data?: TableData[];
}

// Column configurations for each tab
const TAB_COLUMNS: Record<TabType, Column[]> = {
  keeper: [
    { key: "name", label: "Operator", sortable: true },
    { key: "address", label: "Address", sortable: false },
    { key: "jobPerformed", label: "Job Performed", sortable: true },
    { key: "jobAttested", label: "Job Attested", sortable: true },
    { key: "points", label: "Points", sortable: true },
    { key: "profile", label: "Profile", sortable: false },
  ],
  developer: [
    { key: "name", label: "Developer", sortable: true },
    { key: "address", label: "Address", sortable: false },
    { key: "projectsCompleted", label: "Projects", sortable: true },
    { key: "codeContributions", label: "Contributions", sortable: true },
    { key: "pullRequests", label: "Pull Requests", sortable: true },
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

// Sample data for each tab
const sampleData: Record<TabType, TableData[]> = {
  keeper: [
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
  ],
  developer: [
    {
      id: 1,
      name: "DevMaster",
      address: "0x1234...5678",
      projectsCompleted: 5,
      codeContributions: 120,
      pullRequests: 45,
      points: 1500.0,
    },
  ],
  contributor: [
    {
      id: 1,
      name: "CommunityHero",
      address: "0xabcd...efgh",
      contributions: 25,
      communityPoints: 800,
      points: 1000.0,
    },
  ],
};

export default function MainTable({
  activeTab = "keeper",
  data = sampleData[activeTab],
}: MainTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("points");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const itemsPerPage = 5;

  const columns = TAB_COLUMNS[activeTab];

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

  return (
    <>
      {/* Desktop View */}
      <Card className="hidden md:block w-full overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-gray-800/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className="text-gray-300 font-medium text-base h-14 px-6 cursor-pointer"
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
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
                className="border-gray-800 hover:bg-gray-800/30 transition-colors"
              >
                <TableCell className="px-6 py-4">
                  <div className="text-gray-200 font-medium text-base">
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono text-sm">
                      {item.address}
                    </span>
                    <CopyButton text={item.address} />
                  </div>
                </TableCell>
                {columns.slice(2, -1).map((column) => (
                  <TableCell key={column.key} className="px-6 py-4">
                    <span className="text-gray-300 text-base">
                      {item[column.key as keyof typeof item]}
                    </span>
                  </TableCell>
                ))}
                <TableCell className="px-6 py-4">
                  <button className="text-gray-300 hover:text-white font-medium text-base underline underline-offset-2 transition-colors">
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile View */}
      <div className="md:hidden">
        <MobileTableGrid
          data={sortedAndPaginatedData}
          activeTab={activeTab}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
