import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  startIndex,
  endIndex,
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-6">
      <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} items
      </div>

      <div className="flex items-center justify-center space-x-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 rounded-none border border-dashed border-input px-2 text-xs text-foreground hover:bg-accent sm:h-9 sm:px-3 sm:text-sm"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page Numbers - hidden on very small screens, show compact on sm */}
        <div className="hidden sm:flex items-center space-x-1">
          {visiblePages.map((page, index) => {
            if (page === "...") {
              return (
                <Button
                  key={`dots-${index}`}
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 rounded-none border border-dashed border-input p-0 text-foreground sm:h-9 sm:w-9"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              );
            }

            const pageNumber = page as number;
            const isCurrentPage = currentPage === pageNumber;

            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNumber)}
                className={
                  isCurrentPage
                    ? "h-8 w-8 rounded-none bg-primary p-0 text-primary-foreground sm:h-9 sm:w-9"
                    : "h-8 w-8 rounded-none border border-dashed border-input p-0 text-foreground hover:bg-accent sm:h-9 sm:w-9"
                }
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Mobile: Page indicator */}
        <span className="sm:hidden px-2 text-xs text-muted-foreground">
          {currentPage} / {totalPages}
        </span>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 rounded-none border border-dashed border-input px-2 text-xs text-foreground hover:bg-accent sm:h-9 sm:px-3 sm:text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
}
