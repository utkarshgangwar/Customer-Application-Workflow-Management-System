import { Suspense } from "react";
import Header from "@/components/Header";
import ApplicationClient from "./ApplicationClient";
import { TableRowSkeleton } from "@/components/Skeleton";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <Header />
      <Suspense
        fallback={
          <div className="flex flex-1">
            <div className="w-1/3 border-r border-[#d0d7de] bg-white p-2">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
            <div className="w-2/3 p-4 text-xs text-gray-500">
              Loading operational workspace...
            </div>
          </div>
        }
      >
        <ApplicationClient />
      </Suspense>
    </div>
  );
}
