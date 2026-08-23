"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/fetchClient";
import { User } from "@/types";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // Self Profile Edit Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const rawUser = Cookies.get("user");
    if (rawUser) {
      try {
        const parsedUser = JSON.parse(rawUser);
        setUser(parsedUser);
        setProfileName(parsedUser.name || "");
        setProfileEmail(parsedUser.email || "");
      } catch (e) {
        console.error("Failed to parse user cookie", e);
      }
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove("token");
    Cookies.remove("refreshToken");
    Cookies.remove("user");
    router.push("/login");
  };

  const handleOpenProfileModal = () => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileError("");
      setIsProfileModalOpen(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setProfileError("");

    try {
      const res = await apiClient(`/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
        }),
      });

      const updatedUser = {
        ...user,
        name: res.data.name,
        email: res.data.email,
      };

      setUser(updatedUser);
      Cookies.set("user", JSON.stringify(updatedUser), { expires: 1 });
      setIsProfileModalOpen(false);
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const isManagerOrAdmin = user?.role === "admin" || user?.role === "manager";
  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Sticky Gray Header */}
      <header className="sticky top-0 z-40 border-b border-[#d0d7de] bg-[#f6f8fa]/95 backdrop-blur-sm px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <span className="font-bold tracking-tight text-gray-900 border-r border-[#d0d7de] pr-4 text-xs">
            OPERATIONS ERP
          </span>
          <nav className="flex items-center gap-4 text-xs">
            <Link
              href="/applications"
              className={`hover:text-blue-600 transition-colors ${
                pathname.startsWith("/applications")
                  ? "font-bold text-blue-700 border-b-2 border-blue-700 pb-0.5"
                  : "text-gray-600"
              }`}
            >
              Applications
            </Link>

            <Link
              href="/customers"
              className={`hover:text-blue-600 transition-colors ${
                pathname.startsWith("/customers")
                  ? "font-bold text-blue-700 border-b-2 border-blue-700 pb-0.5"
                  : "text-gray-600"
              }`}
            >
              Customers
            </Link>

            {isManagerOrAdmin && (
              <Link
                href="/team"
                className={`hover:text-blue-600 transition-colors ${
                  pathname.startsWith("/team")
                    ? "font-bold text-blue-700 border-b-2 border-blue-700 pb-0.5"
                    : "text-gray-600"
                }`}
              >
                Team Oversight
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/workflows"
                className={`hover:text-blue-600 transition-colors ${
                  pathname.startsWith("/workflows")
                    ? "font-bold text-blue-700 border-b-2 border-blue-700 pb-0.5"
                    : "text-gray-600"
                }`}
              >
                Workflows (Admin)
              </Link>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-3 text-[11px]">
            <button
              onClick={handleOpenProfileModal}
              title="Click to edit profile"
              className="flex items-center gap-1.5 border border-[#d0d7de] bg-white hover:bg-gray-50 px-2 py-1 transition-colors text-left shadow-2xs"
            >
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[9px]">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="font-semibold text-gray-800 hover:text-blue-700">
                {user.name}
              </span>
              <b
                className={`uppercase px-1 py-0.2 text-[8px] font-mono border ${
                  user.role === "admin"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : user.role === "manager"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                }`}
              >
                {user.role}
              </b>
              <span className="text-[10px] text-gray-400 ml-0.5">✏️</span>
            </button>

            <button
              onClick={handleLogout}
              className="border border-[#d0d7de] bg-white px-2.5 py-1 text-gray-700 hover:bg-gray-100 text-xs transition-colors shadow-2xs"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* Self Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border border-[#d0d7de] bg-white p-5 shadow-lg">
            <div className="flex justify-between items-center border-b border-[#d0d7de] pb-2 mb-3">
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                My Profile Settings
              </h3>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            {profileError && (
              <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
                {profileError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
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
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full border border-[#d0d7de] p-1.5 bg-white text-gray-900 outline-none focus:border-blue-600"
                />
              </div>

              <div className="bg-[#f6f8fa] border border-gray-200 p-2 text-[10px] text-gray-500 space-y-0.5 font-mono">
                <div>
                  Role: <b className="uppercase">{user?.role}</b>
                </div>
                <div>User ID: {user?._id}</div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#d0d7de] pt-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="border border-[#d0d7de] px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="border border-[#2da44e] bg-[#2da44e] px-3 py-1 text-white font-semibold hover:bg-[#2c974b] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
