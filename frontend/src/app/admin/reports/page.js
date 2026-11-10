"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "../../water-points/distance";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [waterPoints, setWaterPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedWpId, setSelectedWpId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [repData, wpData] = await Promise.all([
        apiFetch("/api/admin/reports"),
        apiFetch("/api/water-points"),
      ]);
      setReports(Array.isArray(repData) ? repData : []);
      setWaterPoints(Array.isArray(wpData) ? wpData : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Read URL query param ?status= if present on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const st = params.get("status");
      if (st) {
        setStatusFilter(st);
      }
    }
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Status filter
      if (statusFilter !== "all" && rep.status !== statusFilter) return false;
      // Water point filter
      if (selectedWpId !== "all" && rep.waterPointId?._id !== selectedWpId) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (rep.description || "").toLowerCase();
        const reporter = (rep.userId?.name || "").toLowerCase();
        const wpName = (rep.waterPointId?.name || "").toLowerCase();
        const issue = (rep.issueType || "").toLowerCase();
        if (
          !desc.includes(q) &&
          !reporter.includes(q) &&
          !wpName.includes(q) &&
          !issue.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [reports, statusFilter, selectedWpId, searchQuery]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Student Reports Directory"
        subtitle="All reported issues submitted by campus students across university water points"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="flex items-center gap-1.5"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </Button>
        }
      />
      {/* Filter Toolbar */}
      <Card className="mb-6">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search reports by student, issue, description..."
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
              <option value="all">All Report Statuses</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Water Point Filter */}
            <select
              value={selectedWpId}
              onChange={(e) => setSelectedWpId(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              <option value="all">All Water Points</option>
              {waterPoints.map((wp) => (
                <option key={wp._id} value={wp._id}>
                  {wp.name}
                </option>
              ))}
            </select>

            {(statusFilter !== "all" || selectedWpId !== "all" || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedWpId("all");
                  setSearchQuery("");
                }}
                className="text-xs text-gray-500"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table / Mobile Cards */}
      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : error ? (
        <ErrorMessage
          title="Could not load reports"
          message={error}
          onRetry={fetchData}
        />
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="No reports match your filters"
          description={
            searchQuery || statusFilter !== "all" || selectedWpId !== "all"
              ? "Try adjusting your search query or changing filters."
              : "No issues have been reported by students yet."
          }
          action={
            searchQuery || statusFilter !== "all" || selectedWpId !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSelectedWpId("all");
                  setSearchQuery("");
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
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50/75 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">
                    Reporter
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Water Point &amp; Location
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Issue Type
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Description
                  </th>
                  <th scope="col" className="px-4 py-3.5">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right">
                    Age
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredReports.map((rep) => {
                  const wp = rep.waterPointId || {};
                  const loc = [wp.building, wp.floor ? `Floor ${wp.floor}` : null]
                    .filter(Boolean)
                    .join(" • ");

                  return (
                    <tr key={rep._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-900">
                        👤 {rep.userId?.name || "Student"}
                      </td>
                      <td className="px-4 py-4 min-w-[180px]">
                        <div className="font-semibold text-gray-900">{wp.name || "Unknown"}</div>
                        {loc && <div className="text-xs text-gray-500 mt-0.5">{loc}</div>}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-gray-800">
                        {ISSUE_TYPE_LABELS[rep.issueType] || rep.issueType}
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-600 max-w-xs">
                        {rep.description ? (
                          <span className="line-clamp-2" title={rep.description}>
                            &ldquo;{rep.description}&rdquo;
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">No description</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={rep.status} size="sm" />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-xs text-gray-500">
                        {formatRelativeTime(rep.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-gray-100">
            {filteredReports.map((rep) => {
              const wp = rep.waterPointId || {};
              const loc = [wp.building, wp.floor ? `Floor ${wp.floor}` : null]
                .filter(Boolean)
                .join(" • ");

              return (
                <div key={rep._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{wp.name}</div>
                      {loc && <div className="text-xs text-gray-500">{loc}</div>}
                    </div>
                    <StatusBadge status={rep.status} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-800">
                      {ISSUE_TYPE_LABELS[rep.issueType] || rep.issueType}
                    </span>
                    <span className="text-gray-400">&bull;</span>
                    <span className="text-gray-500">By {rep.userId?.name || "Student"}</span>
                  </div>

                  {rep.description && (
                    <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
                      &ldquo;{rep.description}&rdquo;
                    </p>
                  )}

                  <div className="text-[11px] text-gray-400 pt-1 text-right">
                    {formatRelativeTime(rep.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
