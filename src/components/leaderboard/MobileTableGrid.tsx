import React from "react";
import { LucideCopyButton } from "../ui/CopyButton";
import { Card } from "../ui/Card";
import { Typography } from "../ui/Typography";
import { TabType, TableData } from "@/types/leaderboard";

// Utility function to truncate Ethereum addresses
const truncateAddress = (address: string): string => {
  if (!address) return "";
  if (address.length < 10) return address;
  return `${address.slice(0, 5)}...${address.slice(-4)}`;
};

interface MobileTableGridProps {
  data: TableData[];
  activeTab: TabType;
  sortField: string;
  sortDirection: "asc" | "desc";
  onSort: (field: string) => void;
  onItemClick?: (item: TableData) => void;
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
    { key: "address", label: "Address", sortable: false },
    { key: "totalJobs", label: "Total Jobs", sortable: true },
    { key: "jobPerformed", label: "Job Performed", sortable: true },
    { key: "points", label: "Points", sortable: true },
  ],
  contributor: [],
};

export function MobileTableGrid({
  data,
  activeTab,
  onItemClick,
}: MobileTableGridProps) {
  const columns = TAB_COLUMNS[activeTab];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 ">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item)}
            className="cursor-pointer"
          >
            <Card className="p-3">
              <div className="grid grid-cols-1 gap-3 pt-2">
                <div className="flex justify-between items-center">
                  <Typography variant="h4" color="primary">
                    Address
                  </Typography>
                  <div className="flex justify-between items-center gap-2">
                    <Typography variant="body" color="gray" noWrap>
                      {truncateAddress(item.address)}
                    </Typography>
                    <LucideCopyButton text={item.address} />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="h4" color="primary">
                    Points
                  </Typography>
                  <Typography variant="body" color="gray">
                    {item.points.toFixed(2)}
                  </Typography>
                </div>
                {columns.slice(1, -1).map((column) => (
                  <div
                    key={column.key}
                    className="flex flex-row space-y-1 justify-between"
                  >
                    <Typography variant="body" color="primary">
                      {column.label}
                    </Typography>
                    <Typography variant="body" color="gray">
                      {item[column.key as keyof typeof item]}
                    </Typography>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
