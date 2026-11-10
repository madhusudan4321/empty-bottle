"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import StatCard from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { PriorityBadge, MaintenanceStatusBadge } from "@/components/ui/Badge";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "../water-points/distance";

export default function AdminDashboardPage() {
  const [overview, setOverview] = useState(null);
  const [highPriorityRequests, setHighPriorityRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, maintenanceData] = await Promise.all([
        apiFetch("/api/admin/overview"),
        apiFetch("/api/maintenance"),
      ]);

      setOverview(overviewData || null);

      // Filter for open requests (status not available) and take top 5
      const openRequests = Array.isArray(maintenanceData)
        ? maintenanceData.filter((r) => r.status !== "available").slice(0, 5)
        : [];
      setHighPriorityRequests(openRequests);

      setLastUpdated(Date.now());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load admin overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Live timer for "Updated N s ago"
  useEffect(() => {
    if (!lastUpdated) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));
      setSecondsAgo(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Admin Dashboard"
          subtitle="Campus water infrastructure status and maintenance operations"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 h-64 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Admin Dashboard"
          subtitle="Campus water infrastructure status and maintenance operations"
        />
        <ErrorMessage
          title="Could not load dashboard data"
          message={error}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const wp = overview?.waterPoints || {};
  const rep = overview?.reports || {};
  const maint = overview?.maintenance || {};
  const byStatus = maint?.byStatus || {};

  const totalOpenRequests = maint.totalOpen || 0;

  // Max count for chart scaling
  const maxStatusCount = Math.max(
    1,
    ...Object.values(byStatus).map((v) => Number(v) || 0)
  );

  const statusBars = [
    { key: "reported", label: "Reported", count: byStatus.reported || 0, color: "bg-amber-500", text: "text-amber-700" },
    { key: "acknowledged", label: "Acknowledged", count: byStatus.acknowledged || 0, color: "bg-blue-500", text: "text-blue-700" },
    { key: "assigned", label: "Assigned", count: byStatus.assigned || 0, color: "bg-purple-500", text: "text-purple-700" },
    { key: "in_progress", label: "In Progress", count: byStatus.in_progress || 0, color: "bg-cyan-500", text: "text-cyan-700" },
    { key: "fixed", label: "Fixed", count: byStatus.fixed || 0, color: "bg-emerald-500", text: "text-emerald-700" },
    { key: "verified", label: "Verified", count: byStatus.verified || 0, color: "bg-teal-500", text: "text-teal-700" },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Overview of campus water infrastructure, open reports, and maintenance workload"
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">
              Updated {secondsAgo}s ago
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="flex items-center gap-1.5 shadow-sm"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </Button>
          </div>
        }
      />
      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Water Points"
          value={wp.total || 0}
          icon="🚰"
          variant="blue"
          href="/admin/water-points"
          subtitle={`${wp.available || 0} operational across campus`}
        />

        <StatCard
          title="Points in Maintenance"
          value={wp.maintenance || 0}
          icon="🛠️"
          variant="amber"
          href="/admin/water-points"
          subtitle={`${wp.unavailable || 0} completely unavailable`}
        />

        <StatCard
          title="Open Reports"
          value={rep.open || 0}
          icon="📋"
          variant="red"
          href="/admin/reports"
          subtitle="Submitted by students awaiting fix"
        />

        <StatCard
          title="Avg Time to Fix"
          value={
            maint.avgTimeToFixHours != null
              ? `${maint.avgTimeToFixHours} hrs`
              : "—"
          }
          icon="⏱️"
          variant="green"
          href="/admin/maintenance"
          subtitle={`${maint.completedCount || 0} requests resolved total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* "Needs Attention" List (Highest Priority Open Requests) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Needs Immediate Attention</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Top open maintenance requests sorted by reporter consensus and urgency
                </p>
              </div>
              <Link href="/admin/maintenance">
                <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                  View all ({totalOpenRequests}) &rarr;
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {highPriorityRequests.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    title="No open maintenance issues"
                    description="All reported drinking points have been inspected, fixed, and verified."
                    action={
                      <Link href="/admin/water-points">
                        <Button variant="outline" size="sm">
                          Browse Water Points
                        </Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {highPriorityRequests.map((req) => {
                    const wpInfo = req.waterPointId || {};
                    const loc = [
                      wpInfo.building,
                      wpInfo.floor ? `Floor ${wpInfo.floor}` : null,
                    ]
                      .filter(Boolean)
                      .join(" • ");

                    return (
                      <div
                        key={req._id}
                        className="p-4 sm:p-5 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 text-sm truncate">
                              {wpInfo.name || "Unknown Water Point"}
                            </span>
                            <PriorityBadge priority={req.priority} size="sm" />
                            <MaintenanceStatusBadge status={req.status} size="sm" />
                          </div>

                          <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                            <span>Issue: <strong>{req.issue}</strong></span>
                            {loc && <span>&bull; {loc}</span>}
                            <span>&bull; {req.distinctReporterCount || 1} distinct reporter(s)</span>
                            <span>&bull; {formatRelativeTime(req.createdAt)}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <Link href={`/admin/maintenance?id=${req._id}`}>
                            <Button variant="outline" size="sm">
                              Inspect &rarr;
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Requests by Status Bar Chart */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workload by Status</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Current distribution of open pipeline requests
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {statusBars.map((bar) => {
                const percentage =
                  totalOpenRequests > 0
                    ? Math.round((bar.count / maxStatusCount) * 100)
                    : 0;

                return (
                  <div key={bar.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700">
                        {bar.label}
                      </span>
                      <span className={`font-bold ${bar.text}`}>
                        {bar.count}
                      </span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                        style={{ width: `${Math.max(bar.count > 0 ? 8 : 0, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                <span>Total in pipeline:</span>
                <span className="text-sm font-bold text-gray-900">
                  {totalOpenRequests} requests
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100">
            <CardContent className="p-5 space-y-3">
              <h4 className="text-sm font-bold text-blue-900">
                Admin Shortcuts
              </h4>
              <div className="flex flex-col gap-2">
                <Link href="/admin/maintenance">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-white text-xs">
                    🛠️ Manage Maintenance Workflow
                  </Button>
                </Link>
                <Link href="/admin/staff">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-white text-xs">
                    👥 Add / Manage Staff Members
                  </Button>
                </Link>
                <Link href="/admin/water-points">
                  <Button variant="outline" size="sm" className="w-full justify-start bg-white text-xs">
                    🚰 Add Water Point (GPS Location)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
