"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/fetchClient";
import Cookies from "js-cookie";
import { Customer, Workflow, User } from "@/types";

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PRIORITY_LABELS: Record<number, string> = {
  0: "0 - Low",
  1: "1 - Normal / Medium",
  2: "2 - High",
  3: "3 - Urgent",
};

export default function CreateApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Option Lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executives, setExecutives] = useState<User[]>([]);

  // Search Inputs
  const [customerSearch, setCustomerSearch] = useState("");
  const [workflowSearch, setWorkflowSearch] = useState("");
  const [executiveSearch, setExecutiveSearch] = useState("");

  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const debouncedWorkflowSearch = useDebounce(workflowSearch, 300);
  const debouncedExecutiveSearch = useDebounce(executiveSearch, 300);

  // Toggle: Existing vs New Customer
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustMobileCode, setNewCustMobileCode] = useState("+91");
  const [newCustMobileNum, setNewCustMobileNum] = useState("");
  const [newCustCity, setNewCustCity] = useState("");
  const [newCustCountry, setNewCustCountry] = useState("India");

  // Application Form State
  const [customerId, setCustomerId] = useState("");
  const [workflowId, setWorkflowId] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);

  // UI Flow State
  const [isConfirming, setIsConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load user
  useEffect(() => {
    const rawUser = Cookies.get("user");
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (e) {
        console.error("Failed to parse user cookie", e);
      }
    }
  }, []);

  // Fetch Executives/Managers Scoped Strictly to Workflow Team
  const fetchScopedAssignees = async (
    targetWfId: string,
    query = debouncedExecutiveSearch,
  ) => {
    if (!targetWfId) return;
    try {
      const url = `/users?workflowId=${targetWfId}&limit=50&search=${encodeURIComponent(
        query,
      )}`;
      const res = await apiClient(url);
      const list: User[] = res.data?.users || res.data || [];
      setExecutives(list);

      // Default selection logic: select current user if in list, otherwise first member
      if (currentUser && list.some((u) => u._id === currentUser._id)) {
        setAssignedTo(currentUser._id);
      } else if (list.length > 0) {
        setAssignedTo(list[0]._id);
      } else {
        setAssignedTo("");
      }
    } catch (err) {
      console.error("Failed to load workflow team members:", err);
    }
  };

  // Fetch Workflows
  const fetchWorkflows = async (query = debouncedWorkflowSearch) => {
    try {
      const res = await apiClient(
        `/workflows?search=${encodeURIComponent(query)}`,
      );
      const list: Workflow[] = res.data || [];
      setWorkflows(list);

      if (list.length > 0 && (!workflowId || query !== "")) {
        const initialWf = list[0];
        setWorkflowId(initialWf._id);
        updateDocketTitle(initialWf, customerId);
        fetchScopedAssignees(initialWf._id, debouncedExecutiveSearch);
      }
    } catch (err) {
      console.error("Failed to load workflows:", err);
    }
  };

  // Fetch Customers
  const fetchCustomers = async (query = debouncedCustomerSearch) => {
    if (isNewCustomer) return;
    try {
      const res = await apiClient(
        `/customers?limit=15&search=${encodeURIComponent(query)}`,
      );
      const list: Customer[] = res.data || [];
      setCustomers(list);

      if (list.length > 0 && (!customerId || query !== "")) {
        setCustomerId(list[0]._id);
        const activeWf = workflows.find((w) => w._id === workflowId);
        if (activeWf) updateDocketTitle(activeWf, list[0]._id, list[0].name);
      }
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  };

  // Open modal resets
  useEffect(() => {
    if (isOpen) {
      setError("");
      setIsConfirming(false);
      setCustomerSearch("");
      setWorkflowSearch("");
      setExecutiveSearch("");
      fetchWorkflows("");
      fetchCustomers("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) fetchCustomers(debouncedCustomerSearch);
  }, [debouncedCustomerSearch]);

  useEffect(() => {
    if (isOpen) fetchWorkflows(debouncedWorkflowSearch);
  }, [debouncedWorkflowSearch]);

  useEffect(() => {
    if (isOpen && workflowId) {
      fetchScopedAssignees(workflowId, debouncedExecutiveSearch);
    }
  }, [debouncedExecutiveSearch]);

  const updateDocketTitle = (
    wf: Workflow,
    custId: string,
    customName?: string,
  ) => {
    const cust = customers.find((c) => c._id === custId);
    const name =
      customName || cust?.name || (isNewCustomer ? newCustName : "Applicant");
    setTitle(`${wf.name} - ${name}`);
  };

  const handleWorkflowChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWfId = e.target.value;
    setWorkflowId(newWfId);
    const selectedWf = workflows.find((w) => w._id === newWfId);
    if (selectedWf) {
      updateDocketTitle(selectedWf, customerId);
      fetchScopedAssignees(newWfId, debouncedExecutiveSearch);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setCustomerId(id);
    const selectedWf = workflows.find((w) => w._id === workflowId);
    if (selectedWf) updateDocketTitle(selectedWf, id);
  };

  const handleProceedToConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isNewCustomer) {
      if (
        !newCustName.trim() ||
        !newCustEmail.trim() ||
        !newCustMobileNum.trim()
      ) {
        setError(
          "Name, email, and mobile number are required for new customer registration.",
        );
        return;
      }
    } else if (!customerId) {
      setError("Please select a customer from the list.");
      return;
    }

    if (!workflowId) {
      setError("Please select a valid workflow service.");
      return;
    }

    if (!title.trim()) {
      setError("Docket title is required.");
      return;
    }

    setIsConfirming(true);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      let targetCustomerId = customerId;

      if (isNewCustomer) {
        const customerRes = await apiClient("/customers", {
          method: "POST",
          body: JSON.stringify({
            name: newCustName.trim(),
            email: newCustEmail.trim(),
            mobile: { code: newCustMobileCode, num: newCustMobileNum.trim() },
            city: newCustCity.trim() || undefined,
            country: newCustCountry.trim() || "India",
          }),
        });
        targetCustomerId = customerRes.data._id;
      }

      await apiClient("/applications", {
        method: "POST",
        body: JSON.stringify({
          customerId: targetCustomerId,
          workflowId,
          title: title.trim(),
          priority: Number(priority),
          assignedTo: assignedTo || undefined,
        }),
      });

      setNewCustName("");
      setNewCustEmail("");
      setNewCustMobileNum("");
      setNewCustCity("");
      setIsNewCustomer(false);
      setIsConfirming(false);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create application docket.");
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomerObj = customers.find((c) => c._id === customerId);
  const selectedWorkflowObj = workflows.find((w) => w._id === workflowId);
  const selectedExecutiveObj = executives.find((u) => u._id === assignedTo);

  return (
    <Modal
      isOpen={isOpen}
      title={
        isConfirming
          ? "Confirm Application Docket"
          : "Create Application Docket"
      }
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {error && (
        <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {isConfirming ? (
        <div className="space-y-4 text-xs">
          <div className="border border-amber-200 bg-amber-50/70 p-3 text-amber-900 leading-relaxed text-[11px]">
            Please review the application docket details before submitting. This
            will initiate stage 1 work items and assign it to the selected team
            member.
          </div>

          <div className="border border-[#d0d7de] bg-white divide-y divide-gray-100">
            <div className="p-2.5 flex justify-between">
              <span className="font-semibold text-gray-600">Customer:</span>
              <span className="text-gray-900 font-bold">
                {isNewCustomer
                  ? `${newCustName} (${newCustEmail}) [NEW]`
                  : `${selectedCustomerObj?.name} (${selectedCustomerObj?.email})`}
              </span>
            </div>

            {isNewCustomer && (
              <div className="p-2.5 flex justify-between bg-[#fafbfc]">
                <span className="font-semibold text-gray-600">
                  Contact / City:
                </span>
                <span className="text-gray-800 font-mono">
                  {newCustMobileCode} {newCustMobileNum} |{" "}
                  {newCustCity || "N/A"}
                </span>
              </div>
            )}

            <div className="p-2.5 flex justify-between">
              <span className="font-semibold text-gray-600">
                Workflow Schema:
              </span>
              <span className="text-blue-700 font-semibold">
                {selectedWorkflowObj?.name || "N/A"}
              </span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-semibold text-gray-600">Docket Title:</span>
              <span className="text-gray-900 font-medium">{title}</span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-semibold text-gray-600">Assigned To:</span>
              <span className="text-gray-800 font-semibold">
                {selectedExecutiveObj
                  ? `${selectedExecutiveObj.name} (${selectedExecutiveObj.role.toUpperCase()})`
                  : "Unassigned (Queue / Triage)"}
              </span>
            </div>

            <div className="p-2.5 flex justify-between">
              <span className="font-semibold text-gray-600">
                Priority Level:
              </span>
              <span className="font-mono font-bold text-gray-800">
                {PRIORITY_LABELS[priority]}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsConfirming(false)}
              className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              ← Back to Edit
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalSubmit}
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
            >
              {loading ? "Lodging Docket..." : "Confirm & Lodge Docket"}
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleProceedToConfirmation}
          className="space-y-3 text-xs"
        >
          {/* Customer Selection Mode Toggle */}
          <div className="border border-[#d0d7de] p-2 bg-[#f6f8fa] flex gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input
                type="radio"
                name="custType"
                checked={!isNewCustomer}
                onChange={() => setIsNewCustomer(false)}
              />
              Existing Customer
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
              <input
                type="radio"
                name="custType"
                checked={isNewCustomer}
                onChange={() => setIsNewCustomer(true)}
              />
              + Register New Customer
            </label>
          </div>

          {/* Existing Customer Selector */}
          {!isNewCustomer ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-gray-700 font-semibold">
                  Select Customer *
                </label>
                <span className="text-[10px] text-gray-400 font-mono">
                  {customers.length} found
                </span>
              </div>

              <input
                type="text"
                placeholder="Type to filter customer by name, email, phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full border border-[#d0d7de] p-1.5 bg-[#fafbfc] text-xs outline-none focus:border-blue-600 mb-1"
              />

              <select
                value={customerId}
                onChange={handleCustomerChange}
                required
                className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white"
              >
                {customers.length === 0 ? (
                  <option value="">No matching customers found</option>
                ) : (
                  customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} — {c.email} ({c.city || c.country})
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div className="border border-blue-200 bg-blue-50/40 p-3 space-y-2">
              <div className="text-[11px] font-bold text-blue-900 uppercase">
                New Customer Information
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kulkarni"
                    value={newCustName}
                    onChange={(e) => {
                      setNewCustName(e.target.value);
                      const wf = workflows.find((w) => w._id === workflowId);
                      if (wf) updateDocketTitle(wf, "", e.target.value);
                    }}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@gmail.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    ISD Code
                  </label>
                  <input
                    type="text"
                    value={newCustMobileCode}
                    onChange={(e) => setNewCustMobileCode(e.target.value)}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210"
                    value={newCustMobileNum}
                    onChange={(e) => setNewCustMobileNum(e.target.value)}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Hyderabad"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-[10px] font-semibold mb-0.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newCustCountry}
                    onChange={(e) => setNewCustCountry(e.target.value)}
                    className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Workflow Selection */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-gray-700 font-semibold">
                Workflow Schema *
              </label>
              <span className="text-[10px] text-gray-400 font-mono">
                Determines Assignee Group
              </span>
            </div>

            <input
              type="text"
              placeholder="Search workflows (e.g. Canada PR, Student Visa)..."
              value={workflowSearch}
              onChange={(e) => setWorkflowSearch(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-[#fafbfc] text-xs outline-none focus:border-blue-600 mb-1"
            />

            <select
              value={workflowId}
              onChange={handleWorkflowChange}
              required
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white"
            >
              {workflows.length === 0 ? (
                <option value="">No matching workflows available</option>
              ) : (
                workflows.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.stages?.length || 0} Stages)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Docket Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Docket Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600"
            />
          </div>

          {/* Workflow Group Assignee Selection */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-gray-700 font-semibold">
                Assign Executive / Manager (Workflow Group)
              </label>
              <span className="text-[10px] text-blue-600 font-mono font-medium">
                {executives.length} in this group
              </span>
            </div>

            <input
              type="text"
              placeholder="Filter members in this group..."
              value={executiveSearch}
              onChange={(e) => setExecutiveSearch(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-[#fafbfc] text-xs outline-none focus:border-blue-600 mb-1"
            />

            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white font-medium"
            >
              <option value="">Unassigned (Queue / Triage)</option>
              {executives.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role.toUpperCase()}) — {u.email}
                </option>
              ))}
            </select>
          </div>

          {/* Priority SLA */}
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Priority SLA
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full border border-[#d0d7de] p-1.5 outline-none focus:border-blue-600 bg-white"
            >
              <option value={0}>0 - Low</option>
              <option value={1}>1 - Normal / Medium</option>
              <option value={2}>2 - High</option>
              <option value={3}>3 - Urgent</option>
            </select>
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
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b]"
            >
              Review & Lodge Docket →
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
