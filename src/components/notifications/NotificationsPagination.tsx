"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface NotificationsPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  tab: string;
}

export function NotificationsPagination({
  currentPage,
  totalCount,
  pageSize,
  tab,
}: NotificationsPaginationProps) {
  const router = useRouter();
  const totalPages = Math.ceil(totalCount / pageSize);

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("page", page.toString());
    router.push(`/notifications?${params.toString()}`);
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

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
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        {totalCount}件中 {(currentPage - 1) * pageSize + 1}件から{" "}
        {Math.min(currentPage * pageSize, totalCount)}件を表示
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>

        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page) => (
            <div
              key={
                page === "..." ? `ellipsis-${Math.random()}` : `page-${page}`
              }
            >
              {page === "..." ? (
                <span className="px-2 py-1 text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => navigateToPage(page as number)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
