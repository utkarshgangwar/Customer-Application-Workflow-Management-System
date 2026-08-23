"use client";

import { useState } from "react";
import { CustomerApplication, User } from "@/types";

interface DocketHeaderProps {
  app: CustomerApplication;
  currentUser?: User | null;
  allowedTransitions: string[];
  actionLoading: boolean;
  hasPendingCurrentStageTasks: boolean;
  pendingCount: number;
  onStatusChange: (status: string) => void;
  onStageChange: (stage: string, remarks?: string) => void;
}

export default function DocketHeader({
  app,
  currentUser,
  allowedTransitions,
  actionLoading,
  hasPendingCurrentStageTasks,
  pendingCount,
  onStatusChange,
  onStageChange,
}: DocketHeaderProps) {
  const [pendingStageTransition, setPendingStageTransition] = useState<
    string | null
  >(null);
  const [remarks, setRemarks] = useState("");

  const isManagerOrAdmin =
    currentUser?.role === "admin" || currentUser?.role === "manager";

  const handleOpenModal = (stage: string) => {
    setRemarks("");
    setPendingStageTransition(stage);
  };

  const handleConfirmTransition = () => {
    if (pendingStageTransition) {
      onStageChange(pendingStageTransition, remarks);
      setPendingStageTransition(null);
      setRemarks("");
    }
  };

  return (
    <>
      <div className="border border-[#d0d7de] bg-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-gray-400">
                ID: {app._id}
              </span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  app.status === "ACTIVE"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : app.status === "ON_HOLD"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {app.status}
              </span>
            </div>

            <h2 className="text-sm font-bold text-gray-900 mt-0.5">
              {app.title}
            </h2>

            <div className="text-xs text-gray-600 mt-1">
              Customer: <b className="text-gray-900">{app.customerId?.name}</b>{" "}
              ({app.customerId?.email} | {app.customerId?.mobile?.code}{" "}
              {app.customerId?.mobile?.num})
            </div>

            {/* Assigned Staff Info */}
            <div className="text-[11px] text-gray-500 mt-0.5">
              Assigned Staff:{" "}
              <span className="font-semibold text-gray-800">
                {app.assignedTo ? app.assignedTo.name : "Unassigned"}
              </span>
            </div>
          </div>

          {/* Operational Status Actions (Admin & Manager Only) */}
          {isManagerOrAdmin && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onStatusChange("ACTIVE")}
                disabled={actionLoading || app.status === "ACTIVE"}
                className="border border-[#d0d7de] px-2 py-0.5 text-xs bg-white hover:bg-gray-100 disabled:opacity-40"
              >
                Active
              </button>
              <button
                onClick={() => onStatusChange("ON_HOLD")}
                disabled={actionLoading || app.status === "ON_HOLD"}
                className="border border-[#d0d7de] px-2 py-0.5 text-xs bg-white text-amber-700 hover:bg-amber-50 disabled:opacity-40"
              >
                Hold
              </button>
              <button
                onClick={() => onStatusChange("CANCELLED")}
                disabled={actionLoading || app.status === "CANCELLED"}
                className="border border-[#d0d7de] px-2 py-0.5 text-xs bg-white text-red-700 hover:bg-red-50 disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Stage Progression Controller */}
        <div className="mt-4 border-t border-[#d0d7de] pt-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-gray-500 uppercase">
              Current Stage:{" "}
              <span className="text-blue-700 font-bold">
                {app.currentStage}
              </span>{" "}
              (Ver: {app.version})
            </div>
            {hasPendingCurrentStageTasks && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                ⚠️ {pendingCount} incomplete task{pendingCount > 1 ? "s" : ""}{" "}
                in this stage
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-gray-500">Move To:</span>
            {allowedTransitions.length === 0 ? (
              <span className="text-xs text-gray-400 italic">
                No further transitions allowed.
              </span>
            ) : (
              allowedTransitions.map((stg) => (
                <button
                  key={stg}
                  disabled={actionLoading || hasPendingCurrentStageTasks}
                  onClick={() => handleOpenModal(stg)}
                  title={
                    hasPendingCurrentStageTasks
                      ? "Complete all tasks for this stage before transitioning"
                      : `Move to ${stg}`
                  }
                  className="border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-blue-50 disabled:hover:text-blue-700"
                >
                  → {stg}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation & Remarks Modal */}
      {pendingStageTransition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border border-[#d0d7de] bg-white p-5 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#d0d7de] pb-2 mb-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                Confirm Stage Transition
              </h3>
              <button
                onClick={() => setPendingStageTransition(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700">
              <p>
                Are you sure you want to transition this application to{" "}
                <b className="font-mono text-blue-700 uppercase">
                  {pendingStageTransition}
                </b>
                ?
              </p>

              <div className="bg-[#f6f8fa] border border-[#d0d7de] p-2 text-[11px] font-mono text-gray-600">
                <div>From: {app.currentStage}</div>
                <div>To: {pendingStageTransition}</div>
              </div>

              {/* Remarks Textarea */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Transition Remarks / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified passport, IELTS score satisfactory, proceeding to next phase."
                  className="w-full border border-[#d0d7de] p-1.5 text-xs text-gray-900 bg-white outline-none focus:border-blue-600"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
              <button
                type="button"
                onClick={() => setPendingStageTransition(null)}
                disabled={actionLoading}
                className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                disabled={actionLoading}
                className="border border-blue-600 bg-blue-600 px-3 py-1 text-white font-semibold hover:bg-blue-700 text-xs disabled:opacity-50"
              >
                {actionLoading ? "Transitioning..." : "Confirm & Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
