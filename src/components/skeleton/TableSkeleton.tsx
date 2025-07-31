"use client";

import * as React from "react";
import { Table, TableBody, TableCell, TableRow } from "../leaderboard/Table";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <Table>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex} className="animate-pulse">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex} className="px-6 py-4">
                <div
                  className={cn(
                    "h-4 bg-gray-700 rounded",
                    colIndex === 0 ? "w-1/2" : "w-3/4",
                    colIndex === columns - 1 && "w-6",
                  )}
                />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
