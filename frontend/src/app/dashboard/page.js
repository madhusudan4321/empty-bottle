"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLayout from "@/components/ui/PageLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import {
  AvailabilityBadge,
  CrowdBadge,
  CleanlinessBadge,
  TemperatureBadge,
  StatusBadge,
} from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useCrowd } from "@/hooks/useCrowd";
import { useMyLocation } from "@/hooks/useMyLocation";
import WaterMapClient from "@/components/map/WaterMapClient";
import ShareLocationToggle from "@/components/crowd/ShareLocationToggle";
import { apiFetch } from "@/lib/api";
import { ISSUE_TYPE_LABELS } from "@/lib/constants";
import {
  getDistanceInMeters,
  formatDistance,
  formatRelativeTime,
} from "../water-points/distance";

function DashboardContent({ userPosition = null }) {
  const { user } = useAuth();
  const { crowdById } = useCrowd();
  const {
    position: myPosition,
    request: onRequestLocation,
  } = useMyLocation();

  const effectivePosition = myPosition || userPosition;

  const [waterPoints, setWaterPoints] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [wpData, repData] = await Promise.all([
        apiFetch("/api/water-points"),
        apiFetch("/api/reports/my"),
      ]);
      setWaterPoints(Array.isArray(wpData) ? wpData : []);
      setReports(Array.isArray(repData) ? repData : []);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    fetchData();
  };

  // Points to display: when effectivePosition exists, sort nearest first; otherwise take first 3 available ones sorted by name
  const displayPoints = useMemo(() => {
    if (
      effectivePosition &&
      typeof effectivePosition.latitude === "number" &&
      typeof effectivePosition.longitude === "number"
    ) {
      return [...waterPoints]
        .map((wp) => ({
          ...wp,
          distance: getDistanceInMeters(
            effectivePosition.latitude,
            effectivePosition.longitude,
            wp.latitude,
            wp.longitude
          ),
        }))
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, 3);
    }

    // No user position: first 3 available ones (sorted by name), or first 3 overall if none available
    const available = waterPoints.filter((wp) => wp.availability === "available");
    const pool = available.length > 0 ? available : waterPoints;
    return [...pool]
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .slice(0, 3);
  }, [waterPoints, effectivePosition]);

  const recentReports = reports.slice(0, 2);

  return (
    <PageLayout
      title={`Hi, ${user?.name || "Student"} 👋`}
      subtitle="Find clean, cold drinking water points across campus and report outages."
    >
      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/water-points" className="block group">
          <Card className="h-full hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-blue-100 rounded-xl text-blue-600">
                🚰
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Find Drinking Water
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  View all campus water dispensers and check live operational status.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports/new" className="block group">
          <Card className="h-full hover:border-amber-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-amber-100 rounded-xl text-amber-600">
                ⚠️
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Report a Problem
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Let facilities know about empty dispensers, warm water, dirt, or leaks.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/reports" className="block group">
          <Card className="h-full hover:border-emerald-300 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-5 flex items-start gap-4">
              <span className="text-3xl p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
                📋
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  My Reports History
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Track resolution progress on issues you reported to campus staff.
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Share Location for Crowd Estimation */}
      <div className="mb-8">
        <ShareLocationToggle />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">Loading campus data...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-8">
          <ErrorMessage
            title="Failed to load dashboard data"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && waterPoints.length === 0 && (
        <div className="mb-8">
          <EmptyState
            title="No Water Points Found"
            description="There are currently no drinking water points registered in the database."
          />
        </div>
      )}

      {/* Content grid when data loaded */}
      {!loading && !error && waterPoints.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Water Points Summary */}
          <div className="lg:col-span-2 space-y-4">
            {/* Campus Map Preview Card */}
            <Card className="overflow-hidden shadow-sm hover:border-gray-300 transition-all">
              <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">🗺️</span>
                  <h3 className="font-bold text-gray-900 text-sm">
                    Interactive Campus Map
                  </h3>
                </div>
                <Link
                  href="/water-points?view=map"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  <span>Open full map</span>
                  <span>&rarr;</span>
                </Link>
              </div>
              <CardContent className="p-0">
                <WaterMapClient
                  waterPoints={waterPoints}
                  crowdById={crowdById}
                  userPosition={effectivePosition}
                  onRequestLocation={onRequestLocation}
                  height="35vh"
                />
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-lg font-bold text-gray-900">
                {effectivePosition ? "Nearest Water Points" : "Water points"}
              </h2>
              <Link
                href="/water-points"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View all points &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {displayPoints.map((wp) => (
                <Card
                  key={wp._id}
                  className="hover:border-gray-300 transition-all"
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 text-base">
                            {wp.name}
                          </h3>
                        </div>

                        {(wp.building || wp.floor || wp.landmark) && (
                          <p className="text-xs text-gray-600 mt-0.5 font-medium">
                            {[
                              wp.building,
                              wp.floor ? `Floor ${wp.floor}` : null,
                              wp.landmark ? `Near ${wp.landmark}` : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          Coordinates: {wp.latitude?.toFixed(4)},{" "}
                          {wp.longitude?.toFixed(4)}
                          {wp.distance != null && (
                            <>
                              {" "}
                              &bull;{" "}
                              <span className="font-medium text-blue-700">
                                {formatDistance(wp.distance)} away
                              </span>
                            </>
                          )}
                        </p>

                        <p className="text-xs text-gray-400 mt-0.5">
                          Updated {formatRelativeTime(wp.lastUpdated)}
                        </p>
                      </div>

                      <Link href={`/water-points/${wp._id}`}>
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                      </Link>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
                      <AvailabilityBadge availability={wp.availability} />
                      <TemperatureBadge temperature={wp.temperature} />
                      <CleanlinessBadge cleanliness={wp.cleanliness} />
                      {crowdById?.[wp._id] ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <CrowdBadge
                            level={crowdById[wp._id].level}
                            percentage={crowdById[wp._id].percentage}
                          />
                          <span className="text-xs text-gray-500 font-medium">
                            {crowdById[wp._id].count} people nearby (estimated)
                          </span>
                        </div>
                      ) : (
                        <CrowdBadge level={null} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Reports / Campus Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Your Recent Reports</h2>
              <Link
                href="/reports"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                See all
              </Link>
            </div>

            {recentReports.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-xs text-gray-500">
                  No active issue reports. Everything looks clear!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentReports.map((report) => {
                  const wpName =
                    typeof report.waterPointId === "object" &&
                    report.waterPointId?.name
                      ? report.waterPointId.name
                      : "Campus Water Point";

                  const issueLabel =
                    ISSUE_TYPE_LABELS[report.issueType] ||
                    (report.issueType || "").replace(/_/g, " ");

                  return (
                    <Card key={report._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 capitalize">
                              {issueLabel}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {wpName}
                            </p>
                          </div>
                          <StatusBadge status={report.status} />
                        </div>
                        {report.description && (
                          <p className="text-xs text-gray-600 mt-2 line-clamp-2 bg-gray-50 p-2 rounded">
                            &ldquo;{report.description}&rdquo;
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">
                          Submitted {formatRelativeTime(report.createdAt)}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Notice about Privacy / Presence */}
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4">
                <h4 className="text-xs font-semibold text-slate-800">
                  🔒 Privacy &amp; Crowd Estimation
                </h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Crowd levels are aggregate estimates calculated automatically. Your
                  exact location is never stored or displayed to other students.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute roles={["student"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
