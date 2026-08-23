"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { useDebounce } from "@/hooks/useDebounce";
import { apiClient } from "@/lib/fetchClient";
import { TableRowSkeleton } from "@/components/Skeleton";
import Cookies from "js-cookie";
import { User, Team } from "@/types";

interface WorkloadUser extends User {
  teamId?: { _id: string; name: string } | any;
  stats?: {
    totalItems: number;
    pendingItems: number;
    completedItems: number;
    activeDockets: number;
  };
}

export default function TeamOversightPage() {
  const [users, setUsers] = useState<WorkloadUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  // Search & Pagination State
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced Search Hook (300ms)
  const debouncedSearch = useDebounce(search, 300);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Edit User State
  const [editingUser, setEditingUser] = useState<WorkloadUser | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormEmail, setEditFormEmail] = useState("");
  const [editFormRole, setEditFormRole] = useState<
    "admin" | "manager" | "executive"
  >("executive");
  const [editFormTeamId, setEditFormTeamId] = useState("");

  // Create User State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<
    "admin" | "manager" | "executive"
  >("executive");
  const [createTeamId, setCreateTeamId] = useState("");

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const raw = Cookies.get("user");
    if (raw) {
      try {
        setCurrentUser(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse user cookie:", e);
      }
    }
  }, []);

  const fetchUsers = async (
    targetPage = page,
    searchTerm = debouncedSearch,
  ) => {
    setLoading(true);
    try {
      const res = await apiClient(
        `/users?page=${targetPage}&limit=8&search=${encodeURIComponent(searchTerm)}`,
      );
      if (res.data?.users) {
        setUsers(res.data.users);
        setTeams(res.data.teams || []);
      } else if (Array.isArray(res.data)) {
        setUsers(res.data);
      }
      setTotalPages(res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch workload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchUsers(1, debouncedSearch);
  }, [debouncedSearch]);

  const isAdmin = currentUser?.role === "admin";

  // Open Edit Modal
  const handleOpenEdit = (user: WorkloadUser) => {
    setEditingUser(user);
    setEditFormName(user.name);
    setEditFormEmail(user.email);
    setEditFormRole(user.role);
    setEditFormTeamId(user.teamId?._id || user.teamId || "");
    setFormError("");
  };

  // Save Existing User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSaving(true);
    setFormError("");

    try {
      await apiClient(`/users/${editingUser._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editFormName.trim(),
          email: editFormEmail.trim(),
          role: isAdmin ? editFormRole : undefined,
          teamId: isAdmin ? editFormTeamId || null : undefined,
        }),
      });
      setEditingUser(null);
      fetchUsers(page, debouncedSearch);
    } catch (err: any) {
      setFormError(err.message || "Failed to update user profile");
    } finally {
      setSaving(false);
    }
  };

  // Create New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      await apiClient("/users", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          role: createRole,
          teamId: createTeamId || null,
        }),
      });

      setIsCreateOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("executive");
      setCreateTeamId("");

      fetchUsers(1, "");
    } catch (err: any) {
      setFormError(err.message || "Failed to onboard staff user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa]">
      <Header />

      {/* Top Action, Search & Modular Pagination Toolbar */}
      <div className="border-b border-[#d0d7de] bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 text-xs uppercase tracking-tight">
            Team Workload & Resource Oversight
          </span>

          {isAdmin && (
            <button
              onClick={() => {
                setFormError("");
                setIsCreateOpen(true);
              }}
              className="border border-[#2da44e] bg-[#2da44e] text-white px-2.5 py-1 text-xs font-semibold hover:bg-[#2c974b] active:bg-[#298e46]"
            >
              + Add Staff Member
            </button>
          )}

          <SearchBar
            value={search}
            placeholder="Search staff by name or email..."
            onChange={setSearch}
            width="w-64"
          />
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          limit={8}
          loading={loading}
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchUsers(newPage, debouncedSearch);
          }}
        />
      </div>

      {/* Zebra-Striped Table View */}
      <div className="p-4 flex-1 overflow-auto">
        <div className="border border-[#d0d7de] bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#d0d7de] bg-[#f6f8fa] text-[10px] text-gray-600 font-bold uppercase">
                <th className="p-2.5">Staff Member</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Team Unit</th>
                <th className="p-2.5 text-center">Active Dockets</th>
                <th className="p-2.5 text-center">Pending Tasks</th>
                <th className="p-2.5 text-center">Completed Tasks</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7}>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    No staff members match the search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u, index) => {
                  const canEdit = isAdmin || currentUser?._id === u._id;
                  const rowBg = index % 2 === 0 ? "bg-white" : "bg-[#f6f8fa]";

                  return (
                    <tr
                      key={u._id}
                      className={`border-b border-gray-100 hover:bg-gray-100/70 transition-colors ${rowBg}`}
                    >
                      <td className="p-2.5">
                        <div className="font-bold text-gray-900">{u.name}</div>
                        <div className="text-[10px] font-mono text-gray-400">
                          {u.email}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <StatusBadge status={u.role} type="role" />
                      </td>
                      <td className="p-2.5 text-gray-600 font-medium">
                        {u.teamId?.name || (
                          <span className="italic text-gray-400">
                            Universal Operations
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-semibold text-gray-900">
                        {u.stats?.activeDockets ?? 0}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`font-mono font-bold px-1.5 py-0.5 text-[10px] rounded border ${
                            (u.stats?.pendingItems || 0) > 4
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {u.stats?.pendingItems ?? 0} Pending
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-green-700 font-semibold">
                        {u.stats?.completedItems ?? 0} Done
                      </td>
                      <td className="p-2.5 text-right">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="border border-[#d0d7de] bg-white px-2 py-0.5 text-[10px] hover:bg-gray-50 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Staff Member (Admin Only) */}
      <Modal
        isOpen={isCreateOpen}
        title="Onboard New Staff Member"
        onClose={() => setIsCreateOpen(false)}
      >
        {formError && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Priya Sharma"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="priya@company.com"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Initial Password *
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Role *
              </label>
              <select
                value={createRole}
                onChange={(e) => setCreateRole(e.target.value as any)}
                className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
              >
                <option value="executive">Executive</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                Assigned Team Unit
              </label>
              <select
                value={createTeamId}
                onChange={(e) => setCreateTeamId(e.target.value)}
                className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
              >
                <option value="">Universal Operations</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3 mt-4">
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
              {saving ? "Creating..." : "Onboard Staff"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Staff Information */}
      <Modal
        isOpen={Boolean(editingUser)}
        title="Edit Staff Information"
        onClose={() => setEditingUser(null)}
      >
        {formError && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {formError}
          </div>
        )}
        <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={editFormName}
              onChange={(e) => setEditFormName(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={editFormEmail}
              onChange={(e) => setEditFormEmail(e.target.value)}
              className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
            />
          </div>

          {isAdmin && (
            <>
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Role
                </label>
                <select
                  value={editFormRole}
                  onChange={(e) => setEditFormRole(e.target.value as any)}
                  className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
                >
                  <option value="executive">Executive</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Assigned Team Unit
                </label>
                <select
                  value={editFormTeamId}
                  onChange={(e) => setEditFormTeamId(e.target.value)}
                  className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
                >
                  <option value="">Universal Operations</option>
                  {teams.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
