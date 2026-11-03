"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export const homeForRole = (role) => {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard";
};

// Usage: <ProtectedRoute>...</ProtectedRoute>                (any logged-in user)
//        <ProtectedRoute roles={["admin"]}>...</ProtectedRoute>  (specific roles)
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(homeForRole(user.role));
  }, [loading, user, allowed, router]);

  if (loading || !allowed) {
    return <p className="p-6 text-center text-gray-500">Loading...</p>;
  }
  return children;
}
