import React from "react";
import { ChevronRight } from "lucide-react";
import { Typography } from "./Typography";
import { cn } from "@/lib/utils";
import { Dropdown, type DropdownOption } from "./Dropdown";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  itemsPerPageOptions?: number[];
  className?: string;
  totalItems?: number; // Added to help determine when to show pagination
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 20, 50, 100],
  className = "",
}) => {
  const itemsPerPageOptionsList = itemsPerPageOptions.map((option) => ({
    id: option.toString(),
    name: option.toString(),
  }));

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (option: DropdownOption) => {
    onItemsPerPageChange(Number(option.id));
  };

  const PaginationButton = ({
    onClick,
    disabled,
    children,
    className = "",
    isNavButton = false,
  }: {
    onClick: () => void;
    disabled: boolean;
    children: React.ReactNode;
    className?: string;
    isNavButton?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center py-2 px-3 sm:px-4 rounded-md transition-colors min-w-[40px]",
        "text-foreground border border-white/10 hover:bg-white/10",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
        isNavButton && "hidden sm:flex", // Hide nav buttons on mobile
        className,
      )}
      aria-label={typeof children === "string" ? children : undefined}
    >
      {children}
    </button>
  );

  // Mobile pagination controls (simplified for small screens)
  const MobilePagination = () => (
    <div className="flex items-center gap-2 md:hidden w-full">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex-1 flex items-center justify-center py-2 px-3 rounded-md border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronRight className="w-4 h-4 transform rotate-180" />
      </button>

      <div className="flex-1 text-center py-2 px-3 bg-white/5 rounded-md">
        <Typography variant="body" className="text-foreground">
          {currentPage} / {totalPages}
        </Typography>
      </div>

      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex-1 flex items-center justify-center py-2 px-3 rounded-md border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Pagination */}
      <MobilePagination />

      {/* Desktop Pagination */}
      <div className="hidden md:flex flex-col md:flex-row items-center justify-between gap-4 mt-6 w-full">
        {/* Rows per page selector */}
        <div className="flex items-center gap-2">
          <Typography
            variant="body"
            color="secondary"
            className="whitespace-nowrap"
          >
            Show rows:
          </Typography>
          <div className="w-20">
            <Dropdown
              options={itemsPerPageOptionsList}
              selectedOption={itemsPerPage.toString()}
              onChange={handleItemsPerPageChange}
              className="gap-0 w-full md:w-20 "
            />
          </div>
        </div>

        {/* Desktop Pagination controls */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <PaginationButton
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            isNavButton
          >
            First
          </PaginationButton>

          <PaginationButton
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            isNavButton
          >
            <ChevronRight className="w-4 h-4 transform rotate-180" />
          </PaginationButton>

          <div className="mx-2 flex items-center gap-1">
            <Typography
              variant="body"
              className="text-foreground/80 hidden sm:block"
            >
              Page
            </Typography>
            <Typography variant="body" className="font-medium text-foreground">
              {currentPage}
            </Typography>
            <Typography variant="body" className="text-foreground/80">
              of
            </Typography>
            <Typography variant="body" className="text-foreground">
              {totalPages}
            </Typography>
          </div>

          <PaginationButton
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            isNavButton
          >
            <ChevronRight className="w-4 h-4" />
          </PaginationButton>

          <PaginationButton
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage >= totalPages}
            isNavButton
          >
            Last
          </PaginationButton>
        </div>
      </div>
    </div>
  );
};

export { Pagination };

export type { PaginationProps };
