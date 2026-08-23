"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  limit?: number;
  loading?: boolean;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalCount,
  limit = 8,
  loading = false,
  onPageChange,
}: PaginationProps) {
  const startRecord = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 font-mono text-[11px]">
        {totalCount > 0
          ? `${startRecord}-${endRecord} of ${totalCount}`
          : "0 records"}
      </span>
      <button
        type="button"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        className="border border-[#d0d7de] px-2 py-0.5 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        ‹ Prev
      </button>
      <button
        type="button"
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        className="border border-[#d0d7de] px-2 py-0.5 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
      >
        Next ›
      </button>
    </div>
  );
}
