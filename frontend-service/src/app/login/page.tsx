"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/fetchClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin.rajesh@yaxis.com");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const { user, accessToken, refreshToken } = res.data;

      // Store access token (short lived) & refresh token (long lived)
      Cookies.set("token", accessToken, { expires: 1 });
      if (refreshToken) {
        Cookies.set("refreshToken", refreshToken, { expires: 7 });
      }
      Cookies.set("user", JSON.stringify(user), { expires: 1 });

      router.push("/applications");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("Password@123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] p-4">
      <div className="w-full max-w-sm border border-[#d0d7de] bg-white p-6 shadow-sm">
        <div className="border-b border-[#d0d7de] pb-3 mb-4">
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">
            OPERATIONS PORTAL
          </h1>
          <p className="text-[11px] text-gray-500">
            Customer & Workflow Management
          </p>
        </div>

        {error && (
          <div className="mb-3 border border-red-300 bg-red-50 p-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-[#d0d7de] px-2 py-1.5 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-[#d0d7de] px-2 py-1.5 text-xs outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-[#2da44e] bg-[#2da44e] py-1.5 text-xs font-semibold text-white hover:bg-[#2c974b] active:bg-[#298e46] disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 border-t border-[#d0d7de] pt-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Quick Demo Logins:
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setDemoUser("admin.rajesh@yaxis.com")}
              className="text-left text-[11px] text-blue-700 hover:underline"
            >
              • Admin (Rajesh Sharma)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("manager.priyanka@yaxis.com")}
              className="text-left text-[11px] text-blue-700 hover:underline"
            >
              • Manager (Priyanka Verma)
            </button>
            <button
              type="button"
              onClick={() => setDemoUser("executive.vikram@yaxis.com")}
              className="text-left text-[11px] text-blue-700 hover:underline"
            >
              • Executive (Vikram Joshi)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
