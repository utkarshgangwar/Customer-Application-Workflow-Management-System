"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import GenericList from "@/components/GenericList";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/fetchClient";
import { DetailSkeleton } from "@/components/Skeleton";
import { Customer } from "@/types";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [customerApplications, setCustomerApplications] = useState<any[]>([]);

  // Search & Pagination States
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // Create Customer Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    mobileCode: "+91",
    mobileNum: "",
    city: "",
    address: "",
    pincode: "",
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCustomers = async (
    targetPage = page,
    searchTerm = debouncedSearch,
  ) => {
    setLoadingList(true);
    try {
      const res = await apiClient(
        `/customers?page=${targetPage}&limit=8&search=${encodeURIComponent(searchTerm)}`,
      );
      setCustomers(res.data);
      setTotalPages(res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);

      if (res.data.length > 0 && (!selectedCustomer || targetPage !== page)) {
        loadCustomerDossier(res.data[0]);
      } else if (res.data.length === 0) {
        setSelectedCustomer(null);
        setCustomerApplications([]);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoadingList(false);
    }
  };

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

  const loadCustomerDossier = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setLoadingDossier(true);
    try {
      const res = await apiClient(`/customers/${customer._id}/applications`);
      setCustomerApplications(res.data);
    } catch (err) {
      console.error("Failed to load customer dossier:", err);
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchCustomers(1, debouncedSearch);
  }, [debouncedSearch]);

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      name: customer.name,
      email: customer.email,
      mobileCode: customer.mobile?.code || "+91",
      mobileNum: customer.mobile?.num || "",
      city: customer.city || "",
      address: customer.address || "",
      pincode: customer.pincode || "",
    });
    setFormError("");
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSaving(true);
    setFormError("");
    try {
      await apiClient(`/customers/${editingCustomer._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          mobile: {
            code: editFormData.mobileCode,
            num: editFormData.mobileNum,
          },
          city: editFormData.city,
          address: editFormData.address,
          pincode: editFormData.pincode,
        }),
      });
      setEditingCustomer(null);
      fetchCustomers(page, debouncedSearch);
      if (selectedCustomer?._id === editingCustomer._id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: editFormData.name,
          email: editFormData.email,
          city: editFormData.city,
          address: editFormData.address,
          pincode: editFormData.pincode,
          mobile: {
            code: editFormData.mobileCode,
            num: editFormData.mobileNum,
          },
        });
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to update customer");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const res = await apiClient("/customers", {
        method: "POST",
        body: JSON.stringify({
          name: createFormData.name,
          email: createFormData.email,
          mobile: {
            code: createFormData.mobileCode,
            num: createFormData.mobileNum,
          },
          city: createFormData.city,
          address: createFormData.address,
          pincode: createFormData.pincode,
        }),
      });
      setIsCreateOpen(false);
      setCreateFormData({
        name: "",
        email: "",
        mobileCode: "+91",
        mobileNum: "",
        city: "",
        address: "",
        pincode: "",
      });
      fetchCustomers(1, "");
      if (res.data) loadCustomerDossier(res.data);
    } catch (err: any) {
      setFormError(err.message || "Failed to register customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <Header />

      {/* Top Toolbar */}
      <div className="border-b border-[#d0d7de] bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFormError("");
              setIsCreateOpen(true);
            }}
            className="border border-[#2da44e] bg-[#2da44e] text-white px-2.5 py-1 text-xs font-semibold hover:bg-[#2c974b] active:bg-[#298e46]"
          >
            + Add Customer
          </button>
          <SearchBar
            value={search}
            placeholder="Search by name, email, phone..."
            onChange={setSearch}
            width="w-64"
          />
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          limit={8}
          loading={loadingList}
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchCustomers(newPage, debouncedSearch);
          }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Zebra Striped Generic List */}
        <div className="w-1/3 border-r border-[#d0d7de] bg-white overflow-y-auto max-h-[calc(100vh-85px)]">
          <GenericList
            items={customers}
            selectedId={selectedCustomer?._id}
            getId={(c) => c._id}
            loading={loadingList}
            emptyMessage="No matching customers found."
            zebra={true}
            onSelect={loadCustomerDossier}
            renderItem={(c) => (
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-gray-900">
                    {c.name}
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    {c.email} | {c.mobile?.code} {c.mobile?.num}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {c.city}, {c.country || "India"}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(c);
                  }}
                  className="border border-[#d0d7de] bg-white px-2 py-0.5 text-[10px] hover:bg-gray-100 font-medium"
                >
                  Edit
                </button>
              </div>
            )}
          />
        </div>

        {/* Right Side: Customer Applications & Dossier Inspector */}
        <div className="w-2/3 bg-[#fafbfc] overflow-y-auto max-h-[calc(100vh-85px)] p-4">
          {loadingDossier ? (
            <DetailSkeleton />
          ) : selectedCustomer ? (
            <div className="space-y-4">
              <div className="border border-[#d0d7de] bg-white p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400">
                      CUSTOMER ID: {selectedCustomer._id}
                    </span>
                    <h2 className="text-sm font-bold text-gray-900">
                      {selectedCustomer.name}
                    </h2>
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedCustomer.email} | {selectedCustomer.mobile?.code}{" "}
                      {selectedCustomer.mobile?.num}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Address: {selectedCustomer.address || "N/A"},{" "}
                      {selectedCustomer.city} ({selectedCustomer.pincode})
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(selectedCustomer)}
                    className="border border-blue-600 bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-semibold hover:bg-blue-600 hover:text-white"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>

              <div className="border border-[#d0d7de] bg-white p-4 space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase border-b border-[#d0d7de] pb-2">
                  Applied Customer Dockets & Files (
                  {customerApplications.length})
                </h3>

                {customerApplications.length === 0 ? (
                  <div className="text-xs text-gray-400">
                    No applications lodged for this customer.
                  </div>
                ) : (
                  customerApplications.map((app: any) => (
                    <div
                      key={app._id}
                      className="border border-[#e1e4e8] bg-[#fafbfc] p-3 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-gray-900">
                            {app.title}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            Workflow: {app.workflowId?.name} | Assigned:{" "}
                            {app.assignedTo?.name || "Unassigned"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={app.currentStage} type="stage" />
                          <StatusBadge status={app.status} type="status" />
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-2 space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-600 uppercase">
                          Stage Work Items & Attachments:
                        </span>
                        {app.workItems?.length === 0 ? (
                          <div className="text-[10px] text-gray-400 italic">
                            No tasks assigned.
                          </div>
                        ) : (
                          app.workItems?.map((wi: any) => (
                            <div
                              key={wi._id}
                              className="flex justify-between items-center text-xs bg-white p-2 border border-gray-100"
                            >
                              <div>
                                <span
                                  className={
                                    wi.status === "COMPLETED"
                                      ? "line-through text-gray-400"
                                      : "text-gray-800"
                                  }
                                >
                                  {wi.title}
                                </span>
                                <span className="text-[9px] font-mono text-gray-400 ml-2">
                                  [{wi.stageName}]
                                </span>
                              </div>

                              <div>
                                {wi.attachmentId ? (
                                  <a
                                    href={`${BACKEND_URL}${wi.attachmentId.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-700 hover:underline font-mono text-[10px] flex items-center gap-1 font-semibold"
                                  >
                                    📎 {wi.attachmentId.name} (
                                    {wi.attachmentId.status || "ATTACHED"})
                                  </a>
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">
                                    No File
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-gray-400">
              Select a customer from the left list.
            </div>
          )}
        </div>
      </div>

      {/* Register New Customer Modal */}
      <Modal
        isOpen={isCreateOpen}
        title="Register New Customer"
        onClose={() => setIsCreateOpen(false)}
      >
        {formError && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={createFormData.name}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, name: e.target.value })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={createFormData.email}
              onChange={(e) =>
                setCreateFormData({ ...createFormData, email: e.target.value })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Code
              </label>
              <input
                type="text"
                value={createFormData.mobileCode}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    mobileCode: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={createFormData.mobileNum}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    mobileNum: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                City
              </label>
              <input
                type="text"
                value={createFormData.city}
                onChange={(e) =>
                  setCreateFormData({ ...createFormData, city: e.target.value })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={createFormData.pincode}
                onChange={(e) =>
                  setCreateFormData({
                    ...createFormData,
                    pincode: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Address
            </label>
            <input
              type="text"
              value={createFormData.address}
              onChange={(e) =>
                setCreateFormData({
                  ...createFormData,
                  address: e.target.value,
                })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
            >
              {saving ? "Creating..." : "Register Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={Boolean(editingCustomer)}
        title="Edit Customer Details"
        onClose={() => setEditingCustomer(null)}
      >
        {formError && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={editFormData.name || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, name: e.target.value })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={editFormData.email || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, email: e.target.value })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Code
              </label>
              <input
                type="text"
                value={editFormData.mobileCode || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    mobileCode: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editFormData.mobileNum || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    mobileNum: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                City
              </label>
              <input
                type="text"
                value={editFormData.city || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, city: e.target.value })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Pincode
              </label>
              <input
                type="text"
                value={editFormData.pincode || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    pincode: e.target.value,
                  })
                }
                className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Address
            </label>
            <input
              type="text"
              value={editFormData.address || ""}
              onChange={(e) =>
                setEditFormData({ ...editFormData, address: e.target.value })
              }
              className="w-full border border-[#d0d7de] p-1.5 bg-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
            <button
              type="button"
              onClick={() => setEditingCustomer(null)}
              className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
