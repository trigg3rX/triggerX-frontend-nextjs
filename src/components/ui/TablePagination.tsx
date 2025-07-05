import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/metaUrl";
import { ActionButton } from "./ActionButton";
import { useEffect, useState } from "react";

// Base Pagination Components
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-3", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
  onClick?: () => void;
  text: string;
  className?: string;
};

const PaginationLink = ({
  className,
  isActive,
  onClick,
  text,
  ...props
}: PaginationLinkProps) => (
  <ActionButton
    variant={isActive ? "paginationActive" : "paginationInactive"}
    size="sm"
    className={className}
    onClick={onClick}
    text={text}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  onClick,
  ...props
}: Omit<PaginationLinkProps, "text" | "isActive">) => (
  <ActionButton
    variant="paginationArrow"
    size="sm"
    className={className}
    icon={<ChevronLeft />}
    text=""
    onClick={onClick}
    {...props}
  />
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  onClick,
  ...props
}: Omit<PaginationLinkProps, "text" | "isActive">) => (
  <ActionButton
    variant="paginationArrow"
    size="sm"
    className={className}
    icon={<ChevronRight />}
    text=""
    onClick={onClick}
    {...props}
  />
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className }: { className?: string }) => (
  <ActionButton
    variant="paginationEllipsis"
    size="sm"
    className={className}
    text={"..."}
    disabled
  />
);
PaginationEllipsis.displayName = "PaginationEllipsis";

// Table Pagination Component
interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: TablePaginationProps) {
  const isMobile = useIsMobile();

  if (totalPages <= 1) {
    return null;
  }

  if (isMobile) {
    // Mobile: Only show prev/next and current page
    return (
      <div className={`flex justify-center py-4 ${className}`}>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  onPageChange(Math.min(totalPages, currentPage + 1))
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
    );
  }

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => onPageChange(i)}
            isActive={currentPage === i}
            text={i.toString()}
          />
        </PaginationItem>,
      );
    }

    return pages;
  };

  return (
    <div className={`flex justify-center py-4 ${className}`}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>
          {renderPageNumbers()}
          <PaginationItem>
            <PaginationNext
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
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
  );
}

// Export all components
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
