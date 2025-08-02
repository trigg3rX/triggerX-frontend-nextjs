import React from "react";
import Skeleton from "../ui/Skeleton";
import { Card } from "../ui/Card";
import {
  Table,
  TableHeader,
  TableRow,
  TableBody,
  TableHead,
  TableCell,
} from "../leaderboard/Table";

const JobLogsSkeleton: React.FC = () => {
  // Skeleton for desktop/tablet view
  const DesktopSkeleton = () => (
    <div className="hidden md:block w-full">
      <div className="h-8 w-32 mb-4">Job Logs</div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {["ID", "Timestamp", "Status", "TG Used", "Tx Hash"].map(
                (header, i) => (
                  <TableHead key={i}>
                    <div className="h-4 w-20"></div>
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(5)].map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <div className="h-2 w-24"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  // Skeleton for mobile view
  const MobileSkeleton = () => (
    <div className="md:hidden w-full">
      <div className="h-8 w-32 mb-4">Job Logs</div>
      <div className="space-y-4">
        {[...Array(1)].map((_, index) => (
          <Card key={index} className="p-4">
            <div className="space-y-3">
              {["ID", "Timestamp", "Status", "TG Used", "Tx Hash"].map(
                (label, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="w-full">
                      <Skeleton className="w-full h-full" />
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <DesktopSkeleton />
      <MobileSkeleton />
    </div>
  );
};

export default JobLogsSkeleton;
