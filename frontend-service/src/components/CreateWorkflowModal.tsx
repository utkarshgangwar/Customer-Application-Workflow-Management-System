"use client";

import { useState } from "react";
import { apiClient } from "@/lib/fetchClient";

interface StageDraft {
  name: string;
  orderNumber: number;
  allowedTransitionsText: string;
  tasksText: string;
}

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateWorkflowModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWorkflowModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState<StageDraft[]>([
    {
      name: "DOCUMENTATION_STAGE",
      orderNumber: 1,
      allowedTransitionsText: "VERIFICATION_STAGE, CANCELLED",
      tasksText: "Collect Identity Proof, Educational Transcripts",
    },
    {
      name: "VERIFICATION_STAGE",
      orderNumber: 2,
      allowedTransitionsText: "COMPLETED, DOCUMENTATION_STAGE",
      tasksText: "Police Clearance Check, Financial Verification",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleAddStage = () => {
    setStages((prev) => [
      ...prev,
      {
        name: `STAGE_${prev.length + 1}`,
        orderNumber: prev.length + 1,
        allowedTransitionsText: "COMPLETED",
        tasksText: "",
      },
    ]);
  };

  const handleRemoveStage = (index: number) => {
    setStages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleStageChange = (
    index: number,
    field: keyof StageDraft,
    value: string | number,
  ) => {
    setStages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payloadStages = stages.map((s, idx) => ({
        name: s.name.trim().toUpperCase(),
        orderNumber: Number(s.orderNumber) || idx + 1,
        allowedTransitions: s.allowedTransitionsText
          .split(",")
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean),
        workRequired: s.tasksText
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((title) => ({ workType: "TASK", title })),
      }));

      await apiClient("/workflows", {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          stages: payloadStages,
        }),
      });

      // Reset form
      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create workflow template.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl border border-[#d0d7de] bg-white p-5 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-[#d0d7de] pb-2 mb-3">
          <h2 className="text-xs font-bold text-gray-900 uppercase">
            Design Workflow Blueprint
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. UK Skilled Worker Visa Process"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="Standard end-to-end operational pipeline for skilled migration"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white"
            />
          </div>

          {/* Dynamic Stage Designer */}
          <div className="border border-[#d0d7de] p-3 bg-[#f6f8fa] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-900 uppercase text-[11px]">
                Stage Pipeline Setup ({stages.length})
              </span>
              <button
                type="button"
                onClick={handleAddStage}
                className="border border-[#d0d7de] bg-white px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-gray-100"
              >
                + Add Stage
              </button>
            </div>

            {stages.map((stg, index) => (
              <div
                key={index}
                className="border border-[#e1e4e8] bg-white p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[10px] text-gray-500 uppercase">
                    Stage #{index + 1}
                  </span>
                  {stages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStage(index)}
                      className="text-red-600 text-[10px] hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Stage Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={stg.name}
                      onChange={(e) =>
                        handleStageChange(index, "name", e.target.value)
                      }
                      className="w-full border border-[#d0d7de] p-1 bg-white outline-none font-mono uppercase text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                      Order No.
                    </label>
                    <input
                      type="number"
                      value={stg.orderNumber}
                      onChange={(e) =>
                        handleStageChange(
                          index,
                          "orderNumber",
                          Number(e.target.value),
                        )
                      }
                      className="w-full border border-[#d0d7de] p-1 bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                    Allowed Target Transitions (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. STAGE_2, CANCELLED, COMPLETED"
                    value={stg.allowedTransitionsText}
                    onChange={(e) =>
                      handleStageChange(
                        index,
                        "allowedTransitionsText",
                        e.target.value,
                      )
                    }
                    className="w-full border border-[#d0d7de] p-1 bg-white outline-none font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-600 font-semibold mb-0.5">
                    Stage Required Tasks (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ID Verification, Bank Statement, Biometrics Appointment"
                    value={stg.tasksText}
                    onChange={(e) =>
                      handleStageChange(index, "tasksText", e.target.value)
                    }
                    className="w-full border border-[#d0d7de] p-1 bg-white outline-none text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Save Workflow Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
