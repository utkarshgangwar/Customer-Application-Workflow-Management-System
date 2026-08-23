"use client";

import GenericList from "./GenericList";
import StatusBadge from "./StatusBadge";
import { CustomerApplication } from "@/types";

interface ApplicationListProps {
  applications: CustomerApplication[];
  selectedAppId?: string | null;
  onSelect: (id: string) => void;
}

export default function ApplicationList({
  applications,
  selectedAppId,
  onSelect,
}: ApplicationListProps) {
  return (
    <GenericList
      items={applications}
      selectedId={selectedAppId}
      getId={(app) => app._id}
      emptyMessage="No application dockets found."
      zebra={true}
      onSelect={(app) => onSelect(app._id)}
      renderItem={(app) => (
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-gray-900 line-clamp-1">
              {app.title}
            </span>
            <StatusBadge status={app.status} type="status" />
          </div>

          <div className="flex justify-between items-center text-[11px] text-gray-600">
            <span>{app.customerId?.name || "Unknown Customer"}</span>
            <StatusBadge status={app.currentStage} type="stage" />
          </div>

          <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
            <span>Assigned: {app.assignedTo?.name || "Unassigned"}</span>
            <span>Ver: {app.version}</span>
          </div>
        </div>
      )}
    />
  );
}
