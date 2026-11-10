"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

export default function AdminStaffPage() {
  const { success, error: toastError } = useToast();

  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add staff modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Confirm dialog for activate/deactivate
  const [confirmStaff, setConfirmStaff] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      const data = await apiFetch("/api/admin/staff");
      setStaffList(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load staff list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Full name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) errs.email = "Email is required";
    else if (!emailRegex.test(email.trim())) errs.email = "Invalid email format";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setModalSubmitting(true);
    try {
      const created = await apiFetch("/api/admin/staff", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      });

      success(`Staff member "${created.name}" created successfully.`);
      setIsAddOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setFormErrors({});
      setStaffList((prev) => [created, ...prev]);
    } catch (err) {
      toastError(err.message || "Failed to create staff member");
    } finally {
      setModalSubmitting(false);
    }
  };

  const openToggleConfirm = (staff) => {
    setConfirmStaff(staff);
    setConfirmOpen(true);
  };

  const handleToggleActive = async () => {
    if (!confirmStaff) return;
    setToggleLoading(true);
    const newStatus = !confirmStaff.isActive;

    try {
      const updated = await apiFetch(`/api/admin/staff/${confirmStaff._id}/active`, {
        method: "PUT",
        body: { isActive: newStatus },
      });

      success(
        `Staff member "${updated.name}" is now ${
          newStatus ? "active" : "deactivated"
        }.`
      );
      setStaffList((prev) =>
        prev.map((s) => (s._id === updated._id ? { ...s, isActive: updated.isActive } : s))
      );
      setConfirmOpen(false);
      setConfirmStaff(null);
    } catch (err) {
      toastError(err.message || "Failed to update staff status");
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Staff Management"
        subtitle="Manage campus maintenance personnel, assign credentials, and control access"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStaff}
              className="flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setFormErrors({});
                setIsAddOpen(true);
              }}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <span>➕</span>
              <span>Add Staff Member</span>
            </Button>
          </div>
        }
      />
      {/* Staff Table / Cards */}
      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : error ? (
        <ErrorMessage
          title="Could not load staff members"
          message={error}
          onRetry={fetchStaff}
        />
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No staff members registered"
          description="Create your first facilities staff account so maintenance tasks can be assigned and repaired."
          action={
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsAddOpen(true)}
            >
              Add First Staff Member
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Staff Member
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Email Address
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {staffList.map((staff) => (
                  <tr key={staff._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">
                      👤 {staff.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                      {staff.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {staff.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <Button
                        variant={staff.isActive ? "danger" : "outline"}
                        size="sm"
                        onClick={() => openToggleConfirm(staff)}
                      >
                        {staff.isActive ? "Deactivate" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden divide-y divide-gray-100">
            {staffList.map((staff) => (
              <div key={staff._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">👤 {staff.name}</h4>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{staff.email}</p>
                  </div>
                  {staff.isActive ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      Deactivated
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    Role: {staff.role}
                  </span>
                  <Button
                    variant={staff.isActive ? "danger" : "outline"}
                    size="sm"
                    onClick={() => openToggleConfirm(staff)}
                  >
                    {staff.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Staff Member"
        subtitle="Create a new login for campus maintenance personnel"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={modalSubmitting}
              onClick={() => setIsAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={modalSubmitting}
              onClick={handleCreateStaff}
            >
              Create Staff Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Staff Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="staff@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="w-full pl-3.5 pr-10 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-sm focus:outline-none"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-xs text-red-600 font-medium">{formErrors.password}</p>
            )}
          </div>

          <p className="text-xs text-gray-500 pt-1">
            New staff accounts are created with role <strong>staff</strong> and active status by default.
          </p>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deactivation / Activation */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title={
          confirmStaff?.isActive
            ? `Deactivate ${confirmStaff?.name}?`
            : `Activate ${confirmStaff?.name}?`
        }
        message={
          confirmStaff?.isActive
            ? `Are you sure you want to deactivate ${confirmStaff?.name}? They will immediately be barred from logging into the staff portal, and any existing active sessions will be terminated.`
            : `Activate ${confirmStaff?.name}? They will be able to log in and receive maintenance task assignments.`
        }
        confirmText={confirmStaff?.isActive ? "Deactivate User" : "Activate User"}
        cancelText="Cancel"
        variant={confirmStaff?.isActive ? "danger" : "primary"}
        loading={toggleLoading}
        onConfirm={handleToggleActive}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmStaff(null);
        }}
      />
    </div>
  );
}
