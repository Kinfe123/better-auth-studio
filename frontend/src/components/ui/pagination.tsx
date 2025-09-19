import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './button';

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
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
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
    <div className="flex items-center justify-between mt-6">
      <div className="text-sm text-gray-400">
        Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} items
      </div>

      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Page Numbers */}
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <Button
                key={`dots-${index}`}
                variant="outline"
                size="sm"
                disabled
                className="border border-dashed border-white/20 text-white rounded-none"
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
              variant={isCurrentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNumber)}
              className={
                isCurrentPage
                  ? 'bg-white text-black rounded-none'
                  : 'border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none'
              }
            >
              {pageNumber}
            </Button>
          );
        })}

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="border border-dashed border-white/20 text-white hover:bg-white/10 rounded-none"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
