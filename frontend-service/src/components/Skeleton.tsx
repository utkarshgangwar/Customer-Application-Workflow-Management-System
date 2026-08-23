export function TableRowSkeleton() {
  return (
    <div className="p-3 border-b border-[#d0d7de] animate-pulse space-y-2">
      <div className="flex justify-between items-center">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded w-16"></div>
      </div>
      <div className="h-2.5 bg-gray-200 rounded w-3/4"></div>
      <div className="flex justify-between">
        <div className="h-2 bg-gray-200 rounded w-20"></div>
        <div className="h-2 bg-gray-200 rounded w-24"></div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-4 bg-white border border-[#d0d7de] animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      <div className="border-t border-gray-100 pt-3 flex gap-2">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
}
