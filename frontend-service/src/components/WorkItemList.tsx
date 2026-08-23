"use client";

import { useState } from "react";
import { apiClient } from "@/lib/fetchClient";
import { WorkItem } from "@/types";

interface WorkItemListProps {
  workItems: WorkItem[];
  customerId?: string;
  onToggle: (itemId: string, currentStatus: string) => void;
  onRefresh: () => void;
}

// Fallback gracefully if the environment variable is not explicitly loaded
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function WorkItemList({
  workItems,
  customerId,
  onToggle,
  onRefresh,
}: WorkItemListProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!file) return;
    setUploadingId(itemId);

    const formData = new FormData();
    formData.append("file", file);
    if (customerId) formData.append("customerId", customerId);

    try {
      // 1. Upload document archive
      const docRes = await apiClient("/documents/upload", {
        method: "POST",
        body: formData,
      });

      // 2. Attach uploaded file to work item
      await apiClient(`/work-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({
          attachmentId: docRes.data._id,
          status: "COMPLETED",
        }),
      });

      onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to upload document");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="border border-[#d0d7de] bg-white p-4 space-y-3">
      <div className="flex justify-between items-center border-b border-[#d0d7de] pb-2">
        <h3 className="text-xs font-bold text-gray-900 uppercase">
          Required Stage Work Items ({workItems.length})
        </h3>
        <span className="text-[10px] text-gray-400 font-mono">
          {workItems.filter((i) => i.status === "COMPLETED").length} /{" "}
          {workItems.length} Done
        </span>
      </div>

      {workItems.length === 0 ? (
        <div className="text-xs text-gray-400 italic py-2">
          No work items generated for this docket yet.
        </div>
      ) : (
        <div className="space-y-2">
          {workItems.map((item) => (
            <div
              key={item._id}
              className={`border p-2.5 flex items-center justify-between transition-colors ${
                item.status === "COMPLETED"
                  ? "bg-gray-50/70 border-gray-200"
                  : "bg-white border-[#d0d7de]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={item.status === "COMPLETED"}
                  onChange={() => onToggle(item._id, item.status)}
                  className="cursor-pointer"
                />
                <div>
                  <div
                    className={`text-xs ${
                      item.status === "COMPLETED"
                        ? "line-through text-gray-400"
                        : "font-semibold text-gray-900"
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    Stage: {item.stageName} (Order #{item.stageOrderNumber})
                  </div>
                </div>
              </div>

              {/* Document File / Upload Actions */}
              <div className="flex items-center gap-2">
                {item.attachmentId ? (
                  <a
                    href={`${BACKEND_URL}${item.attachmentId.fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-mono font-semibold text-blue-700 hover:underline flex items-center gap-1"
                  >
                    📎 {item.attachmentId.name}
                  </a>
                ) : (
                  <label className="border border-[#d0d7de] bg-white px-2 py-0.5 text-[10px] hover:bg-gray-50 cursor-pointer font-medium text-gray-700">
                    {uploadingId === item._id ? "Uploading..." : "Attach File"}
                    <input
                      type="file"
                      className="hidden"
                      disabled={uploadingId === item._id}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(item._id, file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
