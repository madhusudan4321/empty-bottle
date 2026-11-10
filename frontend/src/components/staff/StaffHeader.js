"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";

export default function StaffHeader({ onRefresh, refreshing = false }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="text-2xl p-1 bg-blue-100 rounded-lg text-blue-600">
            💧
          </span>
          <div className="flex flex-col">
            <span className="text-base font-bold text-gray-900 leading-tight">
              Empty Bottle
            </span>
            <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">
              Staff Portal • LPU
            </span>
          </div>
        </div>

        {/* Right Info & Actions */}
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition text-sm disabled:opacity-50"
              title="Refresh task list"
              aria-label="Refresh tasks"
            >
              <span className={refreshing ? "inline-block animate-spin" : ""}>🔄</span>
            </button>
          )}

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] text-gray-400">Signed in as</span>
            <span className="text-xs font-bold text-gray-800 truncate max-w-[140px]">
              {user?.name || "Staff Member"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
