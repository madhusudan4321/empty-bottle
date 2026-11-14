"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageLayout from "@/components/ui/PageLayout";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";
import EmptyState from "@/components/ui/EmptyState";
import Tabs from "@/components/ui/Tabs";
import {
  AvailabilityBadge,
  CrowdBadge,
  CleanlinessBadge,
  TemperatureBadge,
} from "@/components/ui/Badge";
import { apiFetch } from "@/lib/api";
import { useCrowd } from "@/hooks/useCrowd";
import { useMyLocation } from "@/hooks/useMyLocation";
import WaterMapClient from "@/components/map/WaterMapClient";
import {
  getDistanceInMeters,
  formatDistance,
  formatRelativeTime,
} from "./distance";

function WaterPointsContent({ userPosition = null }) {
  const searchParams = useSearchParams();
  const viewParam = searchParams?.get("view");

  const [activeTab, setActiveTab] = useState(
    viewParam === "map" ? "map" : "list"
  );
  const [selectedId, setSelectedId] = useState(null);

  const { crowdById } = useCrowd();
  const {
    position: myPosition,
    error: locError,
    request: onRequestLocation,
  } = useMyLocation();

  const effectivePosition = myPosition || userPosition;

  const [waterPoints, setWaterPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (viewParam === "map") {
      setActiveTab("map");
    }
  }, [viewParam]);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch("/api/water-points");
      setWaterPoints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load water points");
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

  // When effectivePosition is present: sort by proximity; otherwise sort alphabetically by name
  const sortedWaterPoints = useMemo(() => {
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
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    return [...waterPoints].sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [waterPoints, effectivePosition]);

  const tabs = [
    {
      id: "list",
      label: "List View",
      icon: "📋",
      count: sortedWaterPoints.length,
    },
    { id: "map", label: "Campus Map", icon: "🗺️" },
  ];

  return (
    <PageLayout
      title="Campus Water Points"
      subtitle={
        effectivePosition
          ? "Drinking water dispensers sorted by proximity to your current location."
          : "All campus drinking water dispensers and live statuses."
      }
      actions={
        <Link href="/reports/new">
          <Button variant="outline" size="sm">
            ⚠️ Report Outage
          </Button>
        </Link>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-gray-500">Loading water points...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mb-6">
          <ErrorMessage
            title="Failed to load water points"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && sortedWaterPoints.length === 0 && (
        <EmptyState
          title="No Water Points Found"
          description="There are currently no drinking water points registered in the system."
        />
      )}

      {/* Main Content with Tabs */}
      {!loading && !error && sortedWaterPoints.length > 0 && (
        <div className="space-y-6">
          {/* View Toggle Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />

          {/* Map View */}
          {activeTab === "map" && (
            <div className="space-y-3">
              {locError && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                  <span>📍 {locError}</span>
                </div>
              )}
              <WaterMapClient
                waterPoints={sortedWaterPoints}
                crowdById={crowdById}
                selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)}
                userPosition={effectivePosition}
                onRequestLocation={onRequestLocation}
                height="70vh"
              />
            </div>
          )}

          {/* List View */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {sortedWaterPoints.map((wp) => (
                <Card
                  key={wp._id}
                  className="hover:border-blue-300 transition-all shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left Column: Details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/water-points/${wp._id}`}
                            className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {wp.name}
                          </Link>
                          {wp.distance != null && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              {formatDistance(wp.distance)} away
                            </span>
                          )}
                        </div>

                        {(wp.building || wp.floor || wp.landmark) && (
                          <p className="text-xs text-gray-600 font-medium">
                            {[
                              wp.building,
                              wp.floor ? `Floor ${wp.floor}` : null,
                              wp.landmark ? `Near ${wp.landmark}` : null,
                            ]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}

                        <p className="text-xs text-gray-500">
                          <strong>Location (GPS):</strong> Lat{" "}
                          {wp.latitude != null ? wp.latitude.toFixed(5) : "—"}, Long{" "}
                          {wp.longitude != null ? wp.longitude.toFixed(5) : "—"}
                        </p>

                        <p className="text-xs text-gray-400">
                          Last updated {formatRelativeTime(wp.lastUpdated)}
                        </p>
                      </div>

                      {/* Right Column: Actions */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setSelectedId(wp._id);
                            setActiveTab("map");
                          }}
                        >
                          🗺️ Show on map
                        </Button>
                        <Link href={`/reports/new?waterPointId=${wp._id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-amber-700 hover:bg-amber-50"
                          >
                            Report Issue
                          </Button>
                        </Link>
                        <Link href={`/water-points/${wp._id}`}>
                          <Button variant="primary" size="sm" className="text-xs">
                            View Details &rarr;
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Status Badges Row */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
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
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default function WaterPointsPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <PageLayout title="Campus Water Points">
            <div className="py-16 flex flex-col items-center justify-center">
              <Spinner size="lg" />
              <p className="mt-3 text-sm text-gray-500">Loading water points...</p>
            </div>
          </PageLayout>
        }
      >
        <WaterPointsContent />
      </Suspense>
    </ProtectedRoute>
  );
}
