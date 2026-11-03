"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "admin") {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-3"></div>
          <p className="text-gray-600 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-6 sm:space-x-8">
              <span className="text-lg font-bold text-blue-700 tracking-tight">
                Campus Water &bull; Admin
              </span>
              <nav className="flex space-x-1 sm:space-x-2">
                <Link
                  href="/admin"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    pathname === "/admin"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/water-points"
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                    pathname === "/admin/water-points"
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  Water Points
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">
                Logged in as <strong className="text-gray-800">{user.name}</strong>
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-xs sm:text-sm text-red-600 hover:text-red-800 font-medium px-2.5 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

