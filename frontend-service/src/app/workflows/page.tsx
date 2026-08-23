"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { apiClient } from "@/lib/fetchClient";
import { TableRowSkeleton } from "@/components/Skeleton";
import CreateWorkflowModal from "@/components/CreateWorkflowModal";
import Cookies from "js-cookie";
import { Workflow, User } from "@/types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    const raw = Cookies.get("user");
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await apiClient("/workflows");
      setWorkflows(res.data);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <Header />

      {/* Action Bar */}
      <div className="border-b border-[#d0d7de] bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="border border-[#2da44e] bg-[#2da44e] text-white px-2.5 py-1 text-xs font-semibold hover:bg-[#2c974b]"
            >
              + Create Workflow
            </button>
          )}
          <span className="font-bold text-gray-900 text-xs uppercase tracking-tight">
            Workflow Service Blueprints
          </span>
        </div>
        <div className="text-[11px] text-gray-500 font-mono">
          Total: {workflows.length} Service Templates
        </div>
      </div>

      {/* Blueprints Display */}
      <div className="p-4 flex-1 overflow-auto space-y-3">
        {loading ? (
          <div className="border border-[#d0d7de] bg-white p-3 space-y-2">
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        ) : workflows.length === 0 ? (
          <div className="border border-[#d0d7de] bg-white p-8 text-center text-xs text-gray-500">
            No workflows found in system.
          </div>
        ) : (
          workflows.map((wf) => (
            <div
              key={wf._id}
              className="border border-[#d0d7de] bg-white p-4 space-y-3 shadow-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{wf.name}</h3>
                  <span className="text-[10px] font-mono text-gray-400">
                    ID: {wf._id}
                  </span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 border border-blue-200 bg-blue-50 text-blue-800 uppercase font-bold">
                  {wf.stages?.length || 0} Stages
                </span>
              </div>

              {/* Stage Progression Visual Pipeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                {wf.stages?.map((stg) => {
                  const tasks = stg.workRequired || (stg as any).work || [];
                  return (
                    <div
                      key={stg.name}
                      className="border border-[#e1e4e8] bg-[#fafbfc] p-2.5 space-y-1.5"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-gray-800 border-b border-gray-200 pb-1">
                        <span>
                          {stg.orderNumber}. {stg.name}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-500">
                        Transitions to:{" "}
                        <span className="font-mono text-blue-700 font-semibold">
                          {stg.allowedTransitions?.join(", ") || "None"}
                        </span>
                      </div>
                      <div className="text-[9px] text-gray-700">
                        Tasks:{" "}
                        <span className="text-gray-600">
                          {tasks.length > 0
                            ? tasks
                                .map((w: any) =>
                                  typeof w === "string" ? w : w.title || w.name,
                                )
                                .join(", ")
                            : "No specific stage tasks"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateWorkflowModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchWorkflows}
      />
    </div>
  );
}
