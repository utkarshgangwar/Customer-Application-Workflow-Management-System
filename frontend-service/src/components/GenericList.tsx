"use client";

import { ReactNode } from "react";
import { TableRowSkeleton } from "./Skeleton";

interface GenericListProps<T> {
  items: T[];
  selectedId?: string | null;
  getId: (item: T) => string;
  renderItem: (item: T, isSelected: boolean) => ReactNode;
  onSelect: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  zebra?: boolean;
}

export default function GenericList<T>({
  items,
  selectedId,
  getId,
  renderItem,
  onSelect,
  loading = false,
  emptyMessage = "No records found.",
  zebra = true,
}: GenericListProps<T>) {
  if (loading) {
    return (
      <div className="divide-y divide-[#d0d7de]">
        <TableRowSkeleton />
        <TableRowSkeleton />
        <TableRowSkeleton />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#d0d7de]">
      {items.map((item, index) => {
        const id = getId(item);
        const isSelected = selectedId === id;

        // Gray-white alternating background pattern
        const zebraBg = zebra
          ? index % 2 === 0
            ? "bg-white"
            : "bg-[#f6f8fa]"
          : "bg-white";

        return (
          <div
            key={id}
            onClick={() => onSelect(item)}
            className={`p-3 cursor-pointer transition-colors border-l-4 ${
              isSelected
                ? "bg-blue-50/80 border-l-blue-600"
                : `${zebraBg} border-l-transparent hover:bg-gray-100/70`
            }`}
          >
            {renderItem(item, isSelected)}
          </div>
        );
      })}
    </div>
  );
}
