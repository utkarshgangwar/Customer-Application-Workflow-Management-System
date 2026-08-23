"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled Application Crash:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f8fa] p-4">
      <div className="w-full max-w-md border border-[#d0d7de] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-bold text-red-700 uppercase">
          System Error
        </h2>
        <p className="text-xs text-gray-600 mt-2">
          {error.message || "An unexpected operational failure occurred."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 border border-[#d0d7de] bg-[#f6f8fa] px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
        >
          Reset Application
        </button>
      </div>
    </div>
  );
}
