import React from "react";
import { TableRow, TableCell } from "../leaderboard/Table";
import Skeleton from "./Skeleton";

interface TableSkeletonProps {
  columns: Array<{ key: string; label: string; sortable: boolean }>;
  rows?: number;
}

const TableSkeletonRow: React.FC<{
  columns: TableSkeletonProps["columns"];
}> = ({ columns }) => (
  <TableRow className="text-nowrap animate-pulse">
    {columns.map((column, idx) => (
      <TableCell
        key={column.key}
        className={`px-6 py-4 ${idx === 0 ? "border-l-4 border-gray-700" : ""}`}
      >
        <div className="flex items-center gap-2">
          <Skeleton
            width="96px"
            height="16px"
            borderRadius="4px"
            className="bg-gray-700"
          />
          {column.key === "keeper_address" && (
            <Skeleton
              width="24px"
              height="24px"
              borderRadius="4px"
              className="bg-gray-700"
            />
          )}
        </div>
      </TableCell>
    ))}
  </TableRow>
);

const TableSkeleton: React.FC<TableSkeletonProps> = ({
  columns,
  rows = 10,
}) => (
  <>
    {Array.from({ length: rows }).map((_, idx) => (
      <TableSkeletonRow key={idx} columns={columns} />
    ))}
  </>
);

export default TableSkeleton;
