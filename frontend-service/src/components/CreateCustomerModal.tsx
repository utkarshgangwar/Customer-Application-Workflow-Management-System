"use client";

import { useState, useEffect } from "react";
import Modal from "./Modal";
import { apiClient } from "@/lib/fetchClient";
import { Customer, Workflow, User } from "@/types";

interface CreateApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateApplicationModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const loadFormData = async () => {
      try {
        // Fetch with higher limit to ensure full dropdown lists
        const [custRes, wfRes, userRes] = await Promise.all([
          apiClient("/customers?limit=100"),
          apiClient("/workflows"),
          apiClient("/users?limit=100"),
        ]);

        setCustomers(custRes.data || []);
        setWorkflows(wfRes.data || []);

        const staffUsers = userRes.data?.users || userRes.data || [];
        setUsers(staffUsers);

        if (custRes.data?.length > 0) setCustomerId(custRes.data[0]._id);
        if (wfRes.data?.length > 0) {
          setWorkflowId(wfRes.data[0]._id);
          setTitle(
            `${wfRes.data[0].name} - ${custRes.data[0]?.name || "Dossier"}`,
          );
        }
      } catch (err: any) {
        setError("Failed to load workflow selection data.");
      }
    };

    loadFormData();
  }, [isOpen]);

  const handleWorkflowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedWfId = e.target.value;
    setWorkflowId(selectedWfId);
    const wf = workflows.find((w) => w._id === selectedWfId);
    const cust = customers.find((c) => c._id === customerId);
    if (wf) {
      setTitle(`${wf.name} - ${cust?.name || "Applicant"}`);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCustId = e.target.value;
    setCustomerId(selectedCustId);
    const wf = workflows.find((w) => w._id === workflowId);
    const cust = customers.find((c) => c._id === selectedCustId);
    if (wf && cust) {
      setTitle(`${wf.name} - ${cust.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiClient("/applications", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          workflowId,
          title,
          priority: Number(priority),
          assignedTo: assignedTo || undefined,
        }),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to lodge application docket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Initiate New Customer Docket"
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Select Customer Applicant *
          </label>
          <select
            value={customerId}
            onChange={handleCustomerChange}
            required
            className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
          >
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Target Workflow Schema *
          </label>
          <select
            value={workflowId}
            onChange={handleWorkflowChange}
            required
            className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
          >
            {workflows.map((wf) => (
              <option key={wf._id} value={wf._id}>
                {wf.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Docket Subject / Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Assigned Executive
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            >
              <option value="">Unassigned (Auto / Queue)</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Priority SLA
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            >
              <option value={1}>Normal</option>
              <option value={2}>High</option>
              <option value={3}>Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
          >
            {submitting ? "Lodging Docket..." : "Create Application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
