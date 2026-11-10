"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ShareLocationToggle from "@/components/crowd/ShareLocationToggle";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    router.push("/login");
  };

  // Nav links partitioned strictly by authenticated role
  let navLinks = [];
  if (!loading && user) {
    if (user.role === "student") {
      navLinks = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/water-points", label: "Water Points" },
        { href: "/reports", label: "My Reports" },
        { href: "/reports/new", label: "Report Issue" },
      ];
    } else if (user.role === "staff") {
      navLinks = [{ href: "/staff", label: "Staff" }];
    } else if (user.role === "admin") {
      navLinks = [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/maintenance", label: "Maintenance" },
        { href: "/admin/reports", label: "Reports" },
        { href: "/admin/water-points", label: "Water Points" },
        { href: "/admin/staff", label: "Staff" },
      ];
    }
  }

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    if (href === "/staff") return pathname === "/staff";
    return pathname.startsWith(href);
  };

  const homeHref = user
    ? user.role === "admin"
      ? "/admin"
      : user.role === "staff"
      ? "/staff"
      : "/dashboard"
    : "/login";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <Link href={homeHref} className="flex items-center gap-2">
              <span className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                💧
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 leading-tight tracking-tight">
                  Empty Bottle
                </span>
                <span className="text-[11px] text-gray-500 font-medium">
                  Campus Water Management
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links (shown only when auth finished and user exists) */}
          <nav className="hidden md:flex items-center gap-1">
            {!loading &&
              navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && user && user.role === "student" && (
              <div className="border-r border-gray-200 pr-3">
                <ShareLocationToggle compact />
              </div>
            )}
            {loading ? null : user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs uppercase">
                    {(user.name && user.name.charAt(0)) || "U"}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-gray-500 capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            {!loading && user && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2 py-1 text-xs font-medium text-red-600 border border-red-200 rounded"
              >
                Logout
              </button>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {!loading &&
            navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    active
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

          {!loading && user && user.role === "student" && (
            <div className="pt-2 pb-1 border-t border-gray-100">
              <ShareLocationToggle compact />
            </div>
          )}

          {!loading && user && (
            <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between px-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs uppercase">
                  {(user.name && user.name.charAt(0)) || "U"}
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {user.name} ({user.role})
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs font-semibold text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          )}

          {!loading && !user && (
            <div className="pt-3 mt-2 border-t border-gray-100 px-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center text-sm font-semibold text-blue-600 py-1"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
