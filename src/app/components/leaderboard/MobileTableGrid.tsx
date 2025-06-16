import React from "react";
import { CopyButton } from "../ui/CopyButton";

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

interface MobileTableGridProps {
  data: TableData[];
  activeTab: TabType;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
}

const TAB_COLUMNS: Record<
  TabType,
  { key: string; label: string; sortable?: boolean }[]
> = {
  keeper: [
    { key: "name", label: "Operator", sortable: true },
    { key: "jobPerformed", label: "Job Performed", sortable: true },
    { key: "jobAttested", label: "Job Attested", sortable: true },
    { key: "points", label: "Points", sortable: true },
  ],
  developer: [
    { key: "name", label: "Developer", sortable: true },
    { key: "projectsCompleted", label: "Projects", sortable: true },
    { key: "codeContributions", label: "Contributions", sortable: true },
    { key: "pullRequests", label: "Pull Requests", sortable: true },
    { key: "points", label: "Points", sortable: true },
  ],
  contributor: [
    { key: "name", label: "Contributor", sortable: true },
    { key: "contributions", label: "Contributions", sortable: true },
    { key: "communityPoints", label: "Community Points", sortable: true },
    { key: "points", label: "Points", sortable: true },
  ],
};

export function MobileTableGrid({ data, activeTab }: MobileTableGridProps) {
  const columns = TAB_COLUMNS[activeTab];

  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      {data.map((item) => (
        <div
          key={item.id}
          className="bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-700"
        >
          {/* Header with Name and Points */}
          <div className="flex justify-between items-center">
            <div className="text-gray-200 font-medium text-base">
              {item.name}
            </div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-400 text-black font-semibold text-sm min-w-[80px] justify-center">
              {item.points.toFixed(2)}
            </div>
          </div>

          {/* Address with Copy Button */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-mono text-sm truncate">
              {item.address}
            </span>
            <CopyButton text={item.address} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {columns.slice(1, -1).map((column) => (
              <div key={column.key} className="flex flex-col space-y-1">
                <div className="text-gray-400 text-xs">{column.label}</div>
                <div className="text-gray-200 text-sm">
                  {item[column.key as keyof typeof item]}
                </div>
              </div>
            ))}
          </div>

          {/* View Profile Button */}
          <div className="pt-2">
            <button className="w-full text-gray-300 hover:text-white font-medium text-sm underline underline-offset-2 transition-colors">
              View Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
