"use client";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "role" | "stage";
}

export default function StatusBadge({
  status,
  type = "status",
}: StatusBadgeProps) {
  const normalized = status?.toUpperCase() || "";

  const getStyle = () => {
    switch (normalized) {
      // Docket / WorkItem Statuses
      case "ACTIVE":
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "PENDING":
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "ON_HOLD":
      case "WAITING_FOR_INFO":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "CANCELLED":
      case "FAILED":
      case "BLOCKED":
        return "bg-red-50 text-red-700 border-red-200";

      // User Roles
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "EXECUTIVE":
        return "bg-gray-100 text-gray-800 border-gray-300";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <span
      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase inline-flex items-center ${getStyle()}`}
    >
      {status}
    </span>
  );
}
