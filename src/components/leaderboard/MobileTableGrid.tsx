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

export function MobileTableGrid({
  data,
  activeTab,
  onItemClick,
}: MobileTableGridProps) {
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
                {/* Address */}
                <div className="flex justify-between items-center">
                  <Typography variant="body" color="primary">
                    Address
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Typography variant="body" color="gray" noWrap>
                      {truncateAddress(item.address)}
                    </Typography>
                    <LucideCopyButton text={item.address} className="!p-0" />
                  </div>
                </div>
                {/* Points */}
                <div className="flex justify-between items-center">
                  <Typography variant="body" color="primary">
                    Points
                  </Typography>
                  <Typography variant="body" color="gray">
                    {item.points?.toFixed(2) ?? 0}
                  </Typography>
                </div>
                {/* Tab-specific fields */}
                {activeTab === "keeper" &&
                  "jobPerformed" in item &&
                  "jobAttested" in item && (
                    <>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Job Performed
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.jobPerformed ?? 0}
                        </Typography>
                      </div>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Job Attested
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.jobAttested ?? 0}
                        </Typography>
                      </div>
                    </>
                  )}
                {activeTab === "developer" &&
                  "totalJobs" in item &&
                  "taskPerformed" in item && (
                    <>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Total Jobs
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.totalJobs ?? 0}
                        </Typography>
                      </div>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Task Performed
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.taskPerformed ?? 0}
                        </Typography>
                      </div>
                    </>
                  )}
                {activeTab === "contributor" &&
                  "contributions" in item &&
                  "communityPoints" in item && (
                    <>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Contributions
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.contributions ?? 0}
                        </Typography>
                      </div>
                      <div className="flex justify-between items-center">
                        <Typography variant="body" color="primary">
                          Community Points
                        </Typography>
                        <Typography variant="body" color="gray">
                          {item.communityPoints ?? 0}
                        </Typography>
                      </div>
                    </>
                  )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}
