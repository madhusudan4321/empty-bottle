"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PriorityBadge, MaintenanceStatusBadge } from "@/components/ui/Badge";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Select from "@/components/ui/Select";
import StatusTimeline from "@/components/ui/StatusTimeline";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "../../water-points/distance";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";

export default function AdminMaintenancePage() {
  const { success, error: toastError } = useToast();

  const [requests, setRequests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  // Selected request modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Assign dropdown state
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Confirm dialog state for final completion
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const [maintData, staffData] = await Promise.all([
        apiFetch("/api/maintenance"),
        apiFetch("/api/admin/staff"),
      ]);
      setRequests(Array.isArray(maintData) ? maintData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handle URL query parameter ?id= to auto-open a request modal
  useEffect(() => {
    if (typeof window !== "undefined" && requests.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const reqId = params.get("id");
      if (reqId) {
        const found = requests.find((r) => r._id === reqId);
        if (found) {
          setSelectedRequest(found);
          setSelectedStaffId(found.assignedStaff?._id || "");
          setModalOpen(true);
        }
      }
    }
  }, [requests]);

  const openDetails = (req) => {
    setSelectedRequest(req);
    setSelectedStaffId(req.assignedStaff?._id || "");
    setModalOpen(true);
  };

  // Active staff filter for assignment dropdown
  const activeStaffOptions = useMemo(() => {
    return staffList
      .filter((s) => s.isActive)
      .map((s) => ({ value: s._id, label: `${s.name} (${s.email})` }));
  }, [staffList]);

  // Actions
  const handleAcknowledge = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/maintenance/${selectedRequest._id}/acknowledge`, {
        method: "PUT",
      });
      success("Maintenance request acknowledged and water point updated.");
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      toastError(err.message || "Failed to acknowledge request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedStaffId) return;
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/maintenance/${selectedRequest._id}/assign`, {
        method: "PUT",
        body: { staffId: selectedStaffId },
      });
      success("Request assigned to staff member successfully.");
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      toastError(err.message || "Failed to assign staff member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusTransition = async (newStatus) => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/maintenance/${selectedRequest._id}/status`, {
        method: "PUT",
        body: { status: newStatus },
      });
      success(`Request moved to ${newStatus.replace("_", " ")}.`);
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      toastError(err.message || `Failed to update status to ${newStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/maintenance/${selectedRequest._id}/verify`, {
        method: "PUT",
      });
      success("Repairs verified successfully.");
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
    } catch (err) {
      toastError(err.message || "Failed to verify repair");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const updated = await apiFetch(`/api/maintenance/${selectedRequest._id}/complete`, {
        method: "PUT",
      });
      success("Water point restored to available! All linked reports resolved.");
      setSelectedRequest(updated);
      setRequests((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setConfirmOpen(false);
    } catch (err) {
      toastError(err.message || "Failed to complete maintenance");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and sort items
  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) => {
        // Status filter
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        // Priority filter
        if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const wpName = (r.waterPointId?.name || "").toLowerCase();
          const building = (r.waterPointId?.building || "").toLowerCase();
          const issue = (r.issue || "").toLowerCase();
          if (!wpName.includes(q) && !building.includes(q) && !issue.includes(q)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        // Default priority sort handled by backend, but keep stable
        return 0;
      });
  }, [requests, statusFilter, priorityFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Maintenance Workflow"
        subtitle="Track, assign, verify, and resolve campus drinking water issues"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            className="flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </Button>
        }
      />
      {/* Filters Bar Card */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search by water point, building, or issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="fixed">Fixed</option>
              <option value="verified">Verified</option>
              <option value="available">Available (Completed)</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Sort: Priority First</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table / List */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : error ? (
        <ErrorMessage
          title="Failed to load maintenance requests"
          message={error}
          onRetry={fetchRequests}
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No maintenance requests match criteria"
          description={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all"
              ? "Try resetting your search or filter options."
              : "No maintenance requests are currently recorded in the system."
          }
          action={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Water Point &amp; Location
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Issue
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Priority
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center">
                    Reporters
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Assigned Staff
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Age
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredRequests.map((req) => {
                  const wp = req.waterPointId || {};
                  const locText = [wp.building, wp.floor ? `Floor ${wp.floor}` : null]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <tr
                      key={req._id}
                      onClick={() => openDetails(req)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 min-w-[200px]">
                        <div className="font-bold text-gray-900">{wp.name || "Unknown"}</div>
                        {locText && (
                          <div className="text-xs text-gray-500 mt-0.5">{locText}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-gray-800">
                        {ISSUE_TYPE_LABELS[req.issue] || req.issue}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <PriorityBadge priority={req.priority} size="sm" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <MaintenanceStatusBadge status={req.status} size="sm" />
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {req.distinctReporterCount || 1}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700">
                        {req.assignedStaff ? (
                          <span className="font-semibold text-gray-900">
                            👤 {req.assignedStaff.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {formatRelativeTime(req.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetails(req)}
                        >
                          Manage &rarr;
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filteredRequests.map((req) => {
              const wp = req.waterPointId || {};
              const locText = [wp.building, wp.floor ? `Floor ${wp.floor}` : null]
                .filter(Boolean)
                .join(" • ");

              return (
                <div
                  key={req._id}
                  onClick={() => openDetails(req)}
                  className="p-4 hover:bg-gray-50 active:bg-blue-50/50 cursor-pointer transition space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{wp.name}</h4>
                      {locText && (
                        <p className="text-xs text-gray-500 mt-0.5">{locText}</p>
                      )}
                    </div>
                    <PriorityBadge priority={req.priority} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <MaintenanceStatusBadge status={req.status} size="sm" />
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      {ISSUE_TYPE_LABELS[req.issue] || req.issue}
                    </span>
                    <span className="text-xs text-gray-500">
                      👥 {req.distinctReporterCount || 1} reporter(s)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
                    <span>
                      {req.assignedStaff
                        ? `Assigned: ${req.assignedStaff.name}`
                        : "Unassigned"}
                    </span>
                    <span>{formatRelativeTime(req.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Detail / Action Modal */}
      {selectedRequest && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Maintenance: ${selectedRequest.waterPointId?.name || "Water Point"}`}
          subtitle={`ID: ${selectedRequest._id}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Close
              </Button>

              {/* Status Action Buttons */}
              <div className="flex items-center gap-2">
                {selectedRequest.status === "reported" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleAcknowledge}
                  >
                    👁️ Acknowledge Request
                  </Button>
                )}

                {(selectedRequest.status === "acknowledged" ||
                  selectedRequest.status === "assigned") && (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!selectedStaffId}
                    loading={actionLoading}
                    onClick={handleAssign}
                  >
                    👤 {selectedRequest.assignedStaff ? "Re-assign Staff" : "Assign to Staff"}
                  </Button>
                )}

                {/* Admin can also advance assigned -> in_progress or in_progress -> fixed */}
                {selectedRequest.status === "assigned" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition("in_progress")}
                  >
                    🔧 Start Work (Admin override)
                  </Button>
                )}

                {selectedRequest.status === "in_progress" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => handleStatusTransition("fixed")}
                  >
                    ✨ Mark Fixed
                  </Button>
                )}

                {selectedRequest.status === "fixed" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={handleVerify}
                  >
                    ✅ Verify Repair
                  </Button>
                )}

                {selectedRequest.status === "verified" && (
                  <Button
                    variant="primary"
                    size="sm"
                    loading={actionLoading}
                    onClick={() => setConfirmOpen(true)}
                  >
                    🚰 Mark Available &amp; Complete
                  </Button>
                )}

                {selectedRequest.status === "available" && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                    ✓ Completed &bull; Water point is Available
                  </span>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Visual Workflow Timeline */}
            <div>
              <StatusTimeline currentStatus={selectedRequest.status} />
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-500 uppercase tracking-wider block text-[10px] font-semibold mb-1">
                  Issue Type
                </span>
                <span className="font-bold text-gray-900">
                  {ISSUE_TYPE_LABELS[selectedRequest.issue] || selectedRequest.issue}
                </span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block text-[10px] font-semibold mb-1">
                  Priority
                </span>
                <PriorityBadge priority={selectedRequest.priority} size="sm" />
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block text-[10px] font-semibold mb-1">
                  Unique Reporters
                </span>
                <span className="font-bold text-gray-900">
                  {selectedRequest.distinctReporterCount || 1} student(s)
                </span>
              </div>
              <div>
                <span className="text-gray-500 uppercase tracking-wider block text-[10px] font-semibold mb-1">
                  Current Status
                </span>
                <MaintenanceStatusBadge status={selectedRequest.status} size="sm" />
              </div>
            </div>

            {/* Location & Details */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-gray-900 text-sm">Location Details</h4>
              <p className="text-gray-600">
                <strong>Building:</strong> {selectedRequest.waterPointId?.building || "—"} &bull;{" "}
                <strong>Floor:</strong> {selectedRequest.waterPointId?.floor || "—"} &bull;{" "}
                <strong>Landmark:</strong> {selectedRequest.waterPointId?.landmark || "—"}
              </p>
              {selectedRequest.waterPointId?.latitude != null && (
                <p className="text-gray-500 font-mono">
                  Coordinates: {selectedRequest.waterPointId.latitude.toFixed(6)}, {selectedRequest.waterPointId.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Assign Staff Dropdown (Shown when acknowledged or assigned) */}
            {(selectedRequest.status === "acknowledged" ||
              selectedRequest.status === "assigned") && (
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Assign Campus Facilities Staff
                </h4>
                {activeStaffOptions.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    No active staff members found. Please add or activate staff in the Staff tab first.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                    <div className="flex-1">
                      <Select
                        label="Select Active Staff Member"
                        id="staff-select"
                        options={activeStaffOptions}
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        placeholder="Choose a staff member..."
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Linked Student Reports */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 text-sm">
                  Linked Student Reports ({selectedRequest.reportIds?.length || 0})
                </h4>
                <span className="text-xs text-gray-500">
                  Privacy-protected: Names only
                </span>
              </div>

              {(!selectedRequest.reportIds || selectedRequest.reportIds.length === 0) ? (
                <p className="text-xs text-gray-500 italic">No detailed report records attached.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {selectedRequest.reportIds.map((rep, idx) => (
                    <div key={rep._id || idx} className="p-3 bg-white text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-gray-800">
                        <span>👤 {rep.userId?.name || "Student"}</span>
                        <span className="text-gray-400 font-normal">{formatRelativeTime(rep.createdAt)}</span>
                      </div>
                      {rep.description ? (
                        <p className="text-gray-600 bg-gray-50 p-2 rounded text-[11px] leading-relaxed">
                          &ldquo;{rep.description}&rdquo;
                        </p>
                      ) : (
                        <p className="text-gray-400 italic text-[11px]">No additional comment provided.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog for Final Completion */}
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Mark Water Point as Available?"
        message="This will complete the maintenance workflow, set the water point's availability back to 'Available', restore normal temperature/cleanliness, and mark all linked student reports as resolved."
        confirmText="Confirm &amp; Restore Available"
        cancelText="Cancel"
        variant="primary"
        loading={actionLoading}
        onConfirm={handleComplete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
